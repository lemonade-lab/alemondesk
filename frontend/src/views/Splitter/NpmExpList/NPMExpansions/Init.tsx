import { AppstoreAddOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'

export const Init = () => {
  return (
    <div className="flex flex-col overflow-hidden flex-1 justify-center items-center p-6 gap-6">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex items-start gap-3 p-3 rounded-md opacity-70">
          <SearchOutlined className="text-lg mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium">搜索扩展</div>
            <div className="text-xs opacity-60">在右侧切换到「搜索扩展」标签，输入关键词查找</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-md opacity-70">
          <ThunderboltOutlined className="text-lg mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium">一键安装</div>
            <div className="text-xs opacity-60">找到需要的扩展后，点击安装即可自动完成配置</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-md opacity-70">
          <AppstoreAddOutlined className="text-lg mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium">查看详情</div>
            <div className="text-xs opacity-60">点击已安装的扩展名称查看详细信息、更新或卸载</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Init
