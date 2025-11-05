import { BarDiv } from '@alemonjs/react-ui'
import { NavDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  ContainerOutlined,
  HomeFilled,
  SettingFilled
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNavigate } from 'react-router-dom'
import Box from '@/common/layout/Box'
import { useMemo } from 'react'
import { CommandItem } from './types'
import { setCommand } from '@/store/command'
import ExpansionIcon from '@/common/ExpansionIcon'

const MenuButton = () => {
  const navigate = useNavigate()
  const expansions = useSelector((state: RootState) => state.expansions)
  const dispatch = useDispatch()

  // 导航列表
  const navList: {
    Icon: React.ReactNode
    className: string
    onClick: () => void
  }[] = [
    {
      Icon: <ContainerOutlined size={20} />,
      className: 'steps-5-1',
      onClick: () => {
        navigate('/git-exp-list')
      }
    },
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
          return
        }
        navigate('/pkg-app-list')
      }
    }
  ]

  const viewMenus = useMemo(() => {
    const menus =
      expansions.package?.flatMap(item => {
        return (
          // 读取侧边栏设置
          item.alemonjs?.desktop?.menus?.map((menu: CommandItem) => ({
            ...menu,
            command: menu.command ?? menu.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      }) || []
    return menus.concat(navList)
  }, [expansions.package])

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
        <Box type="nav" rootClassName='rounded-full px-1 py-4' >
          {viewMenus.map((item, index) => (
            <BarDiv
              key={index}
              className={classNames(
                'size-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700',
                item.className
              )}
              onClick={() => {
                if (item.onClick) {
                  // 内部方法
                  item.onClick()
                }
                if (item.command) {
                  // 外部方法。执行command
                  dispatch(setCommand(item.command))
                }
              }}
            >
              {item?.Icon ?? (
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
