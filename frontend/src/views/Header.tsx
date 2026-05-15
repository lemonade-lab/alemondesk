import { memo, PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'
import { Button, HeaderDiv } from '@alemonjs/react-ui'
import { Close, Maximize, Minimize, Restore } from '@/common/ui/Icons'
import { GetVersions } from '@wailsjs/window/controller/app'
import { AppAllowNextCloseAndClose } from '@wailsjs/window/app/app'

import { Events, Window } from '@wailsio/runtime'
import { setAbout } from '@/store/about'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { FeatModal } from '@/context/Pop'
const WindowHide = Window.Hide
const WindowMinimise = Window.Minimise
const WindowIsMaximised = Window.IsMaximised
const WindowToggleMaximise = Window.ToggleMaximise

type HeaderProps = PropsWithChildren<{
  LeftSlot?: ReactNode
  RightSlot?: ReactNode
}>

const WINDOWS = 'windows'
const CLOSE_ACTION_PREF_KEY = 'alemondesk_close_action_preference'

type CloseAction = 'close' | 'minimise'

type CloseActionPreference = {
  askEveryTime: boolean
  action: CloseAction
}

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
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [rememberCloseChoice, setRememberCloseChoice] = useState(false)
  const [closePreference, setClosePreference] = useState<CloseActionPreference>({
    askEveryTime: true,
    action: 'minimise'
  })

  const saveClosePreference = (preference: CloseActionPreference) => {
    try {
      localStorage.setItem(CLOSE_ACTION_PREF_KEY, JSON.stringify(preference))
    } catch {}
    setClosePreference(preference)
  }

  const runCloseAction = (action: CloseAction) => {
    if (action === 'close') {
      AppAllowNextCloseAndClose()
      return
    }
    WindowMinimise()
  }

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

    try {
      const rawPreference = localStorage.getItem(CLOSE_ACTION_PREF_KEY)
      if (!rawPreference) return
      const parsed = JSON.parse(rawPreference) as Partial<CloseActionPreference>
      if (parsed.action === 'close' || parsed.action === 'minimise') {
        setClosePreference({
          askEveryTime: parsed.askEveryTime !== false,
          action: parsed.action
        })
      }
    } catch {}
  }, [about.platform, dispatch])

  useEffect(() => {
    syncMaximiseState()

    const unsubs = [
      Events.On('common:WindowMaximise', syncMaximiseState),
      Events.On('common:WindowUnMaximise', syncMaximiseState),
      Events.On('common:WindowRestore', syncMaximiseState),
      Events.On('window-close-requested', handleCloseClick)
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

  const handleCloseClick = () => {
    if (!closePreference.askEveryTime) {
      runCloseAction(closePreference.action)
      return
    }
    setRememberCloseChoice(false)
    setCloseDialogOpen(true)
  }

  const confirmCloseAction = (action: CloseAction) => {
    if (rememberCloseChoice) {
      saveClosePreference({
        askEveryTime: false,
        action
      })
    }
    setCloseDialogOpen(false)
    runCloseAction(action)
  }
  
  return (
    <>
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
                onClick={handleCloseClick}
              >
                <Close />
              </span>
            </div>
          </div>
        ) : (
          <div className="drag-area flex-1" onDoubleClick={handleTitleDoubleClick}>&nbsp;</div>
        )}
      </HeaderDiv>
      <FeatModal
        open={closeDialogOpen}
        title="退出方式"
        onClose={() => setCloseDialogOpen(false)}
        footer={
          <div className="flex w-full flex-col gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={rememberCloseChoice}
                onChange={event => setRememberCloseChoice(event.target.checked)}
              />
              <span>不再询问</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button onClick={() => confirmCloseAction('minimise')} className="px-4 py-2 rounded">
                最小化
              </Button>
              <Button onClick={() => confirmCloseAction('close')} className="px-4 py-2 rounded">
                直接关闭
              </Button>
            </div>
          </div>
        }
      >
        <div className="text-sm leading-6 opacity-80">
          选择直接关闭桌面，还是仅最小化到任务栏。
        </div>
      </FeatModal>
    </>
  )
})
