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
	"strings"
	"sync"
)

var (
	resourcesFiles fs.FS
	resourcesMu    sync.RWMutex
)

// copyResourceFile 复制单个资源文件（避免 defer 累积）
func copyResourceFile(sourcePath, targetPath string) error {
	resourcesMu.RLock()
	defer resourcesMu.RUnlock()

	if resourcesFiles == nil {
		return fmt.Errorf("资源文件系统未初始化")
	}

	curFile, err := resourcesFiles.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("打开资源文件失败: %w", err)
	}
	defer curFile.Close()

	file, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, curFile); err != nil {
		return fmt.Errorf("复制文件失败: %w", err)
	}

	return nil
}

// init 函数用于解压资源
func Create(ResourcesFiles fs.FS) {
	resourcesMu.Lock()
	resourcesFiles = ResourcesFiles
	resourcesMu.Unlock()

	workPAth := paths.GetWorkPath()

	// 解压资源
	resourcesMu.RLock()
	resources := resourcesFiles
	resourcesMu.RUnlock()

	err := fs.WalkDir(resources, ".", func(p string, d fs.DirEntry, err error) error {
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
			// 复制文件（使用独立函数避免 defer 累积）
			if err := copyResourceFile(p, targetPath); err != nil {
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

// Reset 恢复指定路径下的文件
func Reset(curTargetPath string) error {
	resourcesMu.RLock()
	resources := resourcesFiles
	resourcesMu.RUnlock()

	if resources == nil {
		return fmt.Errorf("资源文件系统未初始化")
	}

	workPAth := paths.GetWorkPath()
	// 解压资源
	err := fs.WalkDir(resources, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			logger.Error("资源初始化失败: %v", err)
			return err
		}
		// 计算目标路径
		targetPath := filepath.Join(workPAth, p)

		// 检查当前资源路径是否以目标路径开头
		if !strings.HasPrefix(targetPath, curTargetPath) {
			logger.Debug("跳过资源路径: %s", targetPath, curTargetPath)
			return nil
		}

		// 如果是目录
		if d.IsDir() {
			// 创建目录
			if err := os.MkdirAll(targetPath, os.ModePerm); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		} else {
			// 复制文件（使用独立函数避免 defer 累积）
			if err := copyResourceFile(p, targetPath); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		}
		return nil
	})
	if err != nil {
		logger.Error("资源初始化失败:", err)
		return err
	}
	return nil
}

// ResetSingleFile 恢复单个文件
func ResetSingleFile(targetPath string) error {
	resourcesMu.RLock()
	resources := resourcesFiles
	resourcesMu.RUnlock()

	if resources == nil {
		return fmt.Errorf("资源文件系统未初始化")
	}

	logger.Debug("开始恢复单个文件: %s", targetPath)

	// 直接尝试打开资源文件（使用相对路径）
	curFile, err := resources.Open(targetPath)
	if err != nil {
		return fmt.Errorf("打开资源文件失败: %w", err)
	}
	defer curFile.Close()

	// 检查是否为目录
	fileInfo, err := curFile.Stat()
	if err != nil {
		return fmt.Errorf("获取文件信息失败: %w", err)
	}

	if fileInfo.IsDir() {
		return fmt.Errorf("指定路径是目录，不是文件: %s", targetPath)
	}

	workPath := paths.GetWorkPath()
	fullTargetPath := filepath.Join(workPath, targetPath)

	// 确保目标目录存在
	targetDir := filepath.Dir(fullTargetPath)
	if err := os.MkdirAll(targetDir, os.ModePerm); err != nil {
		return fmt.Errorf("创建目标目录失败: %w", err)
	}

	// 创建目标文件
	file, err := os.Create(fullTargetPath)
	if err != nil {
		return fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer file.Close()

	// 复制文件内容
	if _, err := io.Copy(file, curFile); err != nil {
		return fmt.Errorf("复制文件内容失败: %w", err)
	}

	logger.Info("文件恢复成功: %s", targetPath)
	return nil
}

// restoreSingleFile 恢复单个文件
func restoreSingleFile(sourcePath, targetPath string) error {
	resourcesMu.RLock()
	resources := resourcesFiles
	resourcesMu.RUnlock()

	if resources == nil {
		return fmt.Errorf("资源文件系统未初始化")
	}

	// 打开源文件
	curFile, err := resources.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("打开源文件失败: %w", err)
	}
	defer curFile.Close()

	// 确保目标目录存在
	targetDir := filepath.Dir(targetPath)
	if err := os.MkdirAll(targetDir, os.ModePerm); err != nil {
		return fmt.Errorf("创建目标目录失败: %w", err)
	}

	// 创建目标文件
	file, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer file.Close()

	// 复制文件内容
	if _, err := io.Copy(file, curFile); err != nil {
		return fmt.Errorf("复制文件内容失败: %w", err)
	}

	return nil
}

// ResetWithFilter 恢复指定路径下的文件，可自定义过滤条件
func ResetWithFilter(targetPath string, filter func(path string, d fs.DirEntry) bool) error {
	resourcesMu.RLock()
	resources := resourcesFiles
	resourcesMu.RUnlock()

	if resources == nil {
		return fmt.Errorf("资源文件系统未初始化")
	}

	workPath := paths.GetWorkPath()

	return fs.WalkDir(resources, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// 检查路径匹配和过滤条件
		if !strings.HasPrefix(p, targetPath) {
			return nil
		}

		if filter != nil && !filter(p, d) {
			return nil
		}

		actualTargetPath := filepath.Join(workPath, p)

		if d.IsDir() {
			return os.MkdirAll(actualTargetPath, os.ModePerm)
		} else {
			return restoreSingleFile(p, actualTargetPath)
		}
	})
}

func getNodejsResourcePath() string {
	return filepath.Join(paths.GetResourcePath(), "nodejs")
}

// 得到nodejs压缩包地址
func GetNodejsArchivePath() string {
	pkgName := "node.tar.xz"
	if runtime.GOOS == "windows" {
		pkgName = "node.zip"
	}
	return filepath.Join(paths.GetWorkPath(), "resources", pkgName)
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
		return "", fmt.Errorf("failed to read nodejs directory: %w", err)
	}

	// 检查目录是否为空
	if len(entries) == 0 {
		return "", fmt.Errorf("no nodejs version found in %s", nodejsBasePath)
	}

	// 找到第一个目录作为版本目录
	for _, entry := range entries {
		// 是目录
		if entry.IsDir() {
			versionPath := filepath.Join(nodejsBasePath, entry.Name())

			nodeName := "node"
			if runtime.GOOS == "windows" {
				nodeName = "node.exe"
			}

			exePath := filepath.Join(versionPath, "bin", nodeName)
			if _, err := os.Stat(exePath); os.IsNotExist(err) {
				// 尝试无 bin
				exePath = filepath.Join(versionPath, nodeName)
				if _, err := os.Stat(exePath); os.IsNotExist(err) {
					// 不存在
					continue
				}
			}

			m.mu.Lock()
			m.nodeJSPath = versionPath
			m.mu.Unlock()
			return versionPath, nil
		}
	}

	return "", fmt.Errorf("no nodejs directory found in %s", nodejsBasePath)
}

