package windowbot

import (
	"context"
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

func (a *App) BotStart() {

}

func (a *App) BotRun(p1 []string) {

}

func (a *App) BotClose() {}

func (a *App) BotStop() {}

func (a *App) BotStatus() {

}
