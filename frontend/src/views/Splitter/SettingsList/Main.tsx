import React from 'react'
import { Splitter } from 'antd'
import GitExpList from './App'
import { Outlet } from 'react-router-dom'

const SettingsListMain: React.FC = () => {
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Outlet />
      </Splitter.Panel>
      <Splitter.Panel style={{overflow: 'hidden'}} collapsible defaultSize="7%" min="7%" max="14%">
        <GitExpList />
      </Splitter.Panel>
    </Splitter>
  )
}

export default SettingsListMain
