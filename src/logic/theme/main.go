package logictheme

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"fmt"
	"os"
	"sync"
)

var (
	curTheme  = "light"
	themeMu sync.RWMutex
)

func GetThemeMode() string {
	themeMu.RLock()
	defer themeMu.RUnlock()
	return curTheme
}

func SetThemeMode(mode string) {
	themeMu.Lock()
	defer themeMu.Unlock()
	curTheme = mode
}

// 读取主题配置文件并发送给前端
func GetThemeVariables() string {
	targetPath := paths.GetStoragePersonalThemeFilePath()
	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		targetPath = paths.GetStorageThemeFilePath()
	}
	// 读取配置文件
	themeVars, err := LoadThemeVariables(targetPath)
	if err != nil {
		logger.Error("读取主题配置失败: %v", err)
	}
	return themeVars
}

// loadThemeVariables 读取主题变量配置文件
func LoadThemeVariables(filePath string) (string, error) {
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		logger.Error("主题配置文件不存在，使用默认配置", filePath)
		return "{}", nil
	}

	// 读取文件
	data, err := os.ReadFile(filePath)
	if err != nil {
		logger.Error("读取主题配置文件失败: %v", err)
		return "{}", fmt.Errorf("读取文件失败: %v", err)
	}
	return string(data), nil
}

func SetThemeVariables(variables string, isForce bool) error {
	targetPath := paths.GetStoragePersonalThemeFilePath()
	if _, err := os.Stat(targetPath); !isForce && os.IsNotExist(err) {
		targetPath = paths.GetStorageThemeFilePath()
	}
	// 写入配置文件
	err := os.WriteFile(targetPath, []byte(variables), 0644)
	if err != nil {
		return fmt.Errorf("写入主题配置失败: %v", err)
	}
	return nil
}
