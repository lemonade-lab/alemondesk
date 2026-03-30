import React, { useState, useCallback } from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import GitExpList from './App'
import Application from './Application/App'

const TERMINAL_SIZES_KEY = 'ALemonDesk_terminal_panel_sizes'

const readSizes = (): number[] | undefined => {
  try {
    const raw = localStorage.getItem(TERMINAL_SIZES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return undefined
}

const PkgAppListMain: React.FC = () => {
  const [sizes, setSizes] = useState<number[] | undefined>(readSizes)

  const onResizeEnd = useCallback((newSizes: number[]) => {
    setSizes(newSizes)
    try { localStorage.setItem(TERMINAL_SIZES_KEY, JSON.stringify(newSizes)) } catch {}
  }, [])

  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical" onResizeEnd={onResizeEnd}>
          <Splitter.Panel size={sizes?.[0]} defaultSize="70%" min="40%" collapsible>
            <Application />
          </Splitter.Panel>
          <Splitter.Panel size={sizes?.[1]} defaultSize="30%" min="20%" collapsible>
            <Terminal />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel style={{overflow: 'hidden'}} collapsible defaultSize="30%" min="30%" max="45%">
        <GitExpList />
      </Splitter.Panel>
    </Splitter>
  )
}

export default PkgAppListMain
