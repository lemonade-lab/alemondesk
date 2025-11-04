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
import { Sidebar } from './types'

export default function CommandInput() {
  const notification = useNotification()
  const dispatch = useDispatch()

  const modules = useSelector((state: RootState) => state.modules)
  const expansions = useSelector((state: RootState) => state.expansions)

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
    return expansions.package?.flatMap(item => {
      const commond = item.alemonjs?.desktop?.commond || []
      const command = item.alemonjs?.desktop?.command || []
      return (
        [...commond, ...command].map((sidebar: Sidebar) => ({
          ...sidebar,
          command: sidebar.command ?? sidebar.commond ?? '',
          expansions_name: item.name
        })) || []
      )
    }).concat(init)
  }, [expansions.package])

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
            {/* <div className="flex justify-end">
              <BarDiv
                onClick={onClose}
                className=" duration-700 rounded-full px-1 transition-all  cursor-pointer"
              >
                <CloseCircleOutlined />
              </BarDiv>
            </div> */}
          </PrimaryDiv>
        </div>
      ) : (
        <Fragment>
          <div className="flex-1 flex items-center justify-end drag-area">
            <div className="steps-2">
              <div
                onClick={() => {
                  YarnCommands({
                    type: 'install',
                    args: ['--ignore-warnings']
                  })
                  // 前往日志中心
                  // dispatch(setCommand('view./bot-log'))
                  // TODO 打开日志
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
                      // 前往日志中心
                      // dispatch(setCommand('view./bot-log'))
                      // TODO 打开日志
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
