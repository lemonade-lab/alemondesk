import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'

const data = [
  {
    version: '1.1.1',
    log: [
      '优化AI助手',
      '优化Markdown渲染',
    ]
  },
  {
    version: '1.1.0',
    log: [
      '支持AI助手并配置请求地址',
      '彻底打平扩展管理',
      '自动管理依赖',
      '新增配置可视化',
      '默认模板更新至最新版',
      '增加控制台关闭记忆',
      '优化引导',
      '支持一键升级包',
      '修复控制台折叠问题',
      '优化默认包显示问题',
      '优化markdown渲染',
      '优化控制台的信息展示'
    ]
  },
  {
    version: '1.0.0',
    log: [
      '启动速度，9～15s  -> 1～3s。',
      '渲染速度快，卡顿率下降。',
      '拥有更高的执行性能。',
      '内置运行环境，智能缓存（不再需要手动安装）',
      '删除了自动更新。',
      '删除了npm商店',
      '优化了日志系统',
      '优化了机器人快速启动流程',
      '优化了文件编辑功能',
      '删除了无用的快捷键',
      '支持主题导入导出'
    ]
  }
]

const Notice = () => {
  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">更新日志</div>
            </div>

            <div className="flex flex-col gap-6">
              {data.map((item, index) => (
                <div key={index}>
                  <h2 className="text-lg font-semibold mb-2">{item.version}</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    {item.log.map((log, i) => (
                      <li key={i} className="text-sm">
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
    </section>
  )
}

export default Notice
