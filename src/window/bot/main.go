package windowbot

import (
	"alemonapp/src/config"
	"alemonapp/src/files"
	"alemonapp/src/logger"
	logicbot "alemonapp/src/logic/bot"
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

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) BotStatus() bool {
	return logicbot.IsRunning(config.BotName)
}

func (a *App) BotRun(p1 []string) {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
			"value": 0,
		})
		return
	}
	// 运行机器人
	_, err := logicbot.Run(config.BotName, p1)
	if err != nil {
		runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
			"value": 0,
		})
		return
	}
	runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
		"value": 1,
	})
}

func (a *App) BotClose() {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
			"value": 0,
		})
		logger.Error("机器人路径不存在:", botPath)
		return
	}
	// 停止机器人
	_, err := logicbot.Stop(config.BotName)
	if err != nil {
		// 无变化。
		logger.Error("停止机器人失败:", err)
		return
	}
	runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
		"value": 0,
	})
}

// 重置机器人模板
func (a *App) BotResetTemplateAndBot() {
	botPath := paths.CreateBotPath(config.BotName)
	templatePath := paths.GetBotTemplate()

	// 删除模板目录
	if err := os.RemoveAll(templatePath); err != nil {
		logger.Error("删除模板目录失败:", err)
		return
	}

	files.ReCreate()

	// 删除现有机器人目录
	if err := os.RemoveAll(botPath); err != nil {
		logger.Error("删除机器人目录失败:", err)
		return
	}

	// 不存在的时候创建机器人目录
	if _, err := os.Stat(botPath); os.IsNotExist(err) {
		utils.CopyDir(paths.GetBotTemplate(), paths.CreateBotPath(config.BotName))
	}

	// 重载APP
	runtime.WindowReloadApp(a.ctx)
}

// 重置机器人模板
func (a *App) BotResetTemplate() {
	templatePath := paths.GetBotTemplate()

	// 删除模板目录
	if err := os.RemoveAll(templatePath); err != nil {
		logger.Error("删除模板目录失败:", err)
		return
	}

	files.ReCreate()

	// 重载APP
	runtime.WindowReloadApp(a.ctx)
}

// 重置机器人
func (a *App) BotResetBot() {
	botPath := paths.CreateBotPath(config.BotName)

	// 删除现有机器人目录
	if err := os.RemoveAll(botPath); err != nil {
		logger.Error("删除机器人目录失败:", err)
		return
	}

	// 不存在的时候创建机器人目录
	if _, err := os.Stat(botPath); os.IsNotExist(err) {
		utils.CopyDir(paths.GetBotTemplate(), paths.CreateBotPath(config.BotName))
	}

	// 重载APP
	runtime.WindowReloadApp(a.ctx)
}
