import Box from '@/common/layout/Box'

const data = [
  {
    version: '1.0.0',
    log: [
      '启动速度，9～15s  -> 1～3s。',
      '渲染速度快，卡顿率下降。',
      '拥有更高的执行性能。',
      '内置依赖文件。智能缓存。（不再需要手动安装）',
      '删除了自动更新。',
      '删除了npm商店（不稳定）',
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
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex size-full">
      <div className="flex-col gap-2 flex-1 flex p-4 size-full">
        <div className="flex flex-col flex-1 p-2 rounded-lg shadow-inner size-full">
          <div
            className="text-2xl flex items-center justify-between font-semibold mb-4 border-b
            border-secondary-border
           dark:border-dark-secondary-border
          "
          >
            <div>更新日志</div>
          </div>
          <Box className="flex flex-col gap-4 h-[calc(100vh-11rem)] overflow-auto scrollba">
            <div className="flex  flex-col flex-1 overflow-auto h-[calc(100vh-2.4rem)] scrollbar gap-6 py-4 rounded-lg  ">
              {data.map((item, index) => (
                <div key={index}>
                  <h2 className="text-2xl font-semibold mb-4">{item.version}</h2>
                  <ul className="list-disc pl-6 space-y-2 ">
                    {item.log.map((log, index) => (
                      <li key={index} className="text-sm ">
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Box>
        </div>
      </div>
    </div>
  )
}

export default Notice
