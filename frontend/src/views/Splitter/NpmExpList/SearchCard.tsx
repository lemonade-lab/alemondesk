import { CheckCircleOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { PrimaryDiv } from '@alemonjs/react-ui'
import { SearchResultItem } from '@/store/NPMExpansions'

const SearchCard = ({
  item,
  isInstalled,
  onClick,
  onInstall
}: {
  item: SearchResultItem
  isInstalled: boolean
  onClick: () => void
  onInstall: () => void
}) => {
  return (
    <PrimaryDiv
      hover={true}
      onClick={onClick}
      className="cursor-pointer rounded-sm relative flex gap-1 p-2 flex-row justify-between items-center duration-300 transition-all"
    >
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="text-md flex gap-1 items-center">
            <FileTextOutlined />
            <span className="truncate">{item.name}</span>
          </div>
          <div className="text-xs opacity-70 shrink-0 ml-1">{item.version}</div>
        </div>
        {item.description && (
          <div className="text-xs opacity-60 truncate">{item.description}</div>
        )}
      </div>
      <div className="shrink-0 ml-2">
        {isInstalled ? (
          <span className="text-xs flex items-center gap-1 opacity-60">
            <CheckCircleOutlined /> 已安装
          </span>
        ) : (
          <span
            className="text-xs flex items-center gap-1 cursor-pointer hover:opacity-80"
            onClick={e => {
              e.stopPropagation()
              onInstall()
            }}
          >
            <DownloadOutlined /> 安装
          </span>
        )}
      </div>
    </PrimaryDiv>
  )
}

export default SearchCard
