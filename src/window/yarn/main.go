package windowyarn

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
type YarnCommandsParams struct {
	Type  string   `json:"type"`
	Value []string `json:"value,omitempty"`
}

func (a *App) YarnCommands(p1 YarnCommandsParams) {

}
