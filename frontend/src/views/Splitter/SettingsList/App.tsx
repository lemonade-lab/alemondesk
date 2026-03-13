import { SidebarDiv } from '@alemonjs/react-ui'
import { useNavigate, useLocation } from 'react-router-dom'

const SettingsList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // 按钮列表
  const buttons = [
    {
      children: '通用',
      path: '/settings/common',
      onClick: () => {
        navigate('/settings/common')
      }
    },
    {
      children: '主题',
      path: '/settings/theme',
      onClick: () => {
        navigate('/settings/theme')
      }
    },
    {
      children: '记录',
      path: '/settings/notice',
      onClick: () => {
        navigate('/settings/notice')
      }
    },
    {
      children: '关于',
      path: '/settings/about',
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
          className={`px-4 py-2 cursor-pointer border-b text-sm transition-colors ${
            location.pathname === item.path
              ? 'bg-secondary-bg dark:bg-dark-secondary-bg font-semibold'
              : 'border-secondary-border dark:border-dark-secondary-border hover:bg-secondary-bg/50 dark:hover:bg-dark-secondary-bg/50'
          }`}
        >
          {item.children}
        </div>
      ))}
    </SidebarDiv>
  )
}

export default SettingsList
