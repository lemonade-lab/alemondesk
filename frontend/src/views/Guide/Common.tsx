import BaseGuide from './Base'

// 引导
const KEY = 'FIRST_GUIDE_COMMON'

// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps: {
  target: string
  content: string
}[] = [
  // {
  //   target: '.steps-common-2',
  //   content: '如果你想加载个性化机器人，或把桌面安装到指定目录，可“以指定目录打开”'
  // }
]

export default function GuideCommon({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
