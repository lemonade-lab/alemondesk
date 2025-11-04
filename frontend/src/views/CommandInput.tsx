import { useNotification } from '@/context/Notification'
import { RootState } from '@/store'
import { Pause, Play } from '@/common/ui/Icons'
import { Input } from '@alemonjs/react-ui'
import { PrimaryDiv } from '@alemonjs/react-ui'
import { SecondaryDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import { useState, useRef, useEffect, Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ReloadOutlined } from '@ant-design/icons'
import { setCommand } from '@/store/command'
import { ExpansionsClose, ExpansionsRun } from '@wailsjs/window/expansions/app'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import ExpansionIcon from '@/common/ExpansionIcon'
import { CommandItem, ControllerItem } from './types'

const isMac = 'darwin'

export default function CommandInput() {
  const notification = useNotification()
  const dispatch = useDispatch()

  const modules = useSelector((state: RootState) => state.modules)
  const expansions = useSelector((state: RootState) => state.expansions)
  const version = useSelector((state: RootState) => state.about.version)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const commandViewList = useMemo(() => {
    const init = [
      {
        name: '开发者工具',
        icon: 'antd.ToolOutlined',
        command: 'app.open.devtools',
        commond: 'app.open.devtools',
        expansions_name: '开发者工具'
      }
    ]
    return expansions.package
      ?.flatMap(item => {
        // 读取command配置
        const commond = item.alemonjs?.desktop?.commond || []
        const command = item.alemonjs?.desktop?.command || []
        return (
          [...commond, ...command].map((sidebar: CommandItem) => ({
            ...sidebar,
            command: sidebar.command ?? sidebar.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      })
      .concat(init)
  }, [expansions.package])

  const viewControllers = useMemo(() => {
    const controllers =
      expansions.package?.flatMap(item => {
        return (
          // 读取侧边栏设置
          item.alemonjs?.desktop?.controls?.map((menu: ControllerItem) => ({
            ...menu,
            command: menu.command ?? menu.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      }) || []
    // 判断当前是什么系统。
    if (version === isMac) {
      // 默认在右边。找到所有在左边的
      // 找到左右在 左边的
      const left = controllers.filter(item => item.position === 'left')
      const right = controllers.filter(item => item.position !== 'left')
      return [left, right]
    }
    // 找到所有在 右边的
    const right = controllers.filter(item => item.position === 'right')
    const left = controllers.filter(item => item.position !== 'right')
    return [left, right]
  }, [expansions.package, version])

  const viewControllersLeft = viewControllers[0]
  const viewControllersRight = viewControllers[1]

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current) {
        const target = event.target as HTMLElement
        if (!dropdownRef.current?.contains(target)) {
          setIsDropdownOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex-[6] flex gap-2 justify-center items-center">
      {
        // TODO 支持快捷键打开下拉菜单
      }
      {isDropdownOpen ? (
        <div ref={dropdownRef} className="absolute top-0 left-1/2 transform -translate-x-1/2  z-10">
          <PrimaryDiv className={classNames('rounded-md  shadow-md p-1')}>
            <Input
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              // 回车
              onKeyUp={(e: any) => {
                if (e.key === 'Enter') {
                  const value = e.target.value
                  // 记录当前的命令
                  dispatch(setCommand(value))
                  // 关闭下拉菜单
                  setIsDropdownOpen(false)
                }
              }}
              placeholder="请输入指令"
              className="border rounded-md min-w-72 px-2 py-1 h-6"
              aria-label="Command Input"
            />
            <div className="py-2 flex flex-col gap-2 scrollbar overflow-y-auto  max-h-[calc(100vh/5*2)]">
              {commandViewList.map((item, index) => (
                <PrimaryDiv
                  hover={true}
                  key={index}
                  onClick={() => {
                    if (!modules.nodeModulesStatus) return
                    // 记录当前的命令
                    dispatch(setCommand(item.command))
                    // 关闭下拉菜单
                    setIsDropdownOpen(false)
                  }}
                  className={classNames(
                    'flex justify-between items-center px-2 py-1 cursor-pointer duration-700 transition-all rounded-md'
                  )}
                >
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center ">
                      <ExpansionIcon
                        name={item.name}
                        icon={item.icon}
                        expansions_name={item.expansions_name}
                      />
                    </div>
                    <div className="flex items-center justify-center ">{item.name}</div>
                  </div>
                  <div className="text-secondary-text">{item.command}</div>
                </PrimaryDiv>
              ))}
            </div>
          </PrimaryDiv>
        </div>
      ) : (
        <Fragment>
          <div className="flex-1 flex gap-2 items-center justify-end drag-area">
            {
              // 显示左边的
              viewControllersLeft.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer"
                  onClick={() => {
                    if (item.command) {
                      // 记录当前的命令
                      dispatch(setCommand(item.command))
                    }
                  }}
                >
                  <ExpansionIcon
                    name={item?.name ?? item?.icon}
                    icon={item?.icon}
                    expansions_name={item?.expansions_name ?? item?.icon}
                  />
                </div>
              ))
            }
            <div className="steps-2">
              <div
                onClick={() => {
                  YarnCommands({
                    type: 'install',
                    args: ['--ignore-warnings']
                  })
                }}
              >
                <ReloadOutlined />
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div
              ref={dropdownRef}
              className="w-full relative steps-3"
              onClick={() => {
                // 检查是否加载完毕
                if (!modules.nodeModulesStatus) {
                  // 通知
                  notification('依赖未加载', 'warning')
                  return
                }
                setIsDropdownOpen(prev => !prev)
              }}
              aria-expanded={isDropdownOpen}
              role="button"
            >
              <SecondaryDiv className="text-sm  cursor-pointer border flex justify-center items-center h-[1.1rem] rounded-md">
                <span className="">输入指令</span>
              </SecondaryDiv>
            </div>
          </div>
          <div
            className={classNames('flex-1 flex items-center', {
              'drag-area h-full': !modules.nodeModulesStatus
            })}
          >
            {
              // 当依赖加载完毕后再显示操作按钮
            }
            <div className="flex flex-1">
              <div className="steps-1 flex gap-2 justify-center items-center">
                {viewControllersRight.map((item, index) => (
                  <div
                    key={index}
                    className="cursor-pointer"
                    onClick={() => {
                      if (item.command) {
                        // 记录当前的命令
                        dispatch(setCommand(item.command))
                      }
                    }}
                  >
                    <ExpansionIcon
                      name={item?.name ?? item?.icon}
                      icon={item?.icon}
                      expansions_name={item?.expansions_name ?? item?.icon}
                    />
                  </div>
                ))}
                {expansions.runStatus ? (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      ExpansionsClose()
                    }}
                  >
                    <Pause width={20} height={20} />
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (!modules.nodeModulesStatus) {
                        notification('依赖未加载', 'warning')
                        return
                      }
                      ExpansionsRun([])
                    }}
                  >
                    <Play width={20} height={20} />
                  </div>
                )}
              </div>
              <div className="drag-area flex-1 "></div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )
}
