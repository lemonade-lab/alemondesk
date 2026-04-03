export type GuideStep = {
  target: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
}

type GuideEntry = { key: string; data: string; steps: GuideStep[] }

/** 所有新手引导统一注册：key / data / steps */
export const GUIDE_REGISTRY = {
  MAIN: {
    key: 'FIRST_GUIDE_v3',
    data: '1',
    steps: [
      { target: '.steps-0', content: '这是主工作区，左侧是导航菜单，右侧是内容区域', placement: 'center' as const },
      { target: '.steps-4', content: '主页按钮：点击回到主页，主页包含 AI 对话和运行日志' },
      { target: '.steps-6', content: '扩展市场：浏览、搜索和安装社区扩展来增强机器人功能' },
      { target: '.steps-7', content: '应用管理：查看和操作已安装扩展提供的应用' },
      { target: '.steps-config', content: '运行配置：管理机器人的配置文件和运行参数' },
      { target: '.steps-ai', content: 'AI 设置：配置 AI 助手的模型和参数' },
      { target: '.steps-8', content: '系统设置：个性化设置，包括主题、通用选项等' }
    ]
  },
  HOME: {
    key: 'FIRST_GUIDE_HOME_v1',
    data: '1',
    steps: [
      { target: '.steps-home-chat', content: 'AI 对话区：与 AI 助手对话，用自然语言操控机器人。例如输入"启动机器人"、"安装依赖"、"重置主题"等指令', placement: 'center' as const },
      { target: '.steps-home-terminal', content: '操控台：查看运行日志、启动/停止机器人、重载依赖、重启扩展。启动时需选择平台名称', placement: 'center' as const },
      { target: '.steps-home-terminal-toolbar', content: '操控台工具栏：包含清空日志、重载依赖、重启扩展、运行/停止机器人等快捷操作按钮' },
      { target: '.steps-home-conversations', content: '对话列表：管理多个 AI 对话会话，点击可新建或切换不同会话', placement: 'center' as const }
    ]
  },
  COMMON: {
    key: 'FIRST_GUIDE_COMMON_v1',
    data: '4',
    steps: [
      { target: '.steps-npm-tabs', content: '标签栏：在"已安装"、"搜索"和"克隆"三个功能之间切换' },
      { target: '.steps-tab-installed', content: '已安装：查看当前已安装的所有扩展，点击可查看详情和版本信息' },
      { target: '.steps-tab-search', content: '搜索扩展：在 npm 仓库中搜索 alemonjs 扩展，找到后一键安装' },
      { target: '.steps-tab-clone', content: '克隆仓库：通过 Git 地址克隆扩展源码到本地，支持 GitHub 代理加速' },
      { target: '.steps-npm-batch', content: '批量操作：一键将所有 npm 或 git 扩展更新到最新版本' },
      { target: '.steps-npm-content', content: '扩展列表：根据当前标签展示已安装列表、搜索结果或克隆表单', placement: 'center' as const },
      { target: '.steps-npm-detail', content: '扩展详情：选中扩展后查看说明文档，执行安装/卸载/升级等操作', placement: 'center' as const }
    ]
  },
  PKGAPP: {
    key: 'FIRST_GUIDE_PKGAPP_v1',
    data: '1',
    steps: [
      { target: '.steps-pkg-sidebar', content: '应用列表：右侧展示已安装扩展提供的应用图标，点击可切换加载不同应用', placement: 'center' as const },
      { target: '.steps-pkg-webview', content: '应用视图：选中应用后在此区域加载其界面，可以进行平台配置等操作', placement: 'center' as const }
    ]
  },
  CONFIG: {
    key: 'FIRST_GUIDE_CONFIG_v1',
    data: '1',
    steps: [
      { target: '.steps-config-form', content: '配置管理：编辑机器人配置文件(alemon.config.yaml)，修改后点击保存即可生效', placement: 'center' as const },
      { target: '.steps-config-basic', content: '基础配置：设置登录登录名，如onebot，以及端口号、服务器端口等核心运行参数' },
      { target: '.steps-config-permission', content: '权限管理：配置管理员Key，让机器人可以判断谁是管理员，执行敏感操作' },
      { target: '.steps-config-filter', content: '消息过滤：设置屏蔽用户、屏蔽关键词正则、事件类型开关，过滤不需要的消息' }
    ]
  },
  AI_SETTINGS: {
    key: 'FIRST_GUIDE_AISETTINGS_v1',
    data: '1',
    steps: [
      { target: '.steps-ai-panel', content: '配置 AI 助手的模型接口，保存后立即生效。支持 OpenAI 兼容接口（Ollama / DeepSeek / GPT 等）', placement: 'center' as const },
      { target: '.steps-ai-endpoint', content: 'API 地址：填写模型服务的接口地址。推荐使用deepseek。访问 https://www.deepseek.com/ 打开API开放平台创建 API Key。' },
      { target: '.steps-ai-model', content: '模型选择：填写要使用的模型名称，deepseek推荐如deepseek-chat。若是ollama本地部署，推荐qwen3等' }
    ]
  },
  GIT_EXP: {
    key: 'FIRST_GUIDE_GITEXP_v1',
    data: '1',
    steps: [
      { target: '.steps-git-tabs', content: '标签栏：在"扩展列表"和"克隆仓库"之间切换，还可选择空间（扩展包/插件）' },
      { target: '.steps-git-list', content: '仓库列表：查看已克隆的 Git 仓库，点击可查看详情和 README，支持删除操作', placement: 'center' as const },
      { target: '.steps-git-clone', content: '克隆仓库：输入 Git 地址克隆仓库到本地，支持指定分支、深度和强制覆盖', placement: 'center' as const }
    ]
  }
} as const satisfies Record<string, GuideEntry>

/** 重置所有引导状态 */
export function resetAllGuides() {
  Object.values(GUIDE_REGISTRY).forEach(({ key }) => localStorage.removeItem(key))
}
