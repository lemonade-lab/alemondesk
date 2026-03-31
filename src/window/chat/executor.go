package windowchat

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"alemonapp/src/config"
	"alemonapp/src/logger"
	logictheme "alemonapp/src/logic/theme"
	"alemonapp/src/paths"
	windowapp "alemonapp/src/window/app"
	windowbot "alemonapp/src/window/bot"
	windowcontroller "alemonapp/src/window/controller"
	windowexpansions "alemonapp/src/window/expansions"
	windowgit "alemonapp/src/window/git"
	windowtheme "alemonapp/src/window/theme"
	windowyarn "alemonapp/src/window/yarn"

	"go.yaml.in/yaml/v3"
)

// ServiceRefs 其他服务的引用
type ServiceRefs struct {
	Bot        *windowbot.App
	Theme      *windowtheme.App
	Controller *windowcontroller.App
	Expansions *windowexpansions.App
	Git        *windowgit.App
	Yarn       *windowyarn.App
	App        *windowapp.App
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
		te.services.Theme.ThemeLoadVariables()
		return fmt.Sprintf("已切换到%s主题", mode), nil

	case "reset_theme":
		te.services.Theme.ThemeResetTheme()
		te.services.Theme.ThemeLoadVariables()
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
		name, _ := args["name"].(string)
		if name == "" {
			return "请指定要升级的包名，如果想重新安装所有依赖，请使用安装依赖功能。", nil
		}
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "upgrade",
			Args: []string{name},
		})
		return fmt.Sprintf("已开始升级 %s", name), nil

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

	case "git_pull":
		space, _ := args["space"].(string)
		repoName, _ := args["name"].(string)
		if space == "" || repoName == "" {
			return "请指定 space 和仓库名称", nil
		}
		te.services.Git.GitPull(space, repoName)
		return fmt.Sprintf("已开始拉取 %s/%s 最新代码", space, repoName), nil

	case "link_package":
		name, _ := args["name"].(string)
		if name == "" {
			return "请指定要链接的包名", nil
		}
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "link",
			Args: []string{name},
		})
		return fmt.Sprintf("已开始链接 %s", name), nil

	case "unlink_package":
		name, _ := args["name"].(string)
		if name == "" {
			return "请指定要取消链接的包名", nil
		}
		te.services.Yarn.YarnCommands(windowyarn.YarnCommandsParams{
			Type: "unlink",
			Args: []string{name},
		})
		return fmt.Sprintf("已开始取消链接 %s", name), nil

	case "get_paths":
		pathsState := te.services.App.AppGetPathsState()
		var sb strings.Builder
		sb.WriteString("应用路径信息：\n")
		sb.WriteString(fmt.Sprintf("- 机器人工作目录: %s\n", pathsState.UserDataTemplatePath))
		sb.WriteString(fmt.Sprintf("- 依赖目录(node_modules): %s\n", pathsState.UserDataNodeModulesPath))
		sb.WriteString(fmt.Sprintf("- 配置文件(package.json): %s\n", pathsState.UserDataPackagePath))
		sb.WriteString(fmt.Sprintf("- 资源目录: %s\n", pathsState.ResourcePath))
		return sb.String(), nil

	case "get_logs_path":
		logPath, err := te.services.App.GetAppLogsFilePath()
		if err != nil {
			return "", fmt.Errorf("获取日志路径失败: %v", err)
		}
		return fmt.Sprintf("应用日志文件路径: %s", logPath), nil

	case "export_theme":
		err := te.services.Theme.ThemeDownloadFiles()
		if err != nil {
			return "", fmt.Errorf("导出主题失败: %v", err)
		}
		return "已导出当前主题配置文件", nil

	case "restart_bot":
		te.services.Bot.BotClose()
		te.services.Bot.BotRun([]string{})
		return "已发送重启机器人指令（先停止再启动）", nil

	case "list_installed_packages":
		pathsState := te.services.App.AppGetPathsState()
		pkgPath := pathsState.UserDataPackagePath
		data, err := os.ReadFile(pkgPath)
		if err != nil {
			return "无法读取 package.json", nil
		}
		var pkgJSON map[string]interface{}
		if err := json.Unmarshal(data, &pkgJSON); err != nil {
			return "解析 package.json 失败", nil
		}
		deps, _ := pkgJSON["dependencies"].(map[string]interface{})
		if len(deps) == 0 {
			return "当前没有已安装的依赖包", nil
		}
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("已安装的依赖包（共 %d 个）：\n", len(deps)))
		for name, ver := range deps {
			sb.WriteString(fmt.Sprintf("- %s: %v\n", name, ver))
		}
		return sb.String(), nil

	case "get_theme_variables":
		category, _ := args["category"].(string)
		return te.getThemeVariables(category)

	case "edit_theme_variables":
		variables, _ := args["variables"].(string)
		if variables == "" {
			return "请提供要修改的变量 JSON", nil
		}
		return te.editThemeVariables(variables)

	case "get_bot_config":
		return te.getBotConfig()

	case "edit_bot_config":
		field, _ := args["field"].(string)
		value, _ := args["value"].(string)
		if field == "" {
			return "请指定要修改的配置字段", nil
		}
		return te.editBotConfig(field, value)

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

