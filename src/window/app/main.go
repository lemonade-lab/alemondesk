package windowapp

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx         context.Context
	application *application.EventManager
	window      *application.WebviewWindow
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SetApplication(app *application.EventManager) {
	a.application = app
}

func (a *App) SetWindow(win *application.WebviewWindow) {
	a.window = win
	// 注册事件监听器
	a.registerEventHandlers()
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
	return utils.DownloadFiles(localURL)
}

func (a *App) registerEventHandlers() {
	// 注册 Bot 相关事件
	a.application.On("app", func(event *application.CustomEvent) {
		payload := event.Data.(map[string]interface{})
		eventType, ok := payload["type"].(string)
		if !ok {
			logger.Error("App 事件类型无效")
			return
		}

		switch eventType {
		case "command":
			command, ok := payload["data"].(string)
			if !ok {
				logger.Error("App command 数据无效")
				return
			}
			if command == "app.open.devtools" {
				// 打开开发者工具
				if a.window != nil {
					a.window.OpenDevTools()
				}
				return
			}
		default:
			logger.Error("未知的 App 事件类型:", eventType)
		}
	})
}
