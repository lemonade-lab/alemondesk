import { RootState } from '@/store'
import { SecondaryDiv } from '@alemonjs/react-ui'
import { useSelector } from 'react-redux'
import Common from './Common'

const renderMap = {
  common: <Common />,
  about: <div>about</div>,
  files: <div>files</div>,
  theme: <div>theme</div>,
  nice: <div>nice</div>
}

const Settings = () => {
  const settins = useSelector((state: RootState) => state.settings)

  return (
    <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 size-full">
      {renderMap[settins.key] || <div>暂无设置项</div>}
    </SecondaryDiv>
  )
}

export default Settings
