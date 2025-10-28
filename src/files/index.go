package files

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"sync"
)

var resourcesFiles fs.FS

// init 函数用于解压资源
func Create(ResourcesFiles fs.FS) {
	resourcesFiles = ResourcesFiles
	workPAth := paths.GetWorkPath()
	// 解压资源
	err := fs.WalkDir(resourcesFiles, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			logger.Error("资源初始化失败: %v", err)
			return err
		}
		// 计算目标路径
		targetPath := path.Join(workPAth, p)
		// 如果是目录
		if d.IsDir() {
			// 创建目录
			if err := os.MkdirAll(targetPath, os.ModePerm); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		} else {
			// 打开文件
			curFile, err := resourcesFiles.Open(p)
			if err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
			// 关闭文件
			defer curFile.Close()

			// 打开文件
			file, err := os.Create(targetPath)
			if err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
			// 关闭文件
			defer file.Close()

			// 复制文件
			if _, err := io.Copy(file, curFile); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		}
		return nil
	})

	if err != nil {
		logger.Info("资源初始化失败:", err)
		return
	}
}

// 解压Nodejs
func ExtractNodeJS(destPath string) error {
	pkgName := "node.tar.xz"
	if runtime.GOOS == "windows" {
		pkgName = "node.zip"
	}
	// 获取 Node.js 压缩包路径
	nodeArchivePath := path.Join(paths.GetWorkPath(), "resources", pkgName)

	// 解压缩
	if err := utils.ExtractFileTo(nodeArchivePath, destPath); err != nil {
		return fmt.Errorf("解压 Node.js 失败: %w", err)
	}
	return nil
}

// NodeJSManager Node.js 管理器
type NodeJSManager struct {
	nodeJSPath    string
	nodeExePath   string
	isInitialized bool
	mu            sync.RWMutex
}

var (
	instance *NodeJSManager
	once     sync.Once
)

// GetNodeJSManager 获取单例实例
func GetNodeJSManager() *NodeJSManager {
	once.Do(func() {
		instance = &NodeJSManager{}
	})
	return instance
}

func (m *NodeJSManager) SetNodeJSPath(path string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.nodeJSPath = path
	m.nodeExePath = ""
	m.isInitialized = true
	logger.Debug("设置 Node.js 路径: %s", path)
}

func (m *NodeJSManager) GetNodeJSPath() (string, error) {
	m.mu.RLock()

	// 如果已经初始化且有路径，直接返回
	if m.isInitialized && m.nodeJSPath != "" {
		path := m.nodeJSPath
		m.mu.RUnlock()
		return path, nil
	}
	m.mu.RUnlock()

	// 固定格式为 work/resources/nodejs/{version}/node{.exe}
	workPath := paths.GetResourcePath()
	nodejsBasePath := path.Join(workPath, "nodejs")

	// 读取目录
	entries, err := os.ReadDir(nodejsBasePath)
	if err != nil {
		return "", err
	}

	// 找到第一个目录作为版本目录
	for _, entry := range entries {
		if entry.IsDir() {
			versionPath := path.Join(nodejsBasePath, entry.Name())
			m.mu.Lock()
			m.nodeJSPath = versionPath
			m.mu.Unlock()
			return versionPath, nil
		}
	}

	return "", os.ErrNotExist
}

// 得到系统的 Node.js 可执行文件路径
func GetSystemExePath() (string, error) {
	// 未找到 Node.js 路径，尝试从系统环境变量中获取
	systemNode, err := exec.LookPath("node")
	if err != nil {
		return "", fmt.Errorf("Node.js not found in managed path or system PATH: %w", err)
	}
	return systemNode, nil
}

// GetNodeExePath 获取 Node.js 可执行文件路径
func (m *NodeJSManager) GetNodeExePath() (string, error) {
	// 先检查缓存，避免重复计算
	m.mu.RLock()
	if m.nodeExePath != "" {
		cachedPath := m.nodeExePath
		m.mu.RUnlock()
		return cachedPath, nil
	}
	m.mu.RUnlock()

	dir, err := m.GetNodeJSPath()
	if err != nil {
		// 未找到 Node.js 路径，尝试从系统环境变量中获取
		systemNode, err := GetSystemExePath()
		if err != nil {
			return "", err
		}

		m.mu.Lock()
		m.nodeExePath = systemNode
		m.mu.Unlock()
		return systemNode, nil
	}

	// 确定可执行文件名
	exeName := "node"
	if runtime.GOOS == "windows" {
		exeName = "node.exe"
	}

	// 使用 filepath.Join 替代 path.Join 以获得更好的跨平台支持
	exePath := filepath.Join(dir, "bin", exeName)

	// 检查文件是否存在
	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		// 如果指定路径不存在，回退到系统环境变量
		systemNode, err := GetSystemExePath()
		if err != nil {
			return "", err
		}

		m.mu.Lock()
		m.nodeExePath = systemNode
		m.mu.Unlock()
		return systemNode, nil
	}

	// 确保返回绝对路径
	absExePath, err := filepath.Abs(exePath)
	if err != nil {
		systemNode, err := GetSystemExePath()
		if err != nil {
			return "", err
		}
		m.mu.Lock()
		m.nodeExePath = systemNode
		m.mu.Unlock()
		return systemNode, nil
	}

	m.mu.Lock()
	m.nodeExePath = absExePath
	m.mu.Unlock()
	return absExePath, nil
}
