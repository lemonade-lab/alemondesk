import React, { useCallback, Fragment } from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import Application from './Application/App'
import GuidePkgApp from '@/views/Guide/PkgApp'

const TERMINAL_COLLAPSED_KEY = 'alemondesk_pkg_terminal_collapsed'

const wasTerminalCollapsed = (): boolean => {
  try {
    return localStorage.getItem(TERMINAL_COLLAPSED_KEY) === '1'
  } catch {}
  return false
}

const PkgAppListMain: React.FC = () => {
  const collapsed = wasTerminalCollapsed()

  const onResizeEnd = useCallback((newSizes: number[]) => {
    try {
      const isCollapsed = (newSizes[1] ?? 0) < 1
      localStorage.setItem(TERMINAL_COLLAPSED_KEY, isCollapsed ? '1' : '0')
    } catch {}
  }, [])

  return (
    <Fragment>
      <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]" layout="vertical" onResizeEnd={onResizeEnd}>
        <Splitter.Panel defaultSize={collapsed ? '100%' : '72%'} min="40%" collapsible>
          <Application />
        </Splitter.Panel>
        <Splitter.Panel defaultSize={collapsed ? '0%' : '28%'} min="20%" collapsible>
          <Terminal />
        </Splitter.Panel>
      </Splitter>
      <GuidePkgApp />
    </Fragment>
  )
}

export default PkgAppListMain