// getThemeVariables 获取主题变量，可选按分类筛选
func (te *ToolExecutor) getThemeVariables(category string) (string, error) {
	isDark := te.services.Theme.ThemeMode() == "dark"

	// 读取主题 JSON
	varsStr := logictheme.GetThemeVariables()
	var allVars map[string]string
	if err := json.Unmarshal([]byte(varsStr), &allVars); err != nil {
		return "", fmt.Errorf("解析主题变量失败: %v", err)
	}

	mode := "浅色"
	if isDark {
		mode = "深色"
	}

	// 按当前模式筛选
	filtered := make(map[string]string)
	for key, val := range allVars {
		name := strings.TrimPrefix(key, "alemonjs-")
		if isDark {
			if !strings.HasPrefix(name, "dark-") {
				continue
			}
		} else {
			if strings.HasPrefix(name, "dark-") {
				continue
			}
		}
		filtered[name] = val
	}

	// 有分类时：返回该分类的完整变量
	if category != "" {
		result := make(map[string]string)
		for name, val := range filtered {
			checkName := name
			if isDark {
				checkName = strings.TrimPrefix(name, "dark-")
			}
			if strings.HasPrefix(checkName, category+"-") || checkName == category {
				result[name] = val
			}
		}
		data, _ := json.Marshal(result)
		return fmt.Sprintf("当前%s模式下 %s 分类的主题变量：\n%s", mode, category, string(data)), nil
	}

	// 无分类时：只返回核心变量的摘要（避免输出 140+ 变量淹没 AI）
	coreKeys := []string{
		"primary-bg", "primary-border", "primary-text", "primary-bg-hover",
		"secondary-bg", "secondary-text", "secondary-border",
		"header-bg", "header-border", "header-text",
		"nav-bg", "nav-border", "nav-text",
		"bar-bg", "bar-border", "bar-text", "bar-bg-hover", "bar-text-hover",
		"sidebar-bg", "sidebar-border", "sidebar-text",
		"button-bg", "button-border", "button-text", "button-bg-hover", "button-text-hover",
		"input-bg", "input-border", "input-text",
		"tag-bg-hover", "tag-text-hover",
		"notification-bg", "notification-text", "notification-border",
	}
	if isDark {
		for i, k := range coreKeys {
			coreKeys[i] = "dark-" + k
		}
	}
	result := make(map[string]string)
	for _, k := range coreKeys {
		if v, ok := filtered[k]; ok {
			result[k] = v
		}
	}
	data, _ := json.Marshal(result)
	return fmt.Sprintf("当前%s模式核心主题变量（共%d个，此处展示%d个核心变量）：\n%s\n提示：用 category 参数可查看某分类全部变量", mode, len(filtered), len(result), string(data)), nil
}

