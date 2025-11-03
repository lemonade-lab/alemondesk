import React from 'react'
import { Splitter } from 'antd'
import Terminal from '../Terminal/App'
import { Outlet } from 'react-router-dom'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import SettingsList from './SettingsList/App'
import GitWarehouse from './GitExpList/GitWarehouse/App'
import Application from './PkgAppList/Application/App'
import NPMExpansions from './NpmExpList/NPMExpansions/App'
import About from './SettingsList/Setting/About'
import Files from './SettingsList/Setting/Files/App'
import Theme from './SettingsList/Setting/Theme'
import Common from './SettingsList/Setting/Common'
import Notice from './SettingsList/Setting/Notice'

const MainViewsMap = {
  'settings-list': <SettingsList />,
  'git-warehouse': <GitWarehouse />,
  'application': <Application />,
  'npm-expansions': <NPMExpansions />,
  'setting-about': <About />,
  'setting-files': <Files />,
  'setting-theme': <Theme />,
  'setting-notice': <Notice />,
  'setting-common': <Common />
}

const SplitterApp: React.FC = () => {
  const views = useSelector((state: RootState) => state.views)
  // const location = useLocation()
  // const isMin = location.pathname === '/settings'
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical">
          {
            // 上方主视图
          }
          {MainViewsMap[views.key] && (
            <Splitter.Panel min="30%">{MainViewsMap[views.key]}</Splitter.Panel>
          )}
          {
            // 下方终端视图
          }
          <Splitter.Panel defaultSize="30%" collapsible>
            <Terminal />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      {
        // 右侧扩展视图
      }
      <Splitter.Panel collapsible defaultSize="26%" min="26%" max="60%">
        <Outlet />
      </Splitter.Panel>
    </Splitter>
  )
}

export default SplitterApp
