import { SidebarDiv } from '@alemonjs/react-ui'
import { useNavigate } from 'react-router-dom'

const SettingsList = () => {
  const navigate = useNavigate()
  // 按钮列表
  const buttons = [
    {
      children: '通用',
      onClick: () => {
        navigate('/settings/common')
      }
    },
    {
      children: '主题',
      onClick: () => {
        navigate('/settings/theme')
      }
    },
    {
      children: '记录',
      onClick: () => {
        navigate('/settings/notice')
      }
    },
    {
      children: '模板',
      onClick: () => {
        navigate('/settings/files')
      }
    },
    {
      children: '关于',
      onClick: () => {
        navigate('/settings/about')
      }
    }
  ]

  return (
    <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col border-l size-full">
      {buttons.map(item => (
        <div
          key={item.children}
          onClick={item.onClick}
          className="px-4 py-2 cursor-pointer border-b border-gray-200 text-sm"
        >
          {item.children}
        </div>
      ))}
    </SidebarDiv>
  )
}

export default SettingsList
