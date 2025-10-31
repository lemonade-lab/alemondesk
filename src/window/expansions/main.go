// window/expansions/expansions.go
package windowexpansions

import (
	"alemonapp/src/config"
	"alemonapp/src/logger"
	logicexpansions "alemonapp/src/logic/expansions"
	logictheme "alemonapp/src/logic/theme"
	"alemonapp/src/paths"
	"alemonapp/src/process"
	"alemonapp/src/utils"
	"context"
	"encoding/json"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
	// 存储活跃的 webview 实例
	webviews map[string]bool
}

func NewApp() *App {
	return &App{
		webviews: make(map[string]bool),
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	// 注册事件监听器
	a.registerEventHandlers()
}

const expansionsStatus = "expansions-status"
const webviewHideMessage = "webview-hide-message"
const webviewOnHideMessage = "webview-on-hide-message"

func (a *App) ExpansionsRun(p1 []string) {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"value": 0,
		})
		return
	}
	expansionsName := config.BotName
	// 判断是否在运行
	if logicexpansions.IsRunning(expansionsName) {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"value": 1,
		})
		return
	}

	process.SetHandleMessage(expansionsName, func(message map[string]interface{}) {
		// 处理来自扩展器进程的消息
		msgType, ok := message["type"].(string)
		if !ok {
			return
		}
		// 这里可以通过事件系统通知前端
		runtime.EventsEmit(a.ctx, "expansions", map[string]interface{}{
			"type": msgType,
			"data": message["data"],
		})
	})

	_, err := logicexpansions.Run(expansionsName)
	if err != nil {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"value": 0,
		})
		return
	}
	// 通知前端扩展器状态变化
	runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
		"value": 1,
	})
}

func (a *App) ExpansionsClose() {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"value": 0,
		})
		return
	}
	expansionsName := config.BotName
	_, err := logicexpansions.Stop(expansionsName)
	runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
		"value": 0,
	})
	if err != nil {
		logger.Error("停止扩展器失败:", err)
		return
	}
}

func (a *App) ExpansionsStatus() bool {
	expansionsName := config.BotName
	return logicexpansions.IsRunning(expansionsName)
}

type ExpansionsPostMessageParams struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}

func (a *App) ExpansionsPostMessage(params ExpansionsPostMessageParams) {
	managed := logicexpansions.Managed(config.BotName)
	err := managed.Send(map[string]interface{}{
		"type": params.Type,
		"data": params.Data,
	})
	if err != nil {
		logger.Error("发送消息到扩展器失败:", err)
	}
}

func (a *App) registerEventHandlers() {
	// 隐藏消息窗口
	runtime.EventsOn(a.ctx, webviewHideMessage, func(data ...interface{}) {
		logger.Debug("webview-hide-message: %v", data)
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				name, _ := params["_name"].(string)
				if paramsType, exists := params["type"].(string); exists {
					logger.Debug(name, paramsType)
					switch paramsType {
					case "css-variables":
						{
							themeVars := logictheme.GetThemeVariables()
							// 解析json
							parsedVars := make(map[string]interface{})
							if err := json.Unmarshal([]byte(themeVars), &parsedVars); err != nil {
								logger.Error("解析css变量失败:", err)
							}
							d := map[string]interface{}{
								"_name": name,
								"type":  paramsType,
								"data":  parsedVars,
							}
							runtime.EventsEmit(a.ctx, webviewOnHideMessage, d)
						}
					case "theme-mode":
						{
							mode := logictheme.GetThemeMode()
							logger.Debug("主题模式:", mode)
							d := map[string]interface{}{
								"_name": name,
								"type":  paramsType,
								"data":  mode,
							}
							runtime.EventsEmit(a.ctx, webviewOnHideMessage, d)
						}
					}
				}
			}
		}
	})
}