// editThemeVariables 批量修改主题变量并应用
func (te *ToolExecutor) editThemeVariables(variablesJSON string) (string, error) {
	var updates map[string]string
	if err := json.Unmarshal([]byte(variablesJSON), &updates); err != nil {
		return "", fmt.Errorf("解析变量 JSON 失败: %v", err)
	}
	if len(updates) == 0 {
		return "没有指定要修改的变量", nil
	}

	varsStr := logictheme.GetThemeVariables()
	var allVars map[string]string
	if err := json.Unmarshal([]byte(varsStr), &allVars); err != nil {
		return "", fmt.Errorf("解析当前主题失败: %v", err)
	}

	var changed []string
	for name, color := range updates {
		key := name
		if !strings.HasPrefix(key, "alemonjs-") {
			key = "alemonjs-" + key
		}
		allVars[key] = color
		changed = append(changed, fmt.Sprintf("%s → %s", name, color))
	}

	data, _ := json.Marshal(allVars)
	if err := logictheme.SetThemeVariables(string(data), true); err != nil {
		return "", fmt.Errorf("保存主题失败: %v", err)
	}

	// 触发前端刷新主题
	te.services.Theme.ThemeLoadVariables()

	logger.Info("[Theme] 修改主题变量: %v", changed)
	return fmt.Sprintf("已修改 %d 个主题变量并应用：\n%s", len(changed), strings.Join(changed, "\n")), nil
}

// readBotConfigFile 读取机器人配置文件，返回原始 map
func readBotConfigFile() (map[string]interface{}, error) {
	configPath := paths.GetBotConfigFilePath(config.BotName)
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}
	var raw map[string]interface{}
	if err := yaml.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %v", err)
	}
	if raw == nil {
		raw = make(map[string]interface{})
	}
	return raw, nil
}

// writeBotConfigFile 将 map 写回配置文件
func writeBotConfigFile(raw map[string]interface{}) error {
	configPath := paths.GetBotConfigFilePath(config.BotName)
	dirPath := filepath.Dir(configPath)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("创建目录失败: %v", err)
	}
	data, err := yaml.Marshal(raw)
	if err != nil {
		return fmt.Errorf("序列化配置失败: %v", err)
	}
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %v", err)
	}
	return nil
}

