import React from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import GitExpList from './App'
import { Outlet } from 'react-router-dom'

const SettingsListMain: React.FC = () => {
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical">
          <Splitter.Panel collapsible>
            <Outlet />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" max="60%" collapsible>
            <Terminal />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel collapsible defaultSize="7%" min="7%" max="14%">
        <GitExpList />
      </Splitter.Panel>
    </Splitter>
  )
}

export default SettingsListMain
