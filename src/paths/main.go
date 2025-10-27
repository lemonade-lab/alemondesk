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

// 资源目录
func GetResourcePath() string {
	workPath := GetWorkPath()
	resourcePath := filepath.Join(workPath, "resources")
	return resourcePath
}

// 存储目录
func GetStoragePath() string {
	workPath := GetResourcePath()
	storagePath := filepath.Join(workPath, "storage")
	return storagePath
}

// YARN文件
func GetNodeYarnScriptFilePath() string {
	// 相对于当前机器人的
	return filepath.Join("..", "..", "yarn", "bin", "yarn.cjs")
}
