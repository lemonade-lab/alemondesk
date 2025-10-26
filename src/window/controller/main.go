package windowcontroller

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

func (a *App) ControllerMinimize() {

}

func (a *App) ControllerMaximize() {

}

func (a *App) ControllerClose() {

}

func (a *App) ControllerOnClick(p1 int, p2 string) bool {
	return false
}
