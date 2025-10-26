package paths

import (
	"path/filepath"
)

// 获取机器人模板目录
func GetBotTemplate() string {
	return filepath.Join("resources", "template")
}

// 获取工作目录
func GetWorkPath() string {
	return filepath.Join("work")
}

// 获得前端主题配置文件路径
func GetFrontendThemeConfigFilePath() string {
	workPath := GetWorkPath()
	filePath := filepath.Join(workPath, "resources", "storage", "them.init.json")
	return filePath
}
