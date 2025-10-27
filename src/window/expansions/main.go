package windowexpansions

import (
	"alemonapp/src/config"
	"alemonapp/src/expansions"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

type ExpansionsPostMessageParams struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}

func (a *App) ExpansionsPostMessage(p1 ExpansionsPostMessageParams) {
	// 向指定的 nodejs 进程发送消息
}

func (a *App) ExpansionsRun(p1 []string) bool {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		return false
	}
	msg, err := expansions.Run(config.BotName)
	if err != nil {
		return false
	}
	runtime.EventsEmit(a.ctx, "expansions-status", map[string]interface{}{
		"data": 1,
	})
	_ = msg
	return true
}

func (a *App) ExpansionsClose() bool {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		return false
	}
	msg, err := expansions.Stop(config.BotName)
	runtime.EventsEmit(a.ctx, "expansions-status", map[string]interface{}{
		"data": 0,
	})
	if err != nil {
		return false
	}
	_ = msg
	return true
}

func (a *App) ExpansionsStatus() bool {
	return expansions.IsRunning(config.BotName)
}
