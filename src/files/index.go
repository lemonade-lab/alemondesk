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
		targetPath := filepath.Join(workPAth, p)
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
		logger.Error("资源初始化失败:", err)
		return
	}
}

func getNodejsResourcePath() string {
	return filepath.Join(paths.GetResourcePath(), "nodejs")
}

// 得到nodejs压缩包地址
func GetNodejsArchivePath() string {
	{
		pkgName := "node.tar.xz"
		if runtime.GOOS == "windows" {
			pkgName = "node.zip"
		}
		return filepath.Join(paths.GetWorkPath(), "resources", pkgName)
	}
}

// 得到依赖压缩包地址
func GetDependenciesArchivePath() string {
	return filepath.Join(paths.GetWorkPath(), "resources", "node_modules.tar.gz")
}

// 解压Nodejs
func ExtractNodeJS() error {
	// 获取 Node.js 压缩包路径
	nodeArchivePath := GetNodejsArchivePath()
	// 目标解压路径
	destPath := getNodejsResourcePath()

	// 解压缩
	if err := utils.ExtractFileTo(nodeArchivePath, destPath); err != nil {
		return fmt.Errorf("解压 Node.js 失败: %w", err)
	}
	return nil
}

// 判断系统是否有 Node.js
func HasSystemNodeJS() bool {
	_, err := exec.LookPath("node")
	return err == nil
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

	// work/resources/nodejs/{version}/node{.exe}
	nodejsBasePath := getNodejsResourcePath()

	// 读取目录
	entries, err := os.ReadDir(nodejsBasePath)
	if err != nil {
		return "", err
	}

	// 找到第一个目录作为版本目录
	for _, entry := range entries {
		if entry.IsDir() {
			versionPath := filepath.Join(nodejsBasePath, entry.Name())
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

	// 判断是否有系统nodejs
	has := HasSystemNodeJS()
	if has {
		// 得到系统nodejs路径
		systemNode, err := GetSystemExePath()
		if err != nil {
			return "", err
		}
		m.mu.Lock()
		m.nodeExePath = systemNode
		m.mu.Unlock()
		return m.nodeExePath, nil
	}

	dir, err := m.GetNodeJSPath()
	if err != nil {
		return "node", nil
	}

	// 确定可执行文件名
	exeName := "node"
	if runtime.GOOS == "windows" {
		exeName = "node.exe"
	}

	// 拼接可执行文件路径
	exePath := filepath.Join(dir, "bin", exeName)

	// 检查文件是否存在
	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		return "node", nil
	}

	// 确保返回绝对路径
	absExePath, err := filepath.Abs(exePath)
	if err != nil {
		return "node", nil
	}

	m.mu.Lock()
	m.nodeExePath = absExePath
	m.mu.Unlock()
	return absExePath, nil
}
