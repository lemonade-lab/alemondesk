package windowtheme

import (
	"alemonapp/src/logger"
	logictheme "alemonapp/src/logic/theme"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

func (a *App) ThemeMode() string {
	return logictheme.GetThemeMode()
}

func (a *App) ThemeSetMode(mode string) {
	logictheme.SetThemeMode(mode)
}

// 读取主题配置文件并发送给前端
func (a *App) ThemeLoadVariables() {
	themeVars := logictheme.GetThemeVariables()
	// context有效性
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "theme", themeVars)
	}
}

// 恢复默认主题
func (a *App) ThemeResetTheme() bool {
	targetPath := paths.GetStoragePersonalThemeFilePath()
	// 打开 targetPath
	if _, err := os.Stat(targetPath); !os.IsNotExist(err) {
		// 删除文件
		if err := os.Remove(targetPath); err != nil {
			logger.Error("删除个性化主题文件失败: %v", err)
			return false
		}
	}
	return true
}

func (a *App) ThemeSave(variables string) bool {
	// 写入配置文件
	err := logictheme.SetThemeVariables(variables, true)
	return err == nil
}

// DownloadFiles 下载文件
func (a *App) ThemeDownloadFiles() error {
	targetPath := paths.GetStoragePersonalThemeFilePath()
	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		targetPath = paths.GetStorageThemeFilePath()
	}
	// 写入文件
	return utils.DownloadFiles(a.ctx, targetPath)
}