// getBotConfig 读取并格式化机器人配置信息
func (te *ToolExecutor) getBotConfig() (string, error) {
	raw, err := readBotConfigFile()
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	sb.WriteString("机器人配置信息：\n")

	// 基础配置
	if v, ok := raw["login"]; ok {
		sb.WriteString(fmt.Sprintf("- 平台(login): %v\n", v))
	} else {
		sb.WriteString("- 平台(login): 未设置\n")
	}
	if v, ok := raw["port"]; ok {
		sb.WriteString(fmt.Sprintf("- WebSocket端口(port): %v\n", v))
	}
	if v, ok := raw["serverPort"]; ok {
		sb.WriteString(fmt.Sprintf("- HTTP服务端口(serverPort): %v\n", v))
	}
	if v, ok := raw["url"]; ok {
		sb.WriteString(fmt.Sprintf("- 连接地址(url): %v\n", v))
	}
	if v, ok := raw["input"]; ok {
		sb.WriteString(fmt.Sprintf("- 输入参数(input): %v\n", v))
	}
	if v, ok := raw["is_full_receive"]; ok {
		sb.WriteString(fmt.Sprintf("- 全量消息接收: %v\n", v))
	}

	// 权限管理
	if v, ok := raw["master_id"].(map[string]interface{}); ok && len(v) > 0 {
		ids := make([]string, 0, len(v))
		for k := range v {
			ids = append(ids, k)
		}
		sb.WriteString(fmt.Sprintf("- 管理员ID: %s\n", strings.Join(ids, ", ")))
	}
	if v, ok := raw["bot_id"].(map[string]interface{}); ok && len(v) > 0 {
		ids := make([]string, 0, len(v))
		for k := range v {
			ids = append(ids, k)
		}
		sb.WriteString(fmt.Sprintf("- 机器人ID: %s\n", strings.Join(ids, ", ")))
	}

	// 消息过滤
	if v, ok := raw["disabled_selects"].(map[string]interface{}); ok && len(v) > 0 {
		events := make([]string, 0, len(v))
		for k, val := range v {
			if b, ok := val.(bool); ok && b {
				events = append(events, k)
			}
		}
		if len(events) > 0 {
			sb.WriteString(fmt.Sprintf("- 已禁用事件: %s\n", strings.Join(events, ", ")))
		}
	}
	if v, ok := raw["disabled_user_id"].(map[string]interface{}); ok && len(v) > 0 {
		ids := make([]string, 0, len(v))
		for k := range v {
			ids = append(ids, k)
		}
		sb.WriteString(fmt.Sprintf("- 屏蔽用户ID: %s\n", strings.Join(ids, ", ")))
	}
	if v, ok := raw["disabled_text_regular"]; ok && fmt.Sprintf("%v", v) != "" {
		sb.WriteString(fmt.Sprintf("- 禁用消息正则: %v\n", v))
	}
	if v, ok := raw["redirect_text_regular"]; ok && fmt.Sprintf("%v", v) != "" {
		sb.WriteString(fmt.Sprintf("- URL重定向正则: %v\n", v))
		if t, ok := raw["redirect_text_target"]; ok {
			sb.WriteString(fmt.Sprintf("- URL重定向替换: %v\n", t))
		}
	}

	// 处理器配置
	if proc, ok := raw["processor"].(map[string]interface{}); ok {
		if v, ok := proc["repeated_event_time"]; ok {
			sb.WriteString(fmt.Sprintf("- 相同消息ID过滤时间: %vms\n", v))
		}
		if v, ok := proc["repeated_user_time"]; ok {
			sb.WriteString(fmt.Sprintf("- 同用户消息过滤时间: %vms\n", v))
		}
	}

	return sb.String(), nil
}

