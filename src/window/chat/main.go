package windowchat

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatConfig AI 配置
type ChatConfig struct {
	APIEndpoint string  `json:"apiEndpoint"`
	APIKey      string  `json:"apiKey"`
	Model       string  `json:"model"`
	MaxTokens   int     `json:"maxTokens"`
	Temperature float64 `json:"temperature"`
}

// App 聊天窗口服务
type App struct {
	ctx         context.Context
	application *application.EventManager
	config      ChatConfig
	history     []ChatMessage
	mu          sync.Mutex
	cancelFunc  context.CancelFunc
	executor    *ToolExecutor
}

// systemPrompt 固定人设
const systemPrompt = `你的身份：你是阿柠檬框架桌面版的助手，名叫“阿柠檬”。
服务对象：非技术人员。
语气风格：礼貌、直接、像真人、不油腻。
目标：帮助用户了解桌面功能，为用户快速入门桌面操作，帮用户执行操作。
禁止事项：不要编造、不要乱承诺、遇到敏感问题时回答无法理解。不要说"我将调用"然后不调用，要么直接调用工具，要么直接回答。
输出限制：简短、分点、适合聊天窗口阅读。

工具调用：当用户请求你执行操作时，你必须直接输出工具调用 JSON，格式为：
{"name": "工具名", "arguments": {参数}}

可用工具列表：
- get_bot_status: 查询机器人状态（无参数）
- get_expansions_status: 查询扩展服务状态（无参数）
- get_theme_mode: 查询当前主题（无参数）
- get_versions: 查询版本信息（无参数）
- list_repos: 列出仓库（参数: space="packages"或"plugins"）
- navigate: 导航页面（参数: page="home/config/settings/git-exp-list/npm-exp-list"）
- start_bot: 启动机器人（无参数）
- stop_bot: 停止机器人（无参数）
- reset_bot: 重置机器人（无参数）
- switch_theme: 切换主题（参数: mode="dark"或"light"）
- reset_theme: 重置主题（无参数）
- yarn_install: 安装所有依赖（无参数）
- install_package: 安装单个包（参数: name="包名"）
- remove_package: 卸载包（参数: name="包名"）
- upgrade_package: 升级所有依赖（无参数）
- clone_repo: 克隆仓库（参数: url="地址", space="packages"或"plugins"）
- delete_repo: 删除仓库（参数: name="名称", space="packages"或"plugins"）
- git_checkout: 切换分支（参数: space, name, branch）
- git_fetch: 拉取更新（参数: space, url）
- start_expansions: 启动扩展服务（无参数）
- stop_expansions: 停止扩展服务（无参数）

示例：用户说"帮我安装依赖"，你应回复：
好的，我来帮你安装依赖。
{"name": "yarn_install", "arguments": {}}

重要：只输出上述列表中的工具名，不要自己编造命令。`

// NewApp 创建聊天服务实例
func NewApp() *App {
	return &App{
		config: ChatConfig{
			APIEndpoint: "http://localhost:11434/v1/chat/completions",
			Model:       "qwen2.5",
			MaxTokens:   2048,
			Temperature: 0.7,
		},
		history:  make([]ChatMessage, 0),
		executor: NewToolExecutor(),
	}
}

// SetServices 注入其他服务的引用
func (a *App) SetServices(refs ServiceRefs) {
	a.executor.SetServices(refs)
}

// ChatConfirmTool 用户确认/拒绝工具调用
func (a *App) ChatConfirmTool(toolCallID string, confirmed bool) {
	a.executor.ResolveConfirm(toolCallID, confirmed)
}

// Startup Wails 生命周期回调
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.loadConfig()
}

// SetApplication 设置应用事件管理器
func (a *App) SetApplication(app *application.EventManager) {
	a.application = app
}

// ChatGetConfig 获取当前 AI 配置
func (a *App) ChatGetConfig() ChatConfig {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.config
}

// ChatSetConfig 设置 AI 配置
func (a *App) ChatSetConfig(cfg ChatConfig) {
	a.mu.Lock()
	a.config = cfg
	if a.config.MaxTokens <= 0 {
		a.config.MaxTokens = 2048
	}
	if a.config.Temperature < 0 {
		a.config.Temperature = 0.7
	}
	saved := a.config
	a.mu.Unlock()
	a.saveConfig(saved)
}

