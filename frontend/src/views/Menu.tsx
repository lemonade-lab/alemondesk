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
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNavigate } from 'react-router-dom'

const MenuButton = () => {
  const navigate = useNavigate()
  const expansions = useSelector((state: RootState) => state.expansions)
  // 导航列表
  const navList: {
    Icon: React.ReactNode
    className: string
    onClick: () => void
  }[] = [
    // TODO 应该展示config文件
    // {
    //   Icon: <RobotOutlined size={20} />,
    //   path: '/bot-log',
    //   className: 'steps-5',
    //   onClick: path => {
    //     dispatch(setCommand(`view.${path}`))
    //   }
    // },
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
      <NavDiv className="px-1 py-4 flex-col  rounded-full flex gap-4">
        {
          // TODO 若 nav 支持扩展。这里需要开启允许上下滚动 / 增加展开更多的按钮
        }
        {navList.map((item, index) => (
          <BarDiv
            key={index}
            className={classNames(
              'size-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700',
              item.className
            )}
            onClick={() => item.onClick()}
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
