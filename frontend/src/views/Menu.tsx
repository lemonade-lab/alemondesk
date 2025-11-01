import { BarDiv } from '@alemonjs/react-ui'
import { NavDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import {
  AppstoreAddOutlined,
  AppstoreFilled,
  AppstoreOutlined,
  ContainerFilled,
  ContainerOutlined,
  HomeFilled,
  ProductFilled,
  RobotFilled,
  RobotOutlined,
  SettingFilled,
  ShoppingFilled
} from '@ant-design/icons'
import { setCommand } from '@/store/command'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'

const MenuButton = () => {
  const dispatch = useDispatch()
  const expansions = useSelector((state: RootState) => state.expansions)
  // 导航列表
  const navList: {
    Icon: React.ReactNode
    path: string
    className: string
    onClick: (path: string) => void
  }[] = [
    {
      Icon: <RobotOutlined size={20} />,
      path: '/bot-log',
      className: 'steps-5',
      onClick: path => {
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      Icon: <ContainerOutlined size={20} />,
      path: '/git-expansions',
      className: 'steps-5-1',
      onClick: path => {
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      Icon: <AppstoreAddOutlined size={20} />,
      path: '/expansions',
      className: 'steps-6',
      onClick: path => {
        dispatch(setCommand(`view.${path}`))
      }
    },
    {
      Icon: <AppstoreOutlined size={20} />,
      path: '/application',
      className: classNames('steps-7', {
        'opacity-50': !expansions.runStatus
      }),
      onClick: path => {
        if (!expansions.runStatus) {
          return
        }
        dispatch(setCommand(`view.${path}`))
      }
    }
  ]

  const goHome = () => {
    const path = '/'
    dispatch(setCommand(`view.${path}`))
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
      <NavDiv className="px-1 py-4 flex-col  rounded-full flex gap-4">
        {navList.map((item, index) => (
          <BarDiv
            key={item.path}
            className={classNames(
              'size-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700',
              item.className
            )}
            onClick={() => item.onClick(item.path)}
          >
            <div>{item.Icon}</div>
          </BarDiv>
        ))}
      </NavDiv>
      <NavDiv className="p-1 flex-col  rounded-full flex gap-3">
        <BarDiv
          className={classNames(
            'steps-8',
            'size-8 rounded-full  flex items-center justify-center cursor-pointer transition-all duration-700'
          )}
          onClick={() => dispatch(setCommand(`view./settings`))}
        >
          <SettingFilled width={20} height={20} />
        </BarDiv>
      </NavDiv>
    </aside>
  )
}

export default MenuButton
