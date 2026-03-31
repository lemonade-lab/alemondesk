import BaseGuide from './Base'

const KEY = 'FIRST_GUIDE_CONFIG_v1'
const KEY_DATA = '1'

const steps = [
  {
    target: '.steps-config-form',
    content: '📋 运行配置：在这里管理机器人的配置文件（alemon.config.yaml），包括平台、端口、权限等参数'
  }
]

export default function GuideConfig({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
