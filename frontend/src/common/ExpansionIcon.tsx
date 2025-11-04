import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { AntdIcon } from './ui/AntdIcon'

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
    if (!viewItem.icon) return viewItem.name
    if (viewItem.icon.startsWith('antd.')) {
      // 是antd的图标
      const icon = viewItem.icon.split('.')[1]
      return <AntdIcon className="text-xl" defaultIcon={viewItem.name} icon={icon} />
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
