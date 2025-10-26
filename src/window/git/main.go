package windowgit

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

func (a *App) GitClone(p1 string, p2 string) bool {
	return true
}

func (a *App) GitInit(p1 string) bool {
	return true
}

// GitPull(name, origin, branch)
func (a *App) GitPull(p1 string, p2 string, p3 string) bool {
	return true
}

func (a *App) GitPush(p1 string) bool {
	return true
}

func (a *App) GitAddRemote(p1 string, p2 string) bool {
	return true
}

func (a *App) GitCommit(p1 string, p2 string) bool {
	return true
}

func (a *App) GitStatus(p1 string) string {
	return ""
}

// name, branch
func (a *App) GitLog(p1 string, p2 string) string {
	return ""
}

// checkout
func (a *App) GitCheckout(p1 string, p2 string) bool {
	return true
}

// repos
func (a *App) GitReposList(p1 string) []string {
	return []string{}
}

// fetch
func (a *App) GitFetch(p1 string) bool {
	return true
}

// delete
func (a *App) GitDelete(p1 string) bool {
	return true
}

// window.git.diff(item.name, item.hash)
func (a *App) GitDiff(p1 string, p2 string) string {
	return ""
}

// window.git.show(item.name, item.hash)
func (a *App) GitShow(p1 string, p2 string) string {
	return ""
}

// window.git.getWordSbaces(
func (a *App) GitGetWordSpaces() []string {
	return []string{}
}

// window.git.setWordSbaces
func (a *App) GitSetWordSpaces(p1 []string) {
}

// tags
func (a *App) GitTags(p1 string) []string {
	return []string{}
}

// GitBranch
func (a *App) GitBranch(p1 string) map[string][]string {
	return map[string][]string{}
}
