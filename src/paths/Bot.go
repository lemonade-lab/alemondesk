package paths

import "path/filepath"

// 创建机器人路径
func CreateBotPath(botName string) string {
	resourcePath := GetResourcePath()
	return filepath.Join(resourcePath, "bots", botName)
}

func GetBotPath(botName string) string {
	return CreateBotPath(botName)
}

// 得到机器人入口文件
func GetBotEntryFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "alemonjs", "index.js")
}

// 得到机器人桌面入口文件
func GetBotDesktopEntryFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "alemonjs", "desktop.js")
}

// 得到机器人依赖文件路径
func GetBotDependencyPath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "node_modules")
}

// 得到机器人配置文件路径
func GetBotConfigFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "alemon.config.yaml")
}

// 得到机器人yarn.lock文件路径
func GetBotYarnLockFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "yarn.lock")
}

// 得到机器人package.json文件路径
func GetBotPackageJsonFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "package.json")
}

// 得到机器人packages目录路径
func GetBotPackagesPath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "packages")
}

// 得到机器人logs目录路径
func GetBotLogsPath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "logs")
}

// 得到机器人plugins目录路径
func GetBotPluginsPath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, "plugins")
}

func GetBotEnvFilePath(botName string) string {
	botPath := CreateBotPath(botName)
	return filepath.Join(botPath, ".env")
}

// 获取指定名机器人的 PID 文件路径
func GetPidFilePath(name string) string {
	resourcePath := GetResourcePath()
	return filepath.Join(resourcePath, "process", name+".pid")
}
