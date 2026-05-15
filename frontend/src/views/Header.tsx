import { memo, PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'
import { HeaderDiv } from '@alemonjs/react-ui'
import { Close, Maximize, Minimize, Restore } from '@/common/ui/Icons'
import { GetVersions } from '@wailsjs/window/controller/app'

import { Events, Window } from '@wailsio/runtime'
import { setAbout } from '@/store/about'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
const WindowHide = Window.Hide
const WindowMinimise = Window.Minimise
const WindowIsMaximised = Window.IsMaximised
const WindowToggleMaximise = Window.ToggleMaximise

type HeaderProps = PropsWithChildren<{
  LeftSlot?: ReactNode
  RightSlot?: ReactNode
}>

const WINDOWS = 'windows'

/**
 * 卡槽
 * win系统渲染 left
 * 其他系统渲染 right
 * @param param0
 * @returns
 */
export default memo(function Header({ children }: HeaderProps) {
  const about = useSelector((state: RootState) => state.about)
  const dispatch = useDispatch()
  const [isMaximised, setIsMaximised] = useState(false)

  const syncMaximiseState = () => {
    WindowIsMaximised()
      .then(setIsMaximised)
      .catch(() => {
        setIsMaximised(false)
      })
  }

  useEffect(() => {
    if (!about.platform) {
      GetVersions().then(res => {
        dispatch(setAbout({
            arch: res.arch,
            node: res.node,
            platform: res.platform,
            version: res.version
          }))
      })
    }
  }, [about.platform, dispatch])

  useEffect(() => {
    syncMaximiseState()

    const unsubs = [
      Events.On('common:WindowMaximise', syncMaximiseState),
      Events.On('common:WindowUnMaximise', syncMaximiseState),
      Events.On('common:WindowRestore', syncMaximiseState)
    ]

    return () => {
      unsubs.forEach(unsub => unsub?.())
    }
  }, [])

  const toggleMaximise = () => {
    WindowToggleMaximise().then(() => {
      syncMaximiseState()
    })
  }

  const handleTitleDoubleClick = () => {
    toggleMaximise()
  }
  
  return (
    <HeaderDiv className={classNames('h-[1.8rem] flex justify-center items-center z-50')}>
      {
        // left
      }
      <div className="drag-area flex-1" onDoubleClick={handleTitleDoubleClick}>
        &nbsp;
      </div>
      {
        // center
      }
      {children ?? <div className="size-full drag-area" onDoubleClick={handleTitleDoubleClick} />}
      {
        // right
      }
      {about.platform == WINDOWS ? (
        <div className="flex-1 flex justify-end items-center">
          {
            // windows left
          }
          <div className="flex-1 drag-area" onDoubleClick={handleTitleDoubleClick} />
          {
            // windows right
          }
          <div className="flex px-2  gap-2 justify-center items-center">
            <span
              className={classNames(
                'cursor-pointer hover:bg-slate-300  rounded-sm px-1  hover:text-gray-900 transition-all duration-300'
              )}
              onClick={() => WindowMinimise()}
            >
              <Minimize />
            </span>
            <span
              className={classNames(
                'cursor-pointer hover:bg-slate-300  rounded-sm px-1  hover:text-gray-900 transition-all duration-300'
              )}
              onClick={toggleMaximise}
            >
              {isMaximised ? <Restore /> : <Maximize />}
            </span>
            <span
              className={classNames(
                'cursor-pointer hover:bg-red-600  hover:text-white  rounded-sm px-1   transition-all duration-300'
              )}
              onClick={() => WindowHide()}
            >
              <Close />
            </span>
          </div>
        </div>
      ) : (
        <div className="drag-area flex-1" onDoubleClick={handleTitleDoubleClick}>&nbsp;</div>
      )}
    </HeaderDiv>
  )
})
