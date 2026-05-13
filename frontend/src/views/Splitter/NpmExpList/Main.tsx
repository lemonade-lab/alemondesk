import React, { useCallback, Fragment } from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import NpmExpList from './App'
import NPMExpansions from './NPMExpansions/App'
import GuideCommon from '@/views/Guide/Common'

const TERMINAL_COLLAPSED_KEY = 'alemondesk_npm_terminal_collapsed'

const wasTerminalCollapsed = (): boolean => {
  try {
    return localStorage.getItem(TERMINAL_COLLAPSED_KEY) === '1'
  } catch {}
  return false
}

const NpmExpListMain: React.FC = () => {
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
              <NPMExpansions />
            </Splitter.Panel>
            <Splitter.Panel defaultSize={collapsed ? '0%' : '30%'} min="20%" collapsible>
              <Terminal />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
        <Splitter.Panel style={{overflow: 'hidden'}} collapsible defaultSize="30%" min="30%" max="45%">
          <NpmExpList />
        </Splitter.Panel>
      </Splitter>
      <GuideCommon />
    </Fragment>
  )
}

export default NpmExpListMain
