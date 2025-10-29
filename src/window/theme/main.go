package windowtheme

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"context"
	"fmt"
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

var curTheme = "light"

func (a *App) ThemeMode() string {
	return curTheme
}

func (a *App) ThemeSetMode(mode string) {
	curTheme = mode
}

// 读取主题配置文件并发送给前端
func (a *App) ThemeLoadVariables() {
	filePath := paths.GetStorageThemeFilePath()
	// 读取配置文件
	themeVars, err := a.loadThemeVariables(filePath)
	if err != nil {
		logger.Error("读取主题配置失败: %v", err)
	}
	runtime.EventsEmit(a.ctx, "theme", themeVars)
}

// loadThemeVariables 读取主题变量配置文件
func (a *App) loadThemeVariables(filePath string) (string, error) {
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

// 恢复默认主题
func (a *App) ThemeResetTheme() {
	// 恢复是从 go内置资源复制到 work目录
}

func (a *App) ThemeSave(variables string) error {
	filePath := paths.GetStorageThemeFilePath()
	// 写入配置文件
	err := os.WriteFile(filePath, []byte(variables), 0644)
	if err != nil {
		return fmt.Errorf("写入主题配置失败: %v", err)
	}
	return nil
}
