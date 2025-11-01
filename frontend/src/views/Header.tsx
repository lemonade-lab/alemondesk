import { memo, PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import classNames from 'classnames'
import { HeaderDiv } from '@alemonjs/react-ui'
import { Close, Maximize, Minimize } from '@/common/Icons'
import { WindowHide, WindowMaximise, WindowMinimise } from '@wailsjs/runtime/runtime'
import { GetVersions } from '@wailsjs/go/windowcontroller/App'

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
  const [versions, setVersions] = useState<{
    node: string
    platform: string
  }>({
    node: '',
    platform: ''
  })

  useEffect(() => {
    GetVersions().then(res => {
      setVersions(res)
    })
  }, [])

  return (
    <HeaderDiv className={classNames('h-[1.6rem] flex justify-between  border-b-2 z-50')}>
      <div className="drag-area flex-1"></div>
      {children ?? <div className="flex-[2]"></div>}
      {versions.platform == WINDOWS ? (
        <div className="flex-1 flex ">
          <div className="flex-1 drag-area "></div>
          <div className="flex px-2   gap-2 justify-center items-center">
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
              onClick={() => WindowMaximise()}
            >
              <Maximize />
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
        <div className="drag-area flex-1"></div>
      )}
    </HeaderDiv>
  )
})
