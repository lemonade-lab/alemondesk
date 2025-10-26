package windowexpansions

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

// { type: 'get-expansions' }
type ExpansionsPostMessageParams struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}

func (a *App) ExpansionsPostMessage(p1 ExpansionsPostMessageParams) {

}

func (a *App) ExpansionsRun(p1 []string) {}

func (a *App) ExpansionsClose() {}
