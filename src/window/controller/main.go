package windowcontroller

import (
	"alemonapp/src/files"
	"bytes"
	"context"
	"os/exec"
	"runtime"
	"strings"
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

func (a *App) ControllerOnClick(p1 int, p2 string) bool {
	return false
}

type Versions struct {
	Version  string `json:"version"`
	Node     string `json:"node"`
	Platform string `json:"platform"`
	Arch     string `json:"arch"`     // 架构信息
	Compiler string `json:"compiler"` // Go 编译器版本
}

// executeCommand runs a command and returns its output as string
func executeCommand(name string, arg ...string) string {
	cmd := exec.Command(name, arg...)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return "Unknown"
	}
	return strings.TrimSpace(out.String())
}

// 得到版本信息
func (a *App) GetVersions() Versions {
	manager := files.GetNodeJSManager()
	nodeExe, err := manager.GetNodeExePath()
	nodeVersion := "Unknown"
	if err != nil {
		nodeVersion = executeCommand(nodeExe, "--version")
	}
	return Versions{
		Version:  "1.0.0",
		Node:     nodeVersion,
		Platform: runtime.GOOS,      // 操作系统: darwin, linux, windows, freebsd 等
		Arch:     runtime.GOARCH,    // 架构: amd64, arm64, 386 等
		Compiler: runtime.Version(), // Go 编译器版本
	}
}
