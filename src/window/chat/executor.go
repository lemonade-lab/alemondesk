package windowchat

import (
	"encoding/json"
	"fmt"
	"sync"

	windowbot "alemonapp/src/window/bot"
	windowcontroller "alemonapp/src/window/controller"
	windowexpansions "alemonapp/src/window/expansions"
	windowgit "alemonapp/src/window/git"
	windowtheme "alemonapp/src/window/theme"
	windowyarn "alemonapp/src/window/yarn"
)

// ServiceRefs 其他服务的引用
type ServiceRefs struct {
	Bot        *windowbot.App
	Theme      *windowtheme.App
	Controller *windowcontroller.App
	Expansions *windowexpansions.App
	Git        *windowgit.App
	Yarn       *windowyarn.App
}

// PendingConfirm 待确认的工具调用
type PendingConfirm struct {
	ToolCallID string
	ToolName   string
	Arguments  map[string]interface{}
	Ch         chan bool
}

// ToolExecutor 工具执行器
type ToolExecutor struct {
	services       ServiceRefs
	pendingConfirm map[string]*PendingConfirm
	mu             sync.Mutex
}

// NewToolExecutor 创建工具执行器
func NewToolExecutor() *ToolExecutor {
	return &ToolExecutor{
		pendingConfirm: make(map[string]*PendingConfirm),
	}
}

// SetServices 设置服务引用
func (te *ToolExecutor) SetServices(refs ServiceRefs) {
	te.services = refs
}

// ExecuteTool 执行工具调用，返回结果字符串
func (te *ToolExecutor) ExecuteTool(name string, argsJSON string) (string, error) {
	var args map[string]interface{}
	if argsJSON != "" && argsJSON != "{}" {
		if err := json.Unmarshal([]byte(argsJSON), &args); err != nil {
			return "", fmt.Errorf("解析参数失败: %v", err)
		}
	}
	if args == nil {
		args = make(map[string]interface{})
	}

	switch name {
	// ===== 查询类 =====
	case "get_bot_status":
		running := te.services.Bot.BotStatus()
		if running {
			return "机器人正在运行中", nil
		}
		return "机器人当前未运行", nil

	case "get_expansions_status":
		running := te.services.Expansions.ExpansionsStatus()
		if running {
			return "扩展服务正在运行中", nil
		}
		return "扩展服务当前未运行", nil

	case "get_theme_mode":
		mode := te.services.Theme.ThemeMode()
		if mode == "dark" {
			return "当前为深色主题", nil
		}
		return "当前为浅色主题", nil

	case "get_versions":
		v := te.services.Controller.GetVersions()
		data, _ := json.Marshal(v)
		return string(data), nil

	case "list_repos":
		space, _ := args["space"].(string)
		if space == "" {
			space = "packages"
		}
		repos := te.services.Git.GitReposList(space)
		data, _ := json.Marshal(repos)
		return string(data), nil

	// ===== 导航类 =====
	case "navigate":
		page, _ := args["page"].(string)
		return fmt.Sprintf("navigate:%s", page), nil

	// ===== 操作类 =====
	case "start_bot":
		te.services.Bot.BotRun([]string{})
		return "已发送启动机器人指令", nil

	case "stop_bot":
		te.services.Bot.BotClose()
		return "已发送停止机器人指令", nil

	case "reset_bot":
		te.services.Bot.BotResetBot()
		return "已重置机器人", nil

	case "switch_theme":
		mode, _ := args["mode"].(string)
		te.services.Theme.ThemeSetMode(mode)
		return fmt.Sprintf("已切换到%s主题", mode), nil

	case "reset_theme":
		te.services.Theme.ThemeResetTheme()
		return "已重置主题为默认样式", nil

	case "yarn_install":
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "install",
			Args: []string{},
		})
		return "已开始安装所有依赖", nil

	case "install_package":
		name, _ := args["name"].(string)
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "add",
			Args: []string{name},
		})
		return fmt.Sprintf("已开始安装 %s", name), nil

	case "remove_package":
		name, _ := args["name"].(string)
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "remove",
			Args: []string{name},
		})
		return fmt.Sprintf("已开始卸载 %s", name), nil

	case "upgrade_package":
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "upgrade",
			Args: []string{},
		})
		return "已开始升级所有依赖", nil

	case "clone_repo":
		url, _ := args["url"].(string)
		space, _ := args["space"].(string)
		te.services.Git.GitClone(windowgit.GitCloneOptions{
			Space:   space,
			RepoURL: url,
		})
		return fmt.Sprintf("已开始克隆 %s 到 %s", url, space), nil

	case "delete_repo":
		repoName, _ := args["name"].(string)
		space, _ := args["space"].(string)
		te.services.Git.GitDelete(space, repoName)
		return fmt.Sprintf("已删除 %s/%s", space, repoName), nil

	case "git_checkout":
		space, _ := args["space"].(string)
		repoName, _ := args["name"].(string)
		branch, _ := args["branch"].(string)
		te.services.Git.GitCheckout(space, repoName, branch)
		return fmt.Sprintf("已切换 %s/%s 到分支 %s", space, repoName, branch), nil

	case "git_fetch":
		space, _ := args["space"].(string)
		url, _ := args["url"].(string)
		te.services.Git.GitFetch(space, url)
		return fmt.Sprintf("已开始拉取 %s 的远程更新", url), nil

	case "start_expansions":
		te.services.Expansions.ExpansionsRun([]string{})
		return "已发送启动扩展服务指令", nil

	case "stop_expansions":
		te.services.Expansions.ExpansionsClose()
		return "已发送停止扩展服务指令", nil

	default:
		return "", fmt.Errorf("未知工具: %s", name)
	}
}

// RequestConfirm 请求用户确认，返回 channel 用于等待结果
func (te *ToolExecutor) RequestConfirm(toolCallID, toolName string, args map[string]interface{}) chan bool {
	te.mu.Lock()
	defer te.mu.Unlock()
	ch := make(chan bool, 1)
	te.pendingConfirm[toolCallID] = &PendingConfirm{
		ToolCallID: toolCallID,
		ToolName:   toolName,
		Arguments:  args,
		Ch:         ch,
	}
	return ch
}

// ResolveConfirm 处理用户确认/拒绝
func (te *ToolExecutor) ResolveConfirm(toolCallID string, confirmed bool) {
	te.mu.Lock()
	pending, ok := te.pendingConfirm[toolCallID]
	if ok {
		delete(te.pendingConfirm, toolCallID)
	}
	te.mu.Unlock()
	if ok {
		pending.Ch <- confirmed
	}
}
