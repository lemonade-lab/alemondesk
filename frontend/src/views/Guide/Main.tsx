import BaseGuide from './Base'

// 引导
const KEY = 'FIRST_GUIDE_v3'
// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps = [
  {
    target: '.steps-0',
    content: '这是主工作区，左侧是导航菜单，右侧是内容区域'
  },
  {
    target: '.steps-4',
    content: '🏠 主页按钮：点击回到主页，主页包含 AI 对话和运行日志'
  },
  {
    target: '.steps-6',
    content: '🧩 扩展市场：浏览、搜索和安装社区扩展来增强机器人功能'
  },
  {
    target: '.steps-7',
    content: '📦 应用管理：查看和操作已安装扩展提供的应用'
  },
  {
    target: '.steps-config',
    content: '📋 运行配置：管理机器人的配置文件和运行参数'
  },
  {
    target: '.steps-ai',
    content: '🤖 AI 设置：配置 AI 助手的模型和参数'
  },
  {
    target: '.steps-8',
    content: '⚙️ 系统设置：个性化设置，包括主题、通用选项等'
  }
]

export default function GuideMain({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
