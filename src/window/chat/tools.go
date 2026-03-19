package windowchat

// ToolDef 工具定义
type ToolDef struct {
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	RequireConfirm bool                   `json:"-"` // 是否需要用户确认
	Parameters     map[string]interface{} `json:"parameters"`
}

// 注册所有可用工具
func getAllTools() []ToolDef {
	return []ToolDef{
		// ===== 查询类（无需确认）=====
		{
			Name:           "get_bot_status",
			Description:    "查询机器人是否正在运行",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "get_expansions_status",
			Description:    "查询扩展服务是否正在运行",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "get_theme_mode",
			Description:    "查询当前主题模式（深色/浅色）",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "get_versions",
			Description:    "查询应用版本、平台和系统信息",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "list_repos",
			Description:    "列出已安装的功能包或插件仓库",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"space": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"packages", "plugins"},
						"description": "查看 packages(功能包) 还是 plugins(插件)",
					},
				},
				"required": []string{"space"},
			},
		},
		// ===== 导航类（无需确认）=====
		{
			Name:           "navigate",
			Description:    "导航到指定页面。可选值: home(首页), git-exp-list(Git仓库管理), npm-exp-list(NPM扩展管理), pkg-app-list(扩展应用), config(配置文件编辑), settings(设置), settings/common(通用设置), settings/ai(AI设置), settings/theme(主题设置), settings/about(关于), settings/notice(更新日志)",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"page": map[string]interface{}{
						"type":        "string",
						"description": "目标页面路径",
					},
				},
				"required": []string{"page"},
			},
		},
		// ===== 机器人操作 =====
		{
			Name:           "start_bot",
			Description:    "启动机器人",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "stop_bot",
			Description:    "停止机器人",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "reset_bot",
			Description:    "重置机器人（删除并重建，数据会丢失）",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		// ===== 主题操作 =====
		{
			Name:           "switch_theme",
			Description:    "切换主题模式（深色或浅色）",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"mode": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"dark", "light"},
						"description": "目标主题模式",
					},
				},
				"required": []string{"mode"},
			},
		},
		{
			Name:           "reset_theme",
			Description:    "重置主题为默认样式",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		// ===== Yarn/NPM 操作 =====
		{
			Name:           "yarn_install",
			Description:    "安装所有依赖（相当于 yarn install）",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "install_package",
			Description:    "使用 yarn 安装一个 npm 包",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type":        "string",
						"description": "要安装的包名",
					},
				},
				"required": []string{"name"},
			},
		},
		{
			Name:           "remove_package",
			Description:    "使用 yarn 卸载一个 npm 包",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type":        "string",
						"description": "要卸载的包名",
					},
				},
				"required": []string{"name"},
			},
		},
		{
			Name:           "upgrade_package",
			Description:    "升级指定的 npm 包到最新版本",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type":        "string",
						"description": "要升级的包名",
					},
				},
				"required": []string{"name"},
			},
		},
		// ===== Git 操作 =====
		{
			Name:           "clone_repo",
			Description:    "克隆一个 git 仓库到本地",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"url": map[string]interface{}{
						"type":        "string",
						"description": "git 仓库地址",
					},
					"space": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"packages", "plugins"},
						"description": "安装到 packages 还是 plugins",
					},
				},
				"required": []string{"url", "space"},
			},
		},
		{
			Name:           "delete_repo",
			Description:    "删除一个已安装的仓库",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type":        "string",
						"description": "仓库名称",
					},
					"space": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"packages", "plugins"},
						"description": "packages 还是 plugins",
					},
				},
				"required": []string{"name", "space"},
			},
		},
		{
			Name:           "git_checkout",
			Description:    "切换仓库的分支",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"space": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"packages", "plugins"},
						"description": "packages 还是 plugins",
					},
					"name": map[string]interface{}{
						"type":        "string",
						"description": "仓库名称",
					},
					"branch": map[string]interface{}{
						"type":        "string",
						"description": "目标分支名",
					},
				},
				"required": []string{"space", "name", "branch"},
			},
		},
		{
			Name:           "git_fetch",
			Description:    "拉取仓库的远程更新",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"space": map[string]interface{}{
						"type":        "string",
						"enum":        []string{"packages", "plugins"},
						"description": "packages 还是 plugins",
					},
					"url": map[string]interface{}{
						"type":        "string",
						"description": "仓库远程地址",
					},
				},
				"required": []string{"space", "url"},
			},
		},
		// ===== 扩展服务 =====
		{
			Name:           "start_expansions",
			Description:    "启动扩展服务",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "stop_expansions",
			Description:    "停止扩展服务",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		// ===== 主题变量 =====
		{
			Name:           "get_theme_variables",
			Description:    "获取当前主题的颜色变量列表（JSON格式）。可指定分类筛选，如 primary、button、input 等",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"category": map[string]interface{}{
						"type":        "string",
						"description": "可选，按分类筛选变量。如 primary/secondary/header/nav/bar/sidebar/tag/button/input/select/textarea/switch/notification。不填则返回全部",
					},
				},
			},
		},
		{
			Name:           "edit_theme_variables",
			Description:    "批量修改主题颜色变量并立即应用到桌面。参数为 JSON 字符串，键为变量名（不含 alemonjs- 前缀），值为颜色值（如 #ff0000）。修改会保存到个性化主题文件",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"variables": map[string]interface{}{
						"type":        "string",
						"description": "JSON格式的变量修改。键为变量名（不含 alemonjs- 前缀），值为颜色值。例: {\"primary-bg\":\"#ff6b9d\",\"primary-text\":\"#ffffff\"}。深色模式变量需加 dark- 前缀，如 dark-primary-bg",
					},
				},
				"required": []string{"variables"},
			},
		},
		// ===== 机器人配置 =====
		{
			Name:           "get_bot_config",
			Description:    "查看机器人的配置信息（平台、端口、管理员、消息过滤等）",
			RequireConfirm: false,
			Parameters: map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		{
			Name:           "edit_bot_config",
			Description:    "编辑机器人配置。可修改平台(login)、端口(port)、连接地址(url)、管理员ID(master_id)、屏蔽用户(disabled_user_id)、消息事件开关(disabled_selects)、全量消息接收(is_full_receive)等，也可设置任意自定义字段（如插件配置，用点号分隔嵌套路径，如 mysql.port）",
			RequireConfirm: true,
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"field": map[string]interface{}{
						"type":        "string",
						"description": "要修改的配置字段。内置字段: login/port/serverPort/input/url/is_full_receive/add_master_id/remove_master_id/add_bot_id/remove_bot_id/add_disabled_user_id/remove_disabled_user_id/enable_event/disable_event/disabled_text_regular/redirect_text_regular/redirect_text_target/repeated_event_time/repeated_user_time。也支持任意 YAML 路径，用点号分隔嵌套键，如 mysql.port、redis.host",
					},
					"value": map[string]interface{}{
						"type":        "string",
						"description": "要设置的值。数字会自动转换为数值类型，true/false 转为布尔类型。事件类型用 private.message.create/message.create/interaction.create",
					},
				},
				"required": []string{"field", "value"},
			},
		},
	}
}

// getToolByName 根据名称查找工具
func getToolByName(name string) *ToolDef {
	tools := getAllTools()
	for i := range tools {
		if tools[i].Name == name {
			return &tools[i]
		}
	}
	return nil
}

// buildToolsForAPI 构建 OpenAI function calling 格式的工具定义
func buildToolsForAPI() []map[string]interface{} {
	tools := getAllTools()
	result := make([]map[string]interface{}, len(tools))
	for i, t := range tools {
		result[i] = map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name":        t.Name,
				"description": t.Description,
				"parameters":  t.Parameters,
			},
		}
	}
	return result
}
