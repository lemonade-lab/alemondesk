import React from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import GitExpList from './App'
import NPMExpansions from './NPMExpansions/App'

const NpmExpListMain: React.FC = () => {
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical">
          <Splitter.Panel min="40%" collapsible>
            <NPMExpansions />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" min="20%"  collapsible>
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

export default NpmExpListMain
