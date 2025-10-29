package windowbot

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	"alemonapp/src/logic"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"

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
	return logic.IsRunning(config.BotName)
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
	_, err := logic.Run(config.BotName, p1)
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
	_, err := logic.Stop(config.BotName)
	if err != nil {
		// 无变化。
		logger.Error("停止机器人失败:", err)
		return
	}
	runtime.EventsEmit(a.ctx, "bot", map[string]interface{}{
		"value": 0,
	})
	return
}

// 重置机器人模板
func (a *App) BotResetTemplate() bool {
	// 创建默认机器人
	err := utils.CopyDir(paths.GetBotTemplate(), paths.CreateBotPath(config.BotName))
	return err == nil
}
