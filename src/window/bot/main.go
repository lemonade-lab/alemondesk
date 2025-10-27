package windowbot

import (
	"alemonapp/src/config"
	"alemonapp/src/logic"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
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

func (a *App) BotRun(p1 []string) bool {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		return false
	}
	// 运行机器人
	msg, err := logic.Run(config.BotName)
	if err != nil {
		return false
	}
	_ = msg
	return true
}

func (a *App) BotClose() bool {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		return false
	}
	// 停止机器人
	msg, err := logic.Stop(config.BotName)
	if err != nil {
		return false
	}
	_ = msg
	return true
}

func (a *App) BotStatus() bool {
	return logic.IsRunning(config.BotName)
}
