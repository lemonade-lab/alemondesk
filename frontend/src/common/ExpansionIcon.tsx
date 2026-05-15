import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { AntdIcon } from './ui/AntdIcon'
import { TagOutlined } from '@ant-design/icons'

type IconProps = {
  name: string
  icon: string
  expansions_name: string
}

const ExpansionIcon = (props: IconProps) => {
  const app = useSelector((state: RootState) => state.app)
  const createIconURL = (viewItem: IconProps) => {
    return `${RESOURCE_PROTOCOL_PREFIX}${app.userDataTemplatePath}/node_modules/${viewItem.expansions_name}/${viewItem.icon}`
  }
  const createIcon = (viewItem: IconProps) => {
    if (!viewItem.icon) {
      return <TagOutlined className="text-sm opacity-75" />
    }
    if (viewItem.icon.startsWith('antd.')) {
      // 是antd的图标
      const icon = viewItem.icon.split('.')[1]
      return <AntdIcon className="text-lg" defaultIcon={<TagOutlined className="text-sm opacity-75" />} icon={icon} />
    }
    return (
      <img
        className="size-10 flex justify-center items-center rounded-md"
        src={createIconURL(viewItem)}
      />
    )
  }
  return createIcon(props)
}

export default ExpansionIcon
