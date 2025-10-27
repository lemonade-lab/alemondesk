package windowyarn

import (
	"alemonapp/src/config"
	"alemonapp/src/logic"
	"context"
	"log"

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

// { type: 'get-expansions' }
type YarnCommandsParams struct {
	Type string   `json:"type"`
	Args []string `json:"args,omitempty"`
}

func (a *App) YarnCommands(p1 YarnCommandsParams) {
	log.Printf("YarnCommands: %v", p1)
	if p1.Type == "install" {
		// 安装依赖
		res, error := logic.Install(config.BotName)
		data := 0
		if res {
			data = 1
		}
		runtime.EventsEmit(a.ctx, "yarn", map[string]interface{}{
			"type":  "install",
			"data":  data,
			"error": error,
		})
	} else if p1.Type == "remove" {

	}
	return
}
