import BaseGuide from './Base'

// 引导
const KEY = 'FIRST_GUIDE_v2'
// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps = [
  {
    target: '.steps-4',
    content: '点击回到主页'
  },
  {
    target: '.steps-5',
    content: '查看运行日志，启动或停止机器人'
  },
  {
    target: '.steps-5-1',
    content: '管理本地扩展'
  },
  {
    target: '.steps-6',
    content: '浏览和安装扩展'
  },
  {
    target: '.steps-7',
    content: '查看和操作已安装的应用'
  },
  {
    target: '.steps-config',
    content: '配置机器人的运行参数'
  },
  {
    target: '.steps-8',
    content: '个性化设置，如主题、通用选项等'
  }
]

export default function GuideMain({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
