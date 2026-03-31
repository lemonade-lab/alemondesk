import BaseGuide from './Base'

// 引导
const KEY = 'FIRST_GUIDE_COMMON_v1'

// 条件
const KEY_DATA = '4'

// 定义引导步骤
const steps: {
  target: string
  content: string
}[] = [
  {
    target: '.steps-npm-detail',
    content: '🖥️ 扩展详情：选中扩展后在这里查看说明文档、版本信息，执行安装/卸载/升级等操作'
  },
  {
    target: '.steps-npm-tabs',
    content: '📑 标签栏：在"已安装"、"搜索扩展"和"克隆仓库"三个功能之间切换'
  },
  {
    target: '.steps-tab-installed',
    content: '📋 已安装：查看当前项目已安装的所有扩展，点击可查看详情。有扩展时会出现"一键npm最新"和"一键git最新"批量更新按钮'
  },
  {
    target: '.steps-tab-search',
    content: '🔍 搜索扩展：在 npm 仓库中搜索 alemonjs 扩展，找到后可直接点击安装到项目中'
  },
  {
    target: '.steps-tab-clone',
    content: '📥 克隆仓库：通过 Git 地址克隆扩展源码到本地，支持 GitHub 代理加速。适合开发调试或使用未发布的扩展'
  },
  {
    target: '.steps-npm-content',
    content: '📦 内容区域：根据当前标签显示已安装列表、搜索结果或克隆表单'
  }
]

export default function GuideCommon({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