// ChatSend 发送消息并获取 AI 回复（流式）
func (a *App) ChatSend(messageID string, content string) {
	a.mu.Lock()
	a.history = append(a.history, ChatMessage{
		Role:    "user",
		Content: content,
	})

	if a.config.APIEndpoint == "" {
		a.mu.Unlock()
		a.emitChatError(messageID, "请先配置 API 地址（在设置中配置）")
		return
	}

	messages := make([]ChatMessage, len(a.history))
	copy(messages, a.history)
	cfg := a.config

	ctx, cancel := context.WithTimeout(a.ctx, 120*time.Second)
	a.cancelFunc = cancel
	a.mu.Unlock()

	go a.streamChat(ctx, cancel, messageID, messages, cfg)
}

// ChatStop 停止当前流式回复
func (a *App) ChatStop() {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cancelFunc != nil {
		a.cancelFunc()
		a.cancelFunc = nil
	}
}

// ChatClear 清除聊天历史
func (a *App) ChatClear() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.history = make([]ChatMessage, 0)
}

// ChatSetHistory 设置聊天历史（用于前端重新编辑时同步）
func (a *App) ChatSetHistory(messages []ChatMessage) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.history = make([]ChatMessage, len(messages))
	copy(a.history, messages)
}

// ChatGetHistory 获取聊天历史
func (a *App) ChatGetHistory() []ChatMessage {
	a.mu.Lock()
	defer a.mu.Unlock()
	result := make([]ChatMessage, len(a.history))
	copy(result, a.history)
	return result
}

// streamChat 流式请求 AI API
func (a *App) streamChat(ctx context.Context, cancel context.CancelFunc, messageID string, messages []ChatMessage, cfg ChatConfig) {
	defer cancel()

	// 构建发送给 API 的消息：系统人设 + 历史消息
	apiMessages := make([]interface{}, 0, len(messages)+1)
	apiMessages = append(apiMessages, map[string]interface{}{"role": "system", "content": systemPrompt})
	for _, m := range messages {
		apiMessages = append(apiMessages, map[string]interface{}{"role": m.Role, "content": m.Content})
	}

	// 第一次请求：非流式，带 tools，检测是否需要工具调用
	toolCallResult, err := a.requestWithTools(ctx, apiMessages, cfg)
	if err != nil {
		if ctx.Err() == context.Canceled {
			a.emitChatEvent(messageID, "stop", "")
			return
		}
		a.emitChatError(messageID, err.Error())
		return
	}

	a.emitChatEvent(messageID, "start", "")

	// 如果有工具调用
	if len(toolCallResult.ToolCalls) > 0 {
		// 判断是否为文本降级（模型不支持 function calling）
		isFallback := strings.HasPrefix(toolCallResult.ToolCalls[0].ID, "fallback_")

		if !isFallback {
			// 原生 function calling：使用标准 tool_calls 格式
			assistantMsg := map[string]interface{}{
				"role":       "assistant",
				"content":    nil,
				"tool_calls": toolCallResult.RawToolCalls,
			}
			apiMessages = append(apiMessages, assistantMsg)
		}

		// 收集所有工具结果，用于降级模式的第二次请求
		var fallbackToolResults []string

		for _, tc := range toolCallResult.ToolCalls {
			toolDef := getToolByName(tc.Name)
			toolResult := ""

			if toolDef != nil && toolDef.RequireConfirm {
				// 需要用户确认
				var args map[string]interface{}
				_ = json.Unmarshal([]byte(tc.Arguments), &args)

				a.emitToolConfirm(messageID, tc.ID, tc.Name, toolDef.Description, args)
				ch := a.executor.RequestConfirm(tc.ID, tc.Name, args)

				// 等待用户确认或超时/取消
				select {
				case confirmed := <-ch:
					if confirmed {
						result, execErr := a.executor.ExecuteTool(tc.Name, tc.Arguments)
						if execErr != nil {
							toolResult = fmt.Sprintf("执行失败: %v", execErr)
						} else {
							toolResult = result
						}
						a.emitToolResult(messageID, tc.ID, tc.Name, toolResult, true)
					} else {
						toolResult = "用户拒绝了此操作"
						a.emitToolResult(messageID, tc.ID, tc.Name, toolResult, false)
					}
				case <-ctx.Done():
					a.emitChatEvent(messageID, "stop", "")
					return
				}
			} else {
				// 无需确认，直接执行
				result, execErr := a.executor.ExecuteTool(tc.Name, tc.Arguments)
				if execErr != nil {
					toolResult = fmt.Sprintf("执行失败: %v", execErr)
				} else {
					toolResult = result
				}
				a.emitToolResult(messageID, tc.ID, tc.Name, toolResult, true)
			}

			// 处理导航类特殊返回
			if strings.HasPrefix(toolResult, "navigate:") {
				page := strings.TrimPrefix(toolResult, "navigate:")
				a.emitNavigate(page)
				toolResult = fmt.Sprintf("已导航到 %s 页面", page)
			}

			if isFallback {
				// 降级模式：收集结果，稍后用普通消息格式发送
				fallbackToolResults = append(fallbackToolResults, fmt.Sprintf("[%s] %s", tc.Name, toolResult))
			} else {
				// 标准模式：使用 tool 角色消息
				toolMsg := map[string]interface{}{
					"role":         "tool",
					"tool_call_id": tc.ID,
					"content":      toolResult,
				}
				apiMessages = append(apiMessages, toolMsg)
			}
		}

		if isFallback {
			// 降级模式：用普通 user 消息告知工具结果，避免模型不支持 tool 格式
			resultSummary := strings.Join(fallbackToolResults, "\n")
			apiMessages = append(apiMessages, map[string]interface{}{
				"role":    "user",
				"content": fmt.Sprintf("我帮你执行了操作，结果如下：\n%s\n请根据结果回复用户。", resultSummary),
			})
		}

		// 工具执行完毕后，进行第二次请求（流式），让 AI 生成最终回复
		a.streamFinalResponse(ctx, messageID, apiMessages, cfg)
	} else if toolCallResult.Content != "" {
		// 无工具调用，直接返回内容
		a.emitChatEvent(messageID, "chunk", toolCallResult.Content)
		a.mu.Lock()
		a.history = append(a.history, ChatMessage{Role: "assistant", Content: toolCallResult.Content})
		a.mu.Unlock()
		a.emitChatEvent(messageID, "done", "")
	} else {
		a.emitChatEvent(messageID, "done", "")
	}
}

