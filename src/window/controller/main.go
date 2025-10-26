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

func (a *App) UpdateVersion() {

}

func (a *App) OnDownloadProgress(callback func(float64)) {

}

func (a *App) CheckForUpdates() {

}

type Versions struct {
	Version  string `json:"version"`
	Node     string `json:"node"`
	Platform string `json:"platform"`
}

// 得到版本信息
func (a *App) GetVersions() Versions {
	return Versions{
		Version:  "1.0.0",
		Node:     "22.14.0",
		Platform: "darwin",
	}
}
