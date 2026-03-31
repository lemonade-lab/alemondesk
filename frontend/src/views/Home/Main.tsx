import React, { useCallback, Fragment } from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import ChatPanel from './ChatPanel'
import ConversationList from './ConversationList'
import GuideHome from '@/views/Guide/Home'

const TERMINAL_COLLAPSED_KEY = 'ALemonDesk_terminal_collapsed'

const wasTerminalCollapsed = (): boolean => {
  try {
    return localStorage.getItem(TERMINAL_COLLAPSED_KEY) === '1'
  } catch {}
  return false
}

const HomeMain: React.FC = () => {
  const collapsed = wasTerminalCollapsed()

  const onResizeEnd = useCallback((newSizes: number[]) => {
    try {
      const isCollapsed = (newSizes[1] ?? 0) < 1
      localStorage.setItem(TERMINAL_COLLAPSED_KEY, isCollapsed ? '1' : '0')
    } catch {}
  }, [])

  return (
    <Fragment>
      <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
        <Splitter.Panel>
          <Splitter layout="vertical" onResizeEnd={onResizeEnd}>
            <Splitter.Panel defaultSize={collapsed ? '100%' : '70%'} min="40%" collapsible>
              <ChatPanel />
            </Splitter.Panel>
            <Splitter.Panel defaultSize={collapsed ? '0%' : '30%'} min="20%" collapsible>
              <Terminal />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
        <Splitter.Panel style={{ overflow: 'hidden' }} collapsible defaultSize="20%" min="15%" max="30%">
          <ConversationList />
        </Splitter.Panel>
      </Splitter>
      <GuideHome />
    </Fragment>
  )
}

export default HomeMain