// editBotConfig 编辑机器人配置的指定字段
func (te *ToolExecutor) editBotConfig(field, value string) (string, error) {
	raw, err := readBotConfigFile()
	if err != nil {
		return "", err
	}

	switch field {
	// 基础字符串字段
	case "login":
		if value == "" {
			delete(raw, "login")
		} else {
			raw["login"] = value
		}
		return fmt.Sprintf("已将平台设置为: %s", value), writeBotConfigFile(raw)

	case "port":
		if value == "" {
			delete(raw, "port")
		} else {
			if n, err := strconv.Atoi(value); err == nil {
				raw["port"] = n
			} else {
				raw["port"] = value
			}
		}
		return fmt.Sprintf("已将WebSocket端口设置为: %s", value), writeBotConfigFile(raw)

	case "serverPort":
		if value == "" {
			delete(raw, "serverPort")
		} else {
			if n, err := strconv.Atoi(value); err == nil {
				raw["serverPort"] = n
			} else {
				raw["serverPort"] = value
			}
		}
		return fmt.Sprintf("已将HTTP服务端口设置为: %s", value), writeBotConfigFile(raw)

	case "input":
		if value == "" {
			delete(raw, "input")
		} else {
			raw["input"] = value
		}
		return fmt.Sprintf("已将输入参数设置为: %s", value), writeBotConfigFile(raw)

	case "url":
		if value == "" {
			delete(raw, "url")
		} else {
			raw["url"] = value
		}
		return fmt.Sprintf("已将连接地址设置为: %s", value), writeBotConfigFile(raw)

	case "is_full_receive":
		raw["is_full_receive"] = (value == "true" || value == "1")
		status := "关闭"
		if value == "true" || value == "1" {
			status = "开启"
		}
		return fmt.Sprintf("已%s全量消息接收", status), writeBotConfigFile(raw)

	// 管理员 ID 操作
	case "add_master_id":
		if value == "" {
			return "请提供要添加的管理员ID", nil
		}
		masterID, _ := raw["master_id"].(map[string]interface{})
		if masterID == nil {
			masterID = make(map[string]interface{})
		}
		masterID[value] = true
		raw["master_id"] = masterID
		return fmt.Sprintf("已添加管理员ID: %s", value), writeBotConfigFile(raw)

	case "remove_master_id":
		if value == "" {
			return "请提供要移除的管理员ID", nil
		}
		masterID, _ := raw["master_id"].(map[string]interface{})
		if masterID != nil {
			delete(masterID, value)
			if len(masterID) == 0 {
				delete(raw, "master_id")
			} else {
				raw["master_id"] = masterID
			}
		}
		return fmt.Sprintf("已移除管理员ID: %s", value), writeBotConfigFile(raw)

	// 机器人 ID 操作
	case "add_bot_id":
		if value == "" {
			return "请提供要添加的机器人ID", nil
		}
		botID, _ := raw["bot_id"].(map[string]interface{})
		if botID == nil {
			botID = make(map[string]interface{})
		}
		botID[value] = true
		raw["bot_id"] = botID
		return fmt.Sprintf("已添加机器人ID: %s", value), writeBotConfigFile(raw)

	case "remove_bot_id":
		if value == "" {
			return "请提供要移除的机器人ID", nil
		}
		botID, _ := raw["bot_id"].(map[string]interface{})
		if botID != nil {
			delete(botID, value)
			if len(botID) == 0 {
				delete(raw, "bot_id")
			} else {
				raw["bot_id"] = botID
			}
		}
		return fmt.Sprintf("已移除机器人ID: %s", value), writeBotConfigFile(raw)

	// 屏蔽用户操作
	case "add_disabled_user_id":
		if value == "" {
			return "请提供要屏蔽的用户ID", nil
		}
		disabledUID, _ := raw["disabled_user_id"].(map[string]interface{})
		if disabledUID == nil {
			disabledUID = make(map[string]interface{})
		}
		disabledUID[value] = true
		raw["disabled_user_id"] = disabledUID
		return fmt.Sprintf("已屏蔽用户: %s", value), writeBotConfigFile(raw)

	case "remove_disabled_user_id":
		if value == "" {
			return "请提供要取消屏蔽的用户ID", nil
		}
		disabledUID, _ := raw["disabled_user_id"].(map[string]interface{})
		if disabledUID != nil {
			delete(disabledUID, value)
			if len(disabledUID) == 0 {
				delete(raw, "disabled_user_id")
			} else {
				raw["disabled_user_id"] = disabledUID
			}
		}
		return fmt.Sprintf("已取消屏蔽用户: %s", value), writeBotConfigFile(raw)

	// 事件开关
	case "enable_event":
		validEvents := map[string]bool{
			"private.message.create": true,
			"message.create":         true,
			"interaction.create":     true,
		}
		if !validEvents[value] {
			return fmt.Sprintf("无效的事件类型: %s，可选值: private.message.create, message.create, interaction.create", value), nil
		}
		disabledSelects, _ := raw["disabled_selects"].(map[string]interface{})
		if disabledSelects != nil {
			delete(disabledSelects, value)
			if len(disabledSelects) == 0 {
				delete(raw, "disabled_selects")
			} else {
				raw["disabled_selects"] = disabledSelects
			}
		}
		return fmt.Sprintf("已启用事件: %s", value), writeBotConfigFile(raw)

	case "disable_event":
		validEvents := map[string]bool{
			"private.message.create": true,
			"message.create":         true,
			"interaction.create":     true,
		}
		if !validEvents[value] {
			return fmt.Sprintf("无效的事件类型: %s，可选值: private.message.create, message.create, interaction.create", value), nil
		}
		disabledSelects, _ := raw["disabled_selects"].(map[string]interface{})
		if disabledSelects == nil {
			disabledSelects = make(map[string]interface{})
		}
		disabledSelects[value] = true
		raw["disabled_selects"] = disabledSelects
		return fmt.Sprintf("已禁用事件: %s", value), writeBotConfigFile(raw)

	// 正则和处理器配置
	case "disabled_text_regular":
		if value == "" {
			delete(raw, "disabled_text_regular")
		} else {
			raw["disabled_text_regular"] = value
		}
		return "已更新禁用消息正则", writeBotConfigFile(raw)

	case "redirect_text_regular":
		if value == "" {
			delete(raw, "redirect_text_regular")
		} else {
			raw["redirect_text_regular"] = value
		}
		return "已更新URL重定向正则", writeBotConfigFile(raw)

	case "redirect_text_target":
		if value == "" {
			delete(raw, "redirect_text_target")
		} else {
			raw["redirect_text_target"] = value
		}
		return "已更新URL重定向替换文本", writeBotConfigFile(raw)

	case "repeated_event_time":
		processor, _ := raw["processor"].(map[string]interface{})
		if processor == nil {
			processor = make(map[string]interface{})
		}
		if n, err := strconv.Atoi(value); err == nil {
			processor["repeated_event_time"] = n
		} else {
			processor["repeated_event_time"] = 60000
		}
		raw["processor"] = processor
		return fmt.Sprintf("已将相同消息ID过滤时间设置为: %sms", value), writeBotConfigFile(raw)

	case "repeated_user_time":
		processor, _ := raw["processor"].(map[string]interface{})
		if processor == nil {
			processor = make(map[string]interface{})
		}
		if n, err := strconv.Atoi(value); err == nil {
			processor["repeated_user_time"] = n
		} else {
			processor["repeated_user_time"] = 1000
		}
		raw["processor"] = processor
		return fmt.Sprintf("已将同用户消息过滤时间设置为: %sms", value), writeBotConfigFile(raw)

	default:
		// 支持任意 YAML 路径（用点号分隔嵌套键，如 mysql.port）
		return te.setArbitraryConfigField(raw, field, value)
	}
}

