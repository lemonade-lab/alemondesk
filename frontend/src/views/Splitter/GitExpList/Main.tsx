import React from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import GitExpList from './App'
import GitWarehouse from './GitWarehouse/App'

const GitExpListMain: React.FC = () => {
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical">
          <Splitter.Panel collapsible>
            <GitWarehouse />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" collapsible>
            <Terminal />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel collapsible defaultSize="30%" min="30%" max="60%">
        <GitExpList />
      </Splitter.Panel>
    </Splitter>
  )
}

export default GitExpListMain
