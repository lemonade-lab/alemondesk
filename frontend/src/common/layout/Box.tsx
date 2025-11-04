import { SecondaryDiv } from '@alemonjs/react-ui'
import classNames from 'classnames'
import { PropsWithChildren } from 'react'

/**
 * 自由滚动的盒子
 * @param param
 * @returns
 */
const Box = ({
  boxRef,
  rootRef,
  children,
  rootClassName,
  className,
  onRootScroll,
  onBoxScroll
}: PropsWithChildren<{
  boxRef?: React.RefObject<HTMLDivElement>
  rootRef?: React.RefObject<HTMLDivElement>
  className?: string
  rootClassName?: string
  onRootScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void
  onBoxScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void
}>) => {
  return (
    <SecondaryDiv
      ref={rootRef}
      className={classNames(
        rootClassName,
        'flex flex-1 size-full min-w-0 max-w-full scrollbar overflow-auto transition-colors '
      )}
      onScroll={onRootScroll}
    >
      <div className="flex flex-1 size-full min-w-0 max-w-full">
        <div
          ref={boxRef}
          onScroll={onBoxScroll}
          className={classNames(className, 'flex flex-col flex-1 size-full min-w-0 max-w-full')}
        >
          {children}
        </div>
      </div>
    </SecondaryDiv>
  )
}

export default Box
