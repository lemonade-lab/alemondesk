import { BarDiv } from '@alemonjs/react-ui'
import { NavDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  HomeFilled,
  ProfileOutlined,
  RobotOutlined,
  SettingFilled
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNavigate } from 'react-router-dom'
import Box from '@/common/layout/Box'
import { useMemo } from 'react'
import { setCommand } from '@/store/command'
import ExpansionIcon from '@/common/ExpansionIcon'
import { usePop } from '@/context/Pop'
import { ExpansionsRun } from '@wailsjs/window/expansions/app'
import { getDesktopMenus } from '@/common/expansionPackage'

type NavItem = {
  Icon: React.ReactNode
  className: string
  onClick: () => void
}

type ViewMenuItem = ReturnType<typeof getDesktopMenus>[number]

const isNavItem = (item: NavItem | ViewMenuItem): item is NavItem => 'Icon' in item

const MenuButton = () => {
  const navigate = useNavigate()
  const expansions = useSelector((state: RootState) => state.expansions)
  const dispatch = useDispatch()
  const { setPopValue } = usePop()

  const viewMenus = useMemo(() => {
    const navList: NavItem[] = [
      {
        Icon: <AppstoreAddOutlined size={20} />,
        className: 'steps-6',
        onClick: () => {
          navigate('/npm-exp-list')
        }
      },
      {
        Icon: <AppstoreOutlined size={20} />,
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
        className: 'steps-config',
        onClick: () => {
          navigate('/config')
        }
      },
      {
        Icon: <RobotOutlined size={20} />,
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
  return (
    <aside className={classNames('flex flex-col justify-between items-center px-1 py-4')}>
      <NavDiv className="p-1 flex-col rounded-full flex gap-4">
        <BarDiv
          className={classNames(
            'steps-4 size-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700'
          )}
          onClick={goHome}
        >
          <HomeFilled size={20} />
        </BarDiv>
      </NavDiv>
      <div className="flex-col max-h-56 items-center flex">
        <Box type="nav" className='gap-1' rootClassName='rounded-full  px-1 py-4' >
          {viewMenus.map((item, index) => (
            <BarDiv
              key={index}
              className={classNames(
                'size-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700',
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
              {isNavItem(item) ? item.Icon : (
                <ExpansionIcon
                  name={item.name}
                  icon={item.icon}
                  expansions_name={item.expansions_name}
                />
              )}
            </BarDiv>
          ))}
        </Box>
      </div>
      <NavDiv className="p-1 flex-col  rounded-full flex gap-3">
        <BarDiv
          className={classNames(
            'steps-8',
            'size-8 rounded-full  flex items-center justify-center cursor-pointer transition-all duration-700'
          )}
          onClick={() => {
            navigate('/settings')
          }}
        >
          <SettingFilled width={20} height={20} />
        </BarDiv>
      </NavDiv>
    </aside>
  )
}

export default MenuButton
