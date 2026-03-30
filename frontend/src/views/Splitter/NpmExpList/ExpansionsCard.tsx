import { CheckCircleOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'
import { PrimaryDiv } from '@alemonjs/react-ui'

const ExpansionsCard = ({
  item,
  handlePackageClick
}: {
  item: any
  handlePackageClick: (name: string) => void
}) => {
  return (
    <PrimaryDiv
      hover={true}
      onClick={() => handlePackageClick(item.name)}
      className="cursor-pointer rounded-sm relative flex gap-1 p-2 flex-row justify-between items-center duration-300 transition-all"
    >
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="text-md flex gap-1 items-center">
            <FileTextOutlined />
            <span className="truncate">{item.name}</span>
            {item.isLink && <LinkOutlined className="text-xs opacity-50" />}
          </div>
          <div className="text-xs opacity-70 shrink-0 ml-1 flex items-center gap-1">
            <CheckCircleOutlined className="text-green-500" />
            {item.version}
          </div>
        </div>
        {item.description && (
          <div className="text-xs opacity-60 truncate">{item.description}</div>
        )}
      </div>
    </PrimaryDiv>
  )
}

export default ExpansionsCard