// ToolCall 解析出的工具调用
type ToolCall struct {
	ID        string
	Name      string
	Arguments string
}

// ToolCallResult 第一次请求的结果
type ToolCallResult struct {
	Content      string
	ToolCalls    []ToolCall
	RawToolCalls []interface{}
}

// requestWithTools 非流式请求，带工具定义
func (a *App) requestWithTools(ctx context.Context, messages []interface{}, cfg ChatConfig) (*ToolCallResult, error) {
	toolsDef := buildToolsForAPI()
	reqBody := map[string]interface{}{
		"model":       cfg.Model,
		"messages":    messages,
		"max_tokens":  cfg.MaxTokens,
		"temperature": cfg.Temperature,
		"stream":      false,
		"tools":       toolsDef,
	}
	logger.Info("[Chat] 发送工具请求，工具数量: %d, 模型: %s", len(toolsDef), cfg.Model)

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("请求编码失败: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.APIEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		errMsg := string(body)

		// 如果模型不支持 tools，去掉 tools 参数重试
		if resp.StatusCode == 400 && strings.Contains(errMsg, "does not support tools") {
			logger.Info("[Chat] 模型不支持 tools，去掉 tools 参数重试")
			delete(reqBody, "tools")
			bodyBytes2, _ := json.Marshal(reqBody)
			req2, err2 := http.NewRequestWithContext(ctx, http.MethodPost, cfg.APIEndpoint, bytes.NewReader(bodyBytes2))
			if err2 != nil {
				return nil, fmt.Errorf("创建重试请求失败: %v", err2)
			}
			req2.Header.Set("Content-Type", "application/json")
			if cfg.APIKey != "" {
				req2.Header.Set("Authorization", "Bearer "+cfg.APIKey)
			}
			resp2, err2 := client.Do(req2)
			if err2 != nil {
				return nil, fmt.Errorf("重试请求失败: %v", err2)
			}
			defer resp2.Body.Close()
			if resp2.StatusCode != http.StatusOK {
				body2, _ := io.ReadAll(resp2.Body)
				return nil, fmt.Errorf("%s", friendlyError(fmt.Sprintf("API 返回错误 (%d): %s", resp2.StatusCode, string(body2))))
			}
			// 替换 resp 和继续后续解析
			resp = resp2
		} else {
			return nil, fmt.Errorf("%s", friendlyError(fmt.Sprintf("API 返回错误 (%d): %s", resp.StatusCode, errMsg)))
		}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}

	logger.Info("[Chat] API 原始响应: %s", string(body))

	// 解析响应
	var result struct {
		Choices []struct {
			Message struct {
				Content   string        `json:"content"`
				ToolCalls []interface{} `json:"tool_calls"`
			} `json:"message"`
		} `json:"choices"`
		// Ollama 原生格式
		Message struct {
			Content   string        `json:"content"`
			ToolCalls []interface{} `json:"tool_calls"`
		} `json:"message"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		// 尝试当作纯文本
		text := strings.TrimSpace(string(body))
		if text != "" {
			return &ToolCallResult{Content: text}, nil
		}
		return nil, fmt.Errorf("解析响应失败: %v", err)
	}

	tcResult := &ToolCallResult{}

	var rawContent string
	var rawToolCalls []interface{}

	if len(result.Choices) > 0 {
		rawContent = result.Choices[0].Message.Content
		rawToolCalls = result.Choices[0].Message.ToolCalls
	} else if result.Message.Content != "" || len(result.Message.ToolCalls) > 0 {
		rawContent = result.Message.Content
		rawToolCalls = result.Message.ToolCalls
	}

	tcResult.Content = rawContent
	tcResult.RawToolCalls = rawToolCalls

	logger.Info("[Chat] 响应内容: %q, tool_calls 数量: %d", rawContent, len(rawToolCalls))

	// 解析 tool_calls
	for _, raw := range rawToolCalls {
		rawBytes, _ := json.Marshal(raw)
		// 使用 interface{} 解析 arguments，兼容字符串和对象两种格式
		var tc struct {
			ID       string `json:"id"`
			Type     string `json:"type"`
			Function struct {
				Name      string      `json:"name"`
				Arguments interface{} `json:"arguments"`
			} `json:"function"`
		}
		if err := json.Unmarshal(rawBytes, &tc); err != nil || tc.Function.Name == "" {
			logger.Info("[Chat] 跳过无法解析的 tool_call: %s, err=%v", string(rawBytes), err)
			continue
		}

		var argsStr string
		switch v := tc.Function.Arguments.(type) {
		case string:
			argsStr = v
		case map[string]interface{}:
			b, _ := json.Marshal(v)
			argsStr = string(b)
		default:
			argsStr = "{}"
		}

		id := tc.ID
		if id == "" {
			id = fmt.Sprintf("call_%d", len(tcResult.ToolCalls))
		}
		logger.Info("[Chat] 解析到工具调用: id=%s, name=%s, args=%s", id, tc.Function.Name, argsStr)
		tcResult.ToolCalls = append(tcResult.ToolCalls, ToolCall{
			ID:        id,
			Name:      tc.Function.Name,
			Arguments: argsStr,
		})
	}

	// 降级：模型不支持 function calling 时，从文本中提取意图
	if len(tcResult.ToolCalls) == 0 && tcResult.Content != "" {
		// AI 回复：只做 JSON 格式检测（{"name":"xxx","arguments":{}}）
		// 不做关键词匹配，避免 AI 描述性文本中的词语被误匹配
		tc := a.detectToolFromJSON(tcResult.Content)

		if tc == nil {
			// 只有当 AI 回复看起来在"推诿"或"无法执行"时，
			// 才从用户消息做关键词降级，避免 AI 正常回答后重复触发工具
			if a.isEvasiveResponse(tcResult.Content) {
				for i := len(messages) - 1; i >= 0; i-- {
					if msg, ok := messages[i].(map[string]interface{}); ok {
						if role, _ := msg["role"].(string); role == "user" {
							if content, _ := msg["content"].(string); content != "" {
								tc = a.detectToolFromText(content)
							}
							break
						}
					}
				}
			}
		}
		if tc != nil {
			logger.Info("[Chat] 文本降级检测到工具: %s", tc.Name)
			tcResult.ToolCalls = []ToolCall{*tc}
			// 构造 RawToolCalls 供后续传给 API
			tcResult.RawToolCalls = []interface{}{
				map[string]interface{}{
					"id":   tc.ID,
					"type": "function",
					"function": map[string]interface{}{
						"name":      tc.Name,
						"arguments": tc.Arguments,
					},
				},
			}
			tcResult.Content = ""
		}
	}

	return tcResult, nil
}

// isEvasiveResponse 判断 AI 回复是否在"推诿"（没有实际执行用户请求）
// 只有在这种情况下，才对用户消息做关键词降级检测
func (a *App) isEvasiveResponse(text string) bool {
	text = strings.ToLower(text)
	evasivePatterns := []string{
		"无法直接", "无法访问", "无法执行", "无法操作",
		"不能直接", "不能访问", "不能执行",
		"没有权限", "没有能力",
		"请通过", "请前往", "请在设置中", "请手动",
		"对不起", "抱歉",
		"i can't", "i cannot", "unable to",
	}
	for _, p := range evasivePatterns {
		if strings.Contains(text, p) {
			return true
		}
	}
	return false
}

// detectToolFromJSON 从文本中提取 JSON 格式的工具调用
// 处理模型直接在内容中输出 {"name": "tool_name", "arguments": {...}} 的情况
func (a *App) detectToolFromJSON(text string) *ToolCall {
	// 查找所有可能的 JSON 对象
	for i := 0; i < len(text); i++ {
		if text[i] != '{' {
			continue
		}
		// 找到匹配的 }
		depth := 0
		for j := i; j < len(text); j++ {
			if text[j] == '{' {
				depth++
			} else if text[j] == '}' {
				depth--
				if depth == 0 {
					jsonStr := text[i : j+1]
					var obj struct {
						Name      string      `json:"name"`
						Arguments interface{} `json:"arguments"`
					}
					if err := json.Unmarshal([]byte(jsonStr), &obj); err == nil && obj.Name != "" {
						// 验证是否为已注册的工具
						if getToolByName(obj.Name) != nil {
							var argsStr string
							switch v := obj.Arguments.(type) {
							case string:
								argsStr = v
							case map[string]interface{}:
								b, _ := json.Marshal(v)
								argsStr = string(b)
							default:
								argsStr = "{}"
							}
							logger.Info("[Chat] 从文本 JSON 中检测到工具: %s, args=%s", obj.Name, argsStr)
							return &ToolCall{
								ID:        fmt.Sprintf("fallback_%d", time.Now().UnixNano()),
								Name:      obj.Name,
								Arguments: argsStr,
							}
						}
					}
					break
				}
			}
		}
	}
	return nil
}

// detectToolFromText 从 AI 文本回复中检测工具意图（降级方案）
func (a *App) detectToolFromText(text string) *ToolCall {
	// 先尝试从文本中解析 JSON 格式的工具调用
	// 有些模型会直接在内容中输出 {"name": "xxx", "arguments": {...}}
	if tc := a.detectToolFromJSON(text); tc != nil {
		return tc
	}

	text = strings.ToLower(text)

	type pattern struct {
		keywords []string
		toolName string
		args     string
	}

	patterns := []pattern{
		// 机器人
		{[]string{"启动机器人", "开启机器人", "运行机器人", "跑机器人", "start bot", "start_bot"}, "start_bot", "{}"},
		{[]string{"停止机器人", "关闭机器人", "停掉机器人", "stop bot", "stop_bot"}, "stop_bot", "{}"},
		{[]string{"重置机器人", "重建机器人", "reset bot", "reset_bot"}, "reset_bot", "{}"},
		{[]string{"机器人状态", "机器人运行", "机器人是否", "bot status", "get_bot_status"}, "get_bot_status", "{}"},
		// 扩展服务
		{[]string{"扩展器状态", "扩展状态", "查看扩展", "扩展器", "扩展服务", "expansions status"}, "get_expansions_status", "{}"},
		{[]string{"启动扩展", "开启扩展", "start expansions"}, "start_expansions", "{}"},
		{[]string{"停止扩展", "关闭扩展", "stop expansions"}, "stop_expansions", "{}"},
		// 主题
		{[]string{"切换到深色", "dark mode", "深色主题", "暗色模式", "夜间模式"}, "switch_theme", `{"mode":"dark"}`},
		{[]string{"切换到浅色", "light mode", "浅色主题", "亮色模式", "白色模式"}, "switch_theme", `{"mode":"light"}`},
		{[]string{"当前主题", "什么主题", "查看主题", "theme mode"}, "get_theme_mode", "{}"},
		{[]string{"重置主题", "恢复默认主题", "reset theme"}, "reset_theme", "{}"},
		// 依赖管理
		{[]string{"安装依赖", "加载依赖", "install dependencies", "yarn install"}, "yarn_install", "{}"},
		{[]string{"升级依赖", "更新依赖", "upgrade packages", "yarn upgrade"}, "upgrade_package", "{}"},
		// Git
		{[]string{"拉取更新", "git fetch", "同步仓库", "更新仓库"}, "git_fetch", "{}"},
		{[]string{"切换分支", "git checkout", "换分支"}, "git_checkout", "{}"},
		{[]string{"查看仓库", "列出仓库", "功能包", "插件列表", "list repos"}, "list_repos", `{"space":"packages"}`},
		// 系统
		{[]string{"版本信息", "版本号", "version", "查看版本"}, "get_versions", "{}"},
		// 导航
		{[]string{"打开设置", "进入设置", "去设置"}, "navigate", `{"page":"settings"}`},
		{[]string{"打开配置", "编辑配置", "查看配置", "配置文件"}, "navigate", `{"page":"config"}`},
		{[]string{"仓库管理", "git仓库", "git-exp"}, "navigate", `{"page":"git-exp-list"}`},
		{[]string{"机器人配置", "bot配置", "bot设置"}, "navigate", `{"page":"config"}`},
	}

	for _, p := range patterns {
		for _, kw := range p.keywords {
			if strings.Contains(text, kw) {
				return &ToolCall{
					ID:        fmt.Sprintf("fallback_%d", time.Now().UnixNano()),
					Name:      p.toolName,
					Arguments: p.args,
				}
			}
		}
	}
	return nil
}

// streamFinalResponse 流式请求最终回复（工具执行后）
func (a *App) streamFinalResponse(ctx context.Context, messageID string, messages []interface{}, cfg ChatConfig) {
	reqBody := map[string]interface{}{
		"model":       cfg.Model,
		"messages":    messages,
		"max_tokens":  cfg.MaxTokens,
		"temperature": cfg.Temperature,
		"stream":      true,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		a.emitChatError(messageID, fmt.Sprintf("请求编码失败: %v", err))
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.APIEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		a.emitChatError(messageID, fmt.Sprintf("创建请求失败: %v", err))
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		if ctx.Err() == context.Canceled {
			a.emitChatEvent(messageID, "stop", "")
			return
		}
		a.emitChatError(messageID, fmt.Sprintf("请求失败: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		a.emitChatError(messageID, fmt.Sprintf("API 返回错误 (%d): %s", resp.StatusCode, string(body)))
		return
	}

	contentType := resp.Header.Get("Content-Type")
	isStream := strings.Contains(contentType, "text/event-stream") ||
		strings.Contains(contentType, "text/plain") ||
		strings.Contains(contentType, "application/x-ndjson") ||
		strings.Contains(contentType, "application/ndjson")

	if !isStream {
		// 非流式
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			a.emitChatError(messageID, fmt.Sprintf("读取响应失败: %v", err))
			return
		}
		var result struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		}
		if err := json.Unmarshal(body, &result); err == nil {
			content := ""
			if len(result.Choices) > 0 {
				content = result.Choices[0].Message.Content
			}
			if content == "" {
				content = result.Message.Content
			}
			if content != "" {
				a.emitChatEvent(messageID, "chunk", content)
				a.mu.Lock()
				a.history = append(a.history, ChatMessage{Role: "assistant", Content: content})
				a.mu.Unlock()
			}
		}
		a.emitChatEvent(messageID, "done", "")
		return
	}

	// 流式解析
	var fullContent strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			a.emitChatEvent(messageID, "stop", "")
			a.mu.Lock()
			if fullContent.Len() > 0 {
				a.history = append(a.history, ChatMessage{Role: "assistant", Content: fullContent.String()})
			}
			a.mu.Unlock()
			return
		default:
		}

		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "data: ") {
			line = strings.TrimPrefix(line, "data: ")
		}
		if line == "[DONE]" {
			break
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
			Done bool `json:"done"`
		}
		if err := json.Unmarshal([]byte(line), &chunk); err != nil {
			continue
		}
		if chunk.Done {
			break
		}

		var content string
		if len(chunk.Choices) > 0 {
			content = chunk.Choices[0].Delta.Content
		}
		if content == "" {
			content = chunk.Message.Content
		}
		if content != "" {
			fullContent.WriteString(content)
			a.emitChatEvent(messageID, "chunk", content)
		}
	}

	a.mu.Lock()
	if fullContent.Len() > 0 {
		a.history = append(a.history, ChatMessage{Role: "assistant", Content: fullContent.String()})
	}
	a.mu.Unlock()
	a.emitChatEvent(messageID, "done", "")
}

func (a *App) emitChatEvent(messageID string, eventType string, content string) {
	if a.application != nil {
		a.application.Emit("chat", map[string]interface{}{
			"messageId": messageID,
			"type":      eventType,
			"content":   content,
		})
	}
}

func (a *App) emitChatError(messageID string, errMsg string) {
	logger.Error("Chat 错误: %s", errMsg)
	friendly := friendlyError(errMsg)
	if a.application != nil {
		a.application.Emit("chat", map[string]interface{}{
			"messageId": messageID,
			"type":      "error",
			"content":   friendly,
		})
	}
}

// friendlyError 将技术错误信息转换为用户友好的提示
func friendlyError(raw string) string {
	lower := strings.ToLower(raw)

	switch {
	case strings.Contains(lower, "connection refused") || strings.Contains(lower, "dial tcp"):
		return "无法连接到 AI 服务，请确认服务已启动（如 Ollama）"
	case strings.Contains(lower, "timeout") || strings.Contains(lower, "deadline exceeded"):
		return "AI 响应超时了，请稍后重试"
	case strings.Contains(lower, "401") || strings.Contains(lower, "unauthorized"):
		return "API Key 无效或已过期，请在设置中检查"
	case strings.Contains(lower, "403") || strings.Contains(lower, "forbidden"):
		return "没有访问权限，请检查 API Key 是否正确"
	case strings.Contains(lower, "404") || strings.Contains(lower, "not found"):
		return "找不到 AI 模型，请检查模型名称和 API 地址是否正确"
	case strings.Contains(lower, "429") || strings.Contains(lower, "rate limit"):
		return "请求太频繁了，请稍等一会再试"
	case strings.Contains(lower, "500") || strings.Contains(lower, "internal server error"):
		return "AI 服务内部出错了，请稍后重试"
	case strings.Contains(lower, "api 返回错误 (400)"):
		return "AI 服务无法处理请求，可能是模型不支持当前功能，请尝试换个模型"
	case strings.Contains(lower, "请求编码失败"):
		return "消息发送准备失败，请重试"
	case strings.Contains(lower, "解析响应失败") || strings.Contains(lower, "读取响应失败"):
		return "AI 返回的内容无法识别，请重试"
	case strings.Contains(lower, "no such host"):
		return "找不到 AI 服务地址，请检查设置中的 API 地址"
	default:
		return raw
	}
}

// emitToolConfirm 发送工具确认请求到前端
func (a *App) emitToolConfirm(messageID, toolCallID, toolName, description string, args map[string]interface{}) {
	if a.application != nil {
		a.application.Emit("chat", map[string]interface{}{
			"messageId":   messageID,
			"type":        "tool_confirm",
			"toolCallId":  toolCallID,
			"toolName":    toolName,
			"description": description,
			"arguments":   args,
		})
	}
}

// emitToolResult 发送工具执行结果到前端
func (a *App) emitToolResult(messageID, toolCallID, toolName, result string, executed bool) {
	if a.application != nil {
		a.application.Emit("chat", map[string]interface{}{
			"messageId":  messageID,
			"type":       "tool_result",
			"toolCallId": toolCallID,
			"toolName":   toolName,
			"result":     result,
			"executed":   executed,
		})
	}
}

// emitNavigate 发送导航事件到前端
func (a *App) emitNavigate(page string) {
	if a.application != nil {
		a.application.Emit("view", page)
	}
}

// loadConfig 从文件加载 AI 配置
func (a *App) loadConfig() {
	filePath := paths.GetStorageAIConfigFilePath()
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	var cfg ChatConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		logger.Error("解析 AI 配置文件失败: %v", err)
		return
	}
	a.mu.Lock()
	a.config = cfg
	if a.config.MaxTokens <= 0 {
		a.config.MaxTokens = 2048
	}
	a.mu.Unlock()
}

// saveConfig 保存 AI 配置到文件
func (a *App) saveConfig(cfg ChatConfig) {
	filePath := paths.GetStorageAIConfigFilePath()
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		logger.Error("序列化 AI 配置失败: %v", err)
		return
	}
	if err := os.WriteFile(filePath, data, 0600); err != nil {
		logger.Error("保存 AI 配置文件失败: %v", err)
	}
}