// logConfigChange 记录配置变更日志
func logConfigChange(field, value string) {
	logger.Info("[BotConfig] 修改配置: %s = %s", field, value)
}

// smartParseValue 将字符串值智能转换为合适的类型
func smartParseValue(value string) interface{} {
	if value == "true" {
		return true
	}
	if value == "false" {
		return false
	}
	if n, err := strconv.Atoi(value); err == nil {
		return n
	}
	if f, err := strconv.ParseFloat(value, 64); err == nil {
		return f
	}
	return value
}

// setArbitraryConfigField 设置任意 YAML 路径的配置值
// 支持点号分隔的嵌套路径，如 "mysql.port" → { mysql: { port: value } }
func (te *ToolExecutor) setArbitraryConfigField(raw map[string]interface{}, field, value string) (string, error) {
	parts := strings.Split(field, ".")
	if len(parts) == 1 {
		// 顶层字段
		if value == "" {
			delete(raw, field)
			return fmt.Sprintf("已清除配置字段: %s", field), writeBotConfigFile(raw)
		}
		raw[field] = smartParseValue(value)
		return fmt.Sprintf("已设置 %s = %s", field, value), writeBotConfigFile(raw)
	}

	// 嵌套路径：逐层创建/获取 map
	current := raw
	for i := 0; i < len(parts)-1; i++ {
		key := parts[i]
		next, ok := current[key].(map[string]interface{})
		if !ok {
			next = make(map[string]interface{})
			current[key] = next
		}
		current = next
	}

	lastKey := parts[len(parts)-1]
	if value == "" {
		delete(current, lastKey)
		return fmt.Sprintf("已清除配置字段: %s", field), writeBotConfigFile(raw)
	}
	current[lastKey] = smartParseValue(value)
	return fmt.Sprintf("已设置 %s = %s", field, value), writeBotConfigFile(raw)
}
