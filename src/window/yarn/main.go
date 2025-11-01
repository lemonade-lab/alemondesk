package windowyarn

import (
	"alemonapp/src/config"
	"alemonapp/src/files"
	"alemonapp/src/logger"
	logicyarn "alemonapp/src/logic/yarn"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"os"
	"path"

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

type YarnCommandsParams struct {
	Type string   `json:"type"`
	Args []string `json:"args,omitempty"`
}

func (a *App) YarnCommands(p1 YarnCommandsParams) {
	switch p1.Type {
	case "install":
		// 不存在，则尝试从已有的压缩文件中解压
		destPath := paths.GetBotDependencyPath(config.BotName)
		alemonjsPath := path.Join(destPath, "alemonjs")
		if _, err := os.Stat(alemonjsPath); os.IsNotExist(err) {
			dependenciesArchivePath := files.GetDependenciesArchivePath()
			// 解压缩
			if err := utils.ExtractFileTo(dependenciesArchivePath, destPath); err != nil {
				logger.Error("缓存读取失败: %v", err)
			}
		}

		// 安装依赖
		res, error := logicyarn.Install(config.BotName)
		data := 0
		if res {
			data = 1
		}

		runtime.EventsEmit(a.ctx, "yarn", map[string]interface{}{
			"type":  "install",
			"data":  data,
			"error": error,
		})
	case "remove":
		// 移除依赖
		res, error := logicyarn.Remove(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		runtime.EventsEmit(a.ctx, "yarn", map[string]interface{}{
			"type":  "remove",
			"data":  data,
			"error": error,
		})
	case "add":
		// 添加依赖
		res, error := logicyarn.Add(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		runtime.EventsEmit(a.ctx, "yarn", map[string]interface{}{
			"type":  "add",
			"data":  data,
			"error": error,
		})
	case "cmd":
		// 执行命令
		res, error := logicyarn.Cmd(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		runtime.EventsEmit(a.ctx, "yarn", map[string]interface{}{
			"type":  "cmd",
			"data":  data,
			"error": error,
		})
	}
}
