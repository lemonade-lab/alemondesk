import { NavDiv, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
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
  onBoxScroll,
  type,
}: PropsWithChildren<{
  type?: 'primary' | 'secondary' | 'nav'
  boxRef?: React.RefObject<HTMLDivElement>
  rootRef?: React.RefObject<HTMLDivElement>
  className?: string
  rootClassName?: string
  onRootScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void
  onBoxScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void
}>) => {
  const map = {
    primary: PrimaryDiv,
    secondary: SecondaryDiv,
    nav: NavDiv
  }
  const DivComponent = map[type ?? 'secondary']
  return (
    <DivComponent
      ref={rootRef}
      className={classNames(
        rootClassName,
        'flex flex-1 size-full min-w-0 max-w-full overflow-hidden transition-colors '
      )}
      onScroll={onRootScroll}
    >
      <div className="flex flex-1 size-full min-w-0 max-w-full overflow-hidden">
        <div
          ref={boxRef}
          onScroll={onBoxScroll}
          className={classNames(className, 'flex flex-col flex-1 scrollbar overflow-auto size-full min-w-0 max-w-full')}
        >
          {children}
        </div>
      </div>
    </DivComponent>
  )
}

export default Box
