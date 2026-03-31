import BaseGuide from './Base'

const KEY = 'FIRST_GUIDE_PKGAPP_v1'
const KEY_DATA = '1'

const steps = [
  {
    target: '.steps-pkg-webview',
    content: '🖥️ 应用视图：这里展示已安装扩展提供的应用界面，选择右侧应用即可加载'
  },
  {
    target: '.steps-pkg-sidebar',
    content: '📂 应用列表：点击图标切换不同扩展提供的应用'
  }
]

export default function GuidePkgApp({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
