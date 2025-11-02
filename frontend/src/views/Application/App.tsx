import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { setCommand } from '@/store/command'
import { useLocation } from 'react-router-dom'
import { SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import { TagDiv } from '@alemonjs/react-ui'
import WebView from '@/common/WebView'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import ExpansionIcon from '@/common/ExpansionIcon'

interface Sidebar {
  expansions_name: string
  name: string
  icon: string
  commond?: string
  command: string
}

export default function Webviews() {
  const location = useLocation()
  const dispatch = useDispatch()
  const expansions = useSelector((state: RootState) => state.expansions)
  const command = useSelector((state: RootState) => state.command)
  const [view, setView] = useState('')

  const viewSidebars = useMemo(() => {
    return (
      expansions.package?.flatMap(item => {
        return (
          item.alemonjs?.desktop?.sidebars?.map((sidebar: Sidebar) => ({
            ...sidebar,
            command: sidebar.command ?? sidebar.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      }) || []
    )
  }, [expansions.package])

  // 点击侧边栏
  const handleSidebarClick = (viewItem: Sidebar) => {
    console.log('点击侧边栏', viewItem)
    if (viewItem.command === command.name) {
      return
    }
    // 记录当前的命令
    dispatch(setCommand(viewItem.command))
  }

  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view)
    }
  }, [location.state])
 
  return (
    <section className=" flex flex-col flex-1 shadow-md">
      <div className="flex flex-1">
        <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 ">
          {view && (
            <WebView
              src={view}
              name={command.name}
              rules={[
                {
                  protocol: 'resource://-/',
                  work: RESOURCE_PROTOCOL_PREFIX,
                }
              ]}
            />
          )}
          {!view && (
            <div className="flex-1 flex justify-center items-center">
              <div className="flex-col flex justify-center items-center">
                {viewSidebars.length === 0
                  ? '未找到相关扩展，请包管理下载'
                  : '可选择右侧导航栏中的应用进行查看'}
              </div>
            </div>
          )}
        </SecondaryDiv>
        <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col  w-72 xl:w-80 border-l h-full">
          <div className="flex flex-wrap gap-1 p-1">
            {viewSidebars
              .sort(item => {
                if (item.name == 'APPS') return -1
                return /@alemonjs-/.test(item.expansions_name) ? -1 : 1
              })
              .map((viewItem, index) => (
                <TagDiv
                  key={index}
                  onClick={() => handleSidebarClick(viewItem)}
                  className={classNames(
                    'p-1 size-[3.28rem] rounded-md border text-sm relative flex cursor-pointer justify-center items-center duration-700 transition-all  ',
                    { 'bg-secondary-bg': viewItem.command === command.name }
                  )}
                >
                  <ExpansionIcon name={viewItem.name} icon={viewItem.icon} expansions_name={viewItem.expansions_name} />
                </TagDiv>
              ))}
          </div>
        </SidebarDiv>
      </div>
    </section>
  )
}
