import { useMemo } from 'react'
import classNames from 'classnames'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { setCommand } from '@/store/command'
import { SidebarDiv } from '@alemonjs/react-ui'
import { TagDiv } from '@alemonjs/react-ui'
import ExpansionIcon from '@/common/ExpansionIcon'
import { CommandItem } from '@/views/types'
import { getDesktopSidebars, hasDesktopEntry } from '@/common/expansionPackage'

export default function PkgAppList() {
  const dispatch = useDispatch()
  const expansions = useSelector((state: RootState) => state.expansions)
  const command = useSelector((state: RootState) => state.command)

  const viewSidebars = useMemo(() => {
    return expansions.package?.flatMap(item => getDesktopSidebars(item)) || []
  }, [expansions.package])

  const desktopReadyCount = useMemo(
    () => expansions.package.filter(item => hasDesktopEntry(item)).length,
    [expansions.package]
  )

  // 点击侧边栏
  const handleSidebarClick = (viewItem: CommandItem) => {
    if (viewItem.command === command.name) {
      return
    }
    // 记录当前的命令
    dispatch(setCommand(viewItem.command))
  }

  return (
    <SidebarDiv className="steps-pkg-sidebar animate__animated animate__fadeInRight duration-500 flex flex-col border-l size-full">
      <div className="flex flex-wrap gap-1 p-1">
        {viewSidebars.length > 0 ? (
          viewSidebars
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
                <ExpansionIcon
                  name={viewItem.name}
                  icon={viewItem.icon}
                  expansions_name={viewItem.expansions_name}
                />
              </TagDiv>
            ))
        ) : (
          <div className="p-2 text-xs opacity-60">
            {expansions.package.length === 0
              ? '当前没有已安装扩展'
              : desktopReadyCount === 0
                ? '已安装扩展里没有声明桌面侧边栏入口'
                : '当前没有可显示的应用入口'}
          </div>
        )}
      </div>
    </SidebarDiv>
  )
}
