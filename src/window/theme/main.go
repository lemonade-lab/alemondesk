package windowtheme

import (
	logictheme "alemonapp/src/logic/theme"
	"context"

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
	runtime.EventsEmit(a.ctx, "theme", themeVars)
}

// 恢复默认主题
func (a *App) ThemeResetTheme() {
	// 恢复是从 go内置资源复制到 work目录
}

func (a *App) ThemeSave(variables string) error {
	// 写入配置文件
	err := logictheme.SetThemeVariables(variables)
	return err
}
