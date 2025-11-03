import { setCommand } from '@/store/command'
import { SecondaryDiv, SidebarDiv } from '@alemonjs/react-ui'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

const Settings = () => {
  const dispatch = useDispatch()

  // 按钮列表
  const buttons = [
    {
      children: '通用',
      onClick: () => {
        const path = '/settings/common'
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      children: '主题',
      onClick: () => {
        const path = '/settings/theme'
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      children: '记录',
      onClick: () => {
        const path = '/settings/log'
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      children: '模板',
      onClick: () => {
        const path = '/settings/template'
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      children: '关于',
      onClick: () => {
        const path = '/settings/about'
        dispatch(setCommand(`view.${path}`))
      }
    }
  ]

  return (
    <section className=" flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        <Outlet />
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col min-w-16 border-l h-full">
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
    </section>
  )
}

export default Settings
