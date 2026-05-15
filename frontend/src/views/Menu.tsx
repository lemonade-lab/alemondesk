import { BarDiv } from '@alemonjs/react-ui'
import { NavDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  HomeFilled,
  ProfileOutlined,
  RobotOutlined,
  SettingFilled
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNavigate } from 'react-router-dom'
import Box from '@/common/layout/Box'
import { useMemo, useState } from 'react'
import { setCommand } from '@/store/command'
import ExpansionIcon from '@/common/ExpansionIcon'
import { usePop } from '@/context/Pop'
import { ExpansionsRun } from '@wailsjs/window/expansions/app'
import { getDesktopMenus } from '@/common/expansionPackage'

type NavItem = {
  Icon: React.ReactNode
  className: string
  title: string
  onClick: () => void
}

type ViewMenuItem = ReturnType<typeof getDesktopMenus>[number]

const isNavItem = (item: NavItem | ViewMenuItem): item is NavItem => 'Icon' in item

const MenuButton = () => {
  const navigate = useNavigate()
  const expansions = useSelector((state: RootState) => state.expansions)
  const dispatch = useDispatch()
  const { setPopValue } = usePop()
  const [expanded, setExpanded] = useState(false)

  const viewMenus = useMemo(() => {
    const navList: NavItem[] = [
      {
        Icon: <AppstoreAddOutlined size={20} />,
        title: '扩展管理',
        className: 'steps-6',
        onClick: () => {
          navigate('/npm-exp-list')
        }
      },
      {
        Icon: <AppstoreOutlined size={20} />,
        title: '应用管理',
        className: classNames('steps-7', {
          'opacity-50': !expansions.runStatus
        }),
        onClick: () => {
          if (!expansions.runStatus) {
            setPopValue({
              open: true,
              title: '扩展器未启动',
              description: '扩展器尚未运行，是否立即启动扩展器？',
              buttonText: '启动',
              buttonCancelText: '取消',
              data: {},
              code: 0,
              onConfirm: () => {
                ExpansionsRun([])
              }
            })
            return
          }
          navigate('/pkg-app-list')
        }
      },
      {
        Icon: <ProfileOutlined size={20} />,
        title: '机器人配置',
        className: 'steps-config',
        onClick: () => {
          navigate('/config')
        }
      },
      {
        Icon: <RobotOutlined size={20} />,
        title: 'AI 设置',
        className: 'steps-ai',
        onClick: () => {
          navigate('/ai-settings')
        }
      }
    ]

    const menus: ViewMenuItem[] = expansions.package?.flatMap(item => getDesktopMenus(item)) || []
    return [...menus, ...navList]
  }, [expansions.package, expansions.runStatus, navigate, setPopValue])

  const goHome = () => {
    navigate('/')
  }

  const renderItemContent = (item: NavItem | ViewMenuItem) => {
    const title = isNavItem(item) ? item.title : item.name

    return (
      <>
        <span className="flex size-8 shrink-0 items-center justify-center">
          {isNavItem(item) ? item.Icon : (
            <ExpansionIcon
              name={item.name}
              icon={item.icon}
              expansions_name={item.expansions_name}
            />
          )}
        </span>
        <span
          className={classNames(
            'overflow-hidden whitespace-nowrap text-sm transition-all ease-out',
            expanded ? 'duration-700' : 'duration-1000',
            expanded ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'
          )}
        >
          {title}
        </span>
      </>
    )
  }

  return (
    <aside
      className={classNames(
        'flex flex-col justify-between py-4 pl-1 pr-2 transition-all ease-out',
        expanded ? 'duration-700' : 'duration-1000',
        expanded ? 'w-36 items-stretch' : 'w-11 items-center'
      )}
    >
      <NavDiv className="p-1 flex-col rounded-[1.25rem] flex gap-2">
        <BarDiv
          className={classNames(
            'h-8 rounded-full flex items-center cursor-pointer transition-all ease-out',
            expanded ? 'duration-700' : 'duration-1000',
            expanded ? 'w-full px-2 justify-start gap-2' : 'w-8 justify-center'
          )}
          onClick={() => setExpanded(value => !value)}
        >
          <span className="flex size-8 shrink-0 items-center justify-center">
            {expanded ? <CaretLeftOutlined size={18} /> : <CaretRightOutlined size={18} />}
          </span>
          <span
            className={classNames(
              'overflow-hidden whitespace-nowrap text-sm transition-all ease-out',
              expanded ? 'duration-700' : 'duration-1000',
              expanded ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            {expanded ? '收起' : '展开'}
          </span>
        </BarDiv>
        <BarDiv
          className={classNames(
            'steps-4 h-8 rounded-full flex items-center cursor-pointer transition-all ease-out',
            expanded ? 'duration-700' : 'duration-1000',
            expanded ? 'w-full px-2 justify-start' : 'w-8 justify-center'
          )}
          onClick={goHome}
        >
          <span className="flex size-8 shrink-0 items-center justify-center">
            <HomeFilled size={20} />
          </span>
          <span
            className={classNames(
              'overflow-hidden whitespace-nowrap text-sm transition-all ease-out',
              expanded ? 'duration-700' : 'duration-1000',
              expanded ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            首页
          </span>
        </BarDiv>
      </NavDiv>
      <div className={classNames('flex-col max-h-56 flex', expanded ? 'items-stretch' : 'items-center')}>
        <Box
          type="nav"
          className="gap-1"
          rootClassName={classNames('rounded-[1.25rem] py-4', expanded ? 'px-2' : 'px-1')}
        >
          {viewMenus.map((item, index) => (
            <BarDiv
              key={index}
              className={classNames(
                'h-8 rounded-full flex items-center cursor-pointer transition-all ease-out',
                expanded ? 'duration-700' : 'duration-1000',
                expanded ? 'w-full px-2 justify-start ' : 'w-8 justify-center',
                isNavItem(item) ? item.className : undefined
              )}
              onClick={() => {
                if (isNavItem(item) && item.onClick) {
                  // 内部方法
                  item.onClick()
                }
                if (!isNavItem(item) && item.command) {
                  // 外部方法。执行command
                  dispatch(setCommand(item.command))
                }
              }}
            >
              {renderItemContent(item)}
            </BarDiv>
          ))}
        </Box>
      </div>
      <NavDiv className="p-1 flex-col  rounded-full flex gap-3">
        <BarDiv
          className={classNames(
            'steps-8',
            'h-8 rounded-full flex items-center cursor-pointer transition-all ease-out',
            expanded ? 'duration-700' : 'duration-1000',
            expanded ? 'w-full px-2 justify-start' : 'w-8 justify-center'
          )}
          onClick={() => {
            navigate('/settings')
          }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center">
            <SettingFilled width={20} height={20} />
          </span>
          <span
            className={classNames(
              'overflow-hidden whitespace-nowrap text-sm transition-all ease-out',
              expanded ? 'duration-700' : 'duration-1000',
              expanded ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            设置
          </span>
        </BarDiv>
      </NavDiv>
    </aside>
  )
}

export default MenuButton
