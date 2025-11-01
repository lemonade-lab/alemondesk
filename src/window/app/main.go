package windowapp

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

type PathsState struct {
	UserDataTemplatePath    string `json:"userDataTemplatePath"`
	UserDataNodeModulesPath string `json:"userDataNodeModulesPath"`
	UserDataPackagePath     string `json:"userDataPackagePath"`
	PreloadPath             string `json:"preloadPath"`
	ResourcePath            string `json:"resourcePath"`
}

func (a *App) AppGetPathsState() PathsState {
	return PathsState{
		UserDataTemplatePath:    paths.CreateBotPath(config.BotName),
		UserDataNodeModulesPath: paths.GetBotDependencyPath(config.BotName),
		UserDataPackagePath:     paths.GetBotPackageJsonFilePath(config.BotName),
		PreloadPath:             paths.GetPreloadPath(),
		ResourcePath:            paths.GetResourcePath(),
	}
}

// ReadFiles 读取文件
func (a *App) AppReadFiles(dir string) (string, error) {
	data, err := os.ReadFile(dir)
	if err != nil {
		logger.Error("读取文件失败:", err)
		return "", err
	}
	return string(data), nil
}

// WriteFiles 写入文件
func (a *App) AppWriteFiles(dir string, data string) bool {
	// 确保目录存在
	dirPath := filepath.Dir(dir)
	err := os.MkdirAll(dirPath, 0755)
	if err != nil {
		logger.Error("创建目录失败:", err)
		return false
	}

	err = os.WriteFile(dir, []byte(data), 0644)
	if err != nil {
		logger.Error("写入文件失败:", err)
		return false
	}

	return true
}

// Exists 检查文件或目录是否存在
func (a *App) AppExists(dir string) (bool, error) {
	_, err := os.Stat(dir)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (a *App) GetAppLogsFilePath() (string, error) {
	return logger.GetLogsFilePath()
}

// DownloadFiles 下载文件
func (a *App) AppDownloadFiles(localURL string) error {
	// 写入文件
	return utils.DownloadFiles(a.ctx, localURL)
}
