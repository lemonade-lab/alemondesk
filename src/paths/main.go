package paths

import (
	"alemonapp/src/config"
	"os"
	"os/user"
	"path/filepath"
	"runtime"
)

func GetUserHomeDir() string {
	appName := "ALemonDesk"
	usr, err := user.Current()
	if err != nil {
		// 如果获取用户失败，尝试从环境变量获取
		home := os.Getenv("HOME")
		if home == "" {
			home = os.Getenv("USERPROFILE") // Windows
		}
		if home == "" {
			// 最后的回退方案：使用临时目录
			home = os.TempDir()
		}
		return filepath.Join(home, appName)
	}
	
	home := usr.HomeDir
	switch runtime.GOOS {
	case "windows":
		appData := os.Getenv("APPDATA")
		if appData != "" {
			return filepath.Join(appData, appName)
		}
		return filepath.Join(home, appName)
	case "darwin":
		return filepath.Join(home, "Library", "Application Support", appName)
	default: // linux
		config := os.Getenv("XDG_CONFIG_HOME")
		if config != "" {
			return filepath.Join(config, appName)
		}
		return filepath.Join(home, ".config", appName)
	}
}

// 获取工作目录
func GetWorkPath() string {
	if !config.IsDev() {
		// 生产环境使用用户应用数据目录
		homeDir := GetUserHomeDir()
		return filepath.Join(homeDir, "work")
	}
	return filepath.Join("work")
}

// 资源目录
func GetResourcePath() string {
	workPath := GetWorkPath()
	resourcePath := filepath.Join(workPath, "resources")
	return resourcePath
}

// 获取机器人模板目录
func GetBotTemplate() string {
	resPath := GetResourcePath()
	return filepath.Join(resPath, "template")
}

// 存储目录
func GetStoragePath() string {
	resPath := GetResourcePath()
	storagePath := filepath.Join(resPath, "storage")
	return storagePath
}

// YARN文件
func GetNodeYarnScriptFilePath() string {
	// 相对于当前机器人的
	return filepath.Join("..", "..", "yarn", "bin", "yarn.cjs")
}

// logs 目录
func GetLogsPath() string {
	workPath := GetWorkPath()
	logsPath := filepath.Join(workPath, "logs")
	return logsPath
}
