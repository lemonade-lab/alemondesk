import BaseGuide from './Base'

// 引导
const KEY = 'FIRST_GUIDE_HOME_v1'
// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps = [
  {
    target: '.steps-home-chat',
    content: '💬 AI 对话区：在这里与 AI 助手对话，可以用自然语言操控机器人，如"启动机器人"、"安装依赖"等'
  },
  {
    target: '.steps-home-terminal',
    content: '📟 终端面板：查看运行日志，启动或停止机器人，管理依赖和扩展器'
  },
  {
    target: '.steps-home-conversations',
    content: '📋 对话列表：管理多个对话，点击新建或切换不同的对话会话'
  }
]

export default function GuideHome({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
