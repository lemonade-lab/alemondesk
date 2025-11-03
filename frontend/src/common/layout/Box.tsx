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
  children,
  rootClassName,
  className
}: PropsWithChildren<{
  boxRef?: React.RefObject<HTMLDivElement>
  className?: string
  rootClassName?: string
}>) => {
  return (
    <SecondaryDiv
      ref={boxRef}
      className={classNames(
        rootClassName,
        'flex flex-1 size-full min-w-0 max-w-full scrollbar overflow-auto transition-colors '
      )}
    >
      <div className="flex flex-1 size-full min-w-0 max-w-full">
        <div className={classNames(className, 'flex flex-col flex-1 size-full min-w-0 max-w-full')}>
          {children}
        </div>
      </div>
    </SecondaryDiv>
  )
}

export default Box
