// window/expansions/expansions.go
package windowexpansions

import (
	"alemonapp/src/config"
	"alemonapp/src/expansions"
	"alemonapp/src/logger"
	"alemonapp/src/paths"
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

func (a *App) registerEventHandlers() {
	// 监听来自前端的各种事件
	runtime.EventsOn(a.ctx, "expansions-post-message", func(data ...interface{}) {
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				a.handlePostMessage(params)
			}
		}
	})

	runtime.EventsOn(a.ctx, "webview-hide-message-create", func(data ...interface{}) {
		if len(data) > 0 {
			if params, ok := data[0].(map[string]interface{}); ok {
				if name, exists := params["_name"].(string); exists {
					a.CreateHideWebview(name)
				}
			}
		}
	})

	runtime.EventsOn(a.ctx, "webview-hide-message", func(data ...interface{}) {
		if len(data) > 0 {
			if message, ok := data[0].(map[string]interface{}); ok {
				if name, exists := message["_name"].(string); exists {
					a.SendHideMessage(name, message)
				}
			}
		}
	})
}

func (a *App) handlePostMessage(params map[string]interface{}) {
	// 处理来自前端的消息并转发到对应的扩展
	messageType, _ := params["type"].(string)
	data, _ := params["data"].(map[string]interface{})

	logger.Info("Received expansion message - Type: %s, Data: %v", messageType, data)

	// 根据消息类型处理不同的逻辑
	switch messageType {
	case "webview-post-message":
		a.handleWebviewPostMessage(data)
	case "webview-css-variables":
		a.handleCSSVariables(data)
	case "webview-get-expansions":
		a.handleGetExpansions(data)
	}
}

func (a *App) handleWebviewPostMessage(data map[string]interface{}) {
	name, _ := data["name"].(string)
	value, _ := data["value"].(map[string]interface{})

	// 转发消息到对应的 webview
	runtime.EventsEmit(a.ctx, "webview-on-message", map[string]interface{}{
		"name":  name,
		"value": value,
	})
}

func (a *App) handleCSSVariables(data map[string]interface{}) {
	name, _ := data["name"].(string)

	// 发送主题变量到对应的 webview
	runtime.EventsEmit(a.ctx, "webview-on-css-variables", map[string]interface{}{
		"name":  name,
		"value": a.getThemeVariables(),
	})
}

func (a *App) handleGetExpansions(data map[string]interface{}) {
	name, _ := data["name"].(string)

	// 获取扩展列表并发送
	expansionsList, err := a.GetExpansionList(name)
	if err != nil {
		logger.Info("Error getting expansion list: %v", err)
		return
	}

	runtime.EventsEmit(a.ctx, "webview-on-expansions-message", map[string]interface{}{
		"name":  name,
		"value": expansionsList,
	})
}

func (a *App) getThemeVariables() map[string]interface{} {
	// 返回主题变量
	return map[string]interface{}{
		"--primary-color":    "#007acc",
		"--background-color": "#ffffff",
		"--text-color":       "#333333",
		// 添加更多主题变量...
	}
}

type ExpansionsPostMessageParams struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
}

func (a *App) ExpansionsPostMessage(params ExpansionsPostMessageParams) {
	// 向指定的 nodejs 进程发送消息
	logger.Info("Sending message to expansion: %s - %v", params.Type, params.Data)

	// 这里可以调用你的 expansions 包来实际发送消息
	// 例如: expansions.SendMessage(config.BotName, params.Type, params.Data)

	// 同时通过事件系统通知前端
	runtime.EventsEmit(a.ctx, "expansions-message-sent", map[string]interface{}{
		"type": params.Type,
		"data": params.Data,
	})
}

const expansionsStatus = "expansions-status"

func (a *App) ExpansionsRun(p1 []string) {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"data": 0,
		})
		return
	}
	// 判断是否在运行
	if expansions.IsRunning(config.BotName) {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"data": 1,
		})
		return
	}
	_, err := expansions.Run(config.BotName)
	if err != nil {
		// 通知前端扩展器状态变化
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"data": 0,
		})
		return
	}
	// 通知前端扩展器状态变化
	runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
		"data": 1,
	})
	return
}

func (a *App) ExpansionsClose() {
	botPath := paths.GetBotPath(config.BotName)
	if !utils.ExistsPath([]string{botPath}) {
		runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
			"data": 0,
		})
		return
	}
	_, err := expansions.Stop(config.BotName)
	runtime.EventsEmit(a.ctx, expansionsStatus, map[string]interface{}{
		"data": 0,
	})
	if err != nil {
		logger.Error("停止扩展器失败:", err)
		return
	}
	return
}

func (a *App) ExpansionsStatus() bool {
	return expansions.IsRunning(config.BotName)
}

type MessageData struct {
	Name string                 `json:"_name"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

// 创建隐藏的 webview
func (a *App) CreateHideWebview(name string) error {
	a.webviews[name] = true
	logger.Info("Created hide webview: %s", name)

	// 通知前端 webview 已创建
	runtime.EventsEmit(a.ctx, "webview-created", map[string]interface{}{
		"name": name,
	})

	return nil
}

// 发送隐藏消息
func (a *App) SendHideMessage(name string, data map[string]interface{}) error {
	message := MessageData{
		Name: name,
		Type: data["type"].(string),
		Data: data["data"].(map[string]interface{}),
	}

	// 通过事件系统发送到前端
	runtime.EventsEmit(a.ctx, "webview-hide-message", message)
	return nil
}

// 处理主题变量
func (a *App) SetThemeVariables(name string, variables map[string]interface{}) error {
	// 存储主题变量
	// 这里可以实现主题变量的持久化存储

	// 通知前端主题变量已更新
	runtime.EventsEmit(a.ctx, "webview-on-css-variables", map[string]interface{}{
		"name":  name,
		"value": variables,
	})

	return nil
}

// 获取扩展列表
func (a *App) GetExpansionList(name string) ([]interface{}, error) {
	// 返回扩展列表
	// 这里可以从你的 expansions 包获取实际列表
	expansionsList := []interface{}{
		map[string]interface{}{
			"id":   "expansion1",
			"name": "示例扩展1",
			"type": "webview",
		},
		map[string]interface{}{
			"id":   "expansion2",
			"name": "示例扩展2",
			"type": "script",
		},
	}

	return expansionsList, nil
}

// 新的 API 方法用于前端调用
func (a *App) CreateDesktopHideAPI(name string) map[string]interface{} {
	return map[string]interface{}{
		"send": func(data map[string]interface{}) {
			a.SendHideMessage(name, data)
		},
		"themeVariables": func(variables map[string]interface{}) {
			a.SetThemeVariables(name, variables)
		},
	}
}

func (a *App) CreateDesktopAPI(name string) map[string]interface{} {
	return map[string]interface{}{
		"postMessage": func(data map[string]interface{}) {
			b, _ := json.Marshal(map[string]interface{}{
				"name":  name,
				"value": data,
			})
			a.ExpansionsPostMessage(ExpansionsPostMessageParams{
				Type: "webview-post-message",
				Data: string(b),
			})
		},
		"expansion": map[string]interface{}{
			"getList": func() {
				a.ExpansionsPostMessage(ExpansionsPostMessageParams{
					Type: "webview-get-expansions",
					Data: name,
				})
			},
		},
	}
}
