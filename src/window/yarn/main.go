package windowyarn

import (
	"alemonapp/src/config"
	"alemonapp/src/files"
	"alemonapp/src/logger"
	logicyarn "alemonapp/src/logic/yarn"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx         context.Context
	application *application.EventManager
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SetApplication(app *application.EventManager) {
	a.application = app
}

type YarnCommandsParams struct {
	Type string   `json:"type"`
	Args []string `json:"args,omitempty"`
}

func (a *App) YarnCommands(p1 YarnCommandsParams) {
	// 输入验证
	if p1.Type == "" {
		logger.Error("Yarn命令类型为空")
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "error",
				"data":  0,
				"error": "命令类型不能为空",
			})
		}
		return
	}

	switch p1.Type {
	case "install":
		// 不存在，则尝试从已有的压缩文件中解压
		destPath := paths.GetBotDependencyPath(config.BotName)
		alemonjsPath := filepath.Join(destPath, "alemonjs")
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
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "install",
				"data":  data,
				"error": error,
			})
		}
	case "remove":
		// 输入验证
		if len(p1.Args) == 0 {
			logger.Error("移除依赖参数为空")
			// context有效性
			if a.ctx != nil {
				a.application.Emit("yarn", map[string]interface{}{
					"type":  "remove",
					"data":  0,
					"error": "请指定要移除的依赖包名称",
				})
			}
			return
		}
		// 移除依赖
		res, error := logicyarn.Remove(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "remove",
				"data":  data,
				"error": error,
			})
		}
	case "add":
		// 输入验证
		if len(p1.Args) == 0 {
			logger.Error("添加依赖参数为空")
			// context有效性
			if a.ctx != nil {
				a.application.Emit("yarn", map[string]interface{}{
					"type":  "add",
					"data":  0,
					"error": "请指定要添加的依赖包名称",
				})
			}
			return
		}
		// 添加依赖
		res, error := logicyarn.Add(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "add",
				"data":  data,
				"error": error,
			})
		}
	case "cmd":
		// 输入验证
		if len(p1.Args) == 0 {
			logger.Error("执行命令参数为空")
			// context有效性
			if a.ctx != nil {
				a.application.Emit("yarn", map[string]interface{}{
					"type":  "cmd",
					"data":  0,
					"error": "请指定要执行的命令",
				})
			}
			return
		}
		// 执行命令
		res, error := logicyarn.Cmd(config.BotName, p1.Args)
		data := 0
		if res {
			data = 1
		}
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "cmd",
				"data":  data,
				"error": error,
			})
		}
	default:
		// 未知命令类型
		logger.Error("未知的Yarn命令类型: %s", p1.Type)
		// context有效性
		if a.ctx != nil {
			a.application.Emit("yarn", map[string]interface{}{
				"type":  "error",
				"data":  0,
				"error": fmt.Sprintf("未知的命令类型: %s", p1.Type),
			})
		}
	}
}
