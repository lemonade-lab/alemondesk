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
	// 监听来自前端的各种事件
	runtime.EventsOn(a.ctx, "expansions-post-message", func(data ...interface{}) {
		logger.Debug("expansions-post-message: %v", data)
		// [map[data:map[name:@alemonjs/process value:map[]] type:webview-get-expansions]]
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				logger.Debug("expansions-post-message: %v", params)
				msgType, _ := params["type"].(string)
				switch msgType {
				case "webview-get-expansions":
					{
						// 处理获取扩展信息的请求
					}
				}
			}
		}
	})

	// 隐藏消息窗口
	runtime.EventsOn(a.ctx, "webview-hide-message-create", func(data ...interface{}) {
		logger.Debug("webview-hide-message-create: %v", data)
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				if name, exists := params["_name"].(string); exists {
					logger.Debug("webview-hide-message-create: %s", name)
				}
			}
		}
	})

	// 隐藏消息窗口
	runtime.EventsOn(a.ctx, "webview-hide-message", func(data ...interface{}) {
		logger.Debug("webview-hide-message: %v", data)
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				name, _ := params["_name"].(string)
				// a.SendHideMessage(name, params)
				if paramsType, exists := params["type"].(string); exists {
					switch paramsType {
					case "css-variables":
						{
							themeVars := logictheme.GetThemeVariables()
							// 解析json
							parsedVars := make(map[string]interface{})
							if err := json.Unmarshal([]byte(themeVars), &parsedVars); err != nil {
								logger.Error("解析css变量失败:", err)
							}
							// 回复消息
							runtime.EventsEmit(a.ctx, "webview-hide-message-reply", map[string]interface{}{
								"_name": name,
								"type":  paramsType,
								"data":  parsedVars,
							})
						}

					case "theme-mode":
						{
							mode := logictheme.GetThemeMode()
							// 回复消息
							runtime.EventsEmit(a.ctx, "webview-hide-message-reply", map[string]interface{}{
								"_name": name,
								"type":  paramsType,
								"data":  mode,
							})
						}
					}
				}
			}
		}
	})
}