// 得到系统的 Node.js 可执行文件路径
func GetSystemExePath() (string, error) {
	// 未找到 Node.js 路径，尝试从系统环境变量中获取
	systemNode, err := exec.LookPath("node")
	if err != nil {
		return "", fmt.Errorf("node.js not found in managed path or system PATH: %w", err)
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

	// 优先使用系统nodejs路径
	systemNode, err := GetSystemExePath()
	if err == nil {
		m.mu.Lock()
		m.nodeExePath = systemNode
		m.mu.Unlock()
		return m.nodeExePath, nil
	}

	// 尝试从管理的 Node.js 中获取
	versionPath, err := m.GetNodeJSPath()
	if err != nil {
		return "", fmt.Errorf("获取 Node.js 路径失败: %w", err)
	}

	nodeName := "node"
	if runtime.GOOS == "windows" {
		nodeName = "node.exe"
	}

	exePath := filepath.Join(versionPath, "bin", nodeName)
	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		// 尝试无 bin
		exePath = filepath.Join(versionPath, nodeName)
		if _, err := os.Stat(exePath); os.IsNotExist(err) {
			return "", fmt.Errorf("node.js 可执行文件不存在: %s", exePath)
		}
	}

	// 检查文件是否存在
	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		return "", fmt.Errorf("node.js 可执行文件不存在: %s", exePath)
	}

	// 确保返回绝对路径
	absExePath, err := filepath.Abs(exePath)
	if err != nil {
		return "", fmt.Errorf("获取 Node.js 可执行文件绝对路径失败: %w", err)
	}

	m.mu.Lock()
	m.nodeExePath = absExePath
	m.mu.Unlock()
	return absExePath, nil
}
