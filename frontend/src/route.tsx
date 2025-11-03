import { createHashRouter, Navigate } from 'react-router-dom'
import App from '@/views/App'
import Main from '@/views/Home/Main'
import GitExpList from './views/Splitter/GitExpList/Main'
import NpmExpList from './views/Splitter/NpmExpList/Main'
import PkgAppList from './views/Splitter/PkgAppList/Main'
import SettingsList from './views/Splitter/SettingsList/Main'
import Common from './views/Splitter/SettingsList/Setting/Common'
import Notice from './views/Splitter/SettingsList/Setting/Notice'
import Theme from './views/Splitter/SettingsList/Setting/Theme'
import Files from './views/Splitter/SettingsList/Setting/Files/App'
import About from './views/Splitter/SettingsList/Setting/About'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '', element: <Main /> },
      {
        path: 'git-exp-list',
        element: <GitExpList />
      },
      {
        path: 'pkg-app-list',
        element: <PkgAppList />
      },
      {
        path: 'npm-exp-list',
        element: <NpmExpList />
      },
      {
        path: 'settings',
        element: <SettingsList />,
        children: [
          {
            index: true,
            element: <Navigate to="/settings/common" replace />
          },
          {
            path: 'common',
            element: <Common />
          },
          {
            path: 'files',
            element: <Files />
          },
          {
            path: 'notice',
            element: <Notice />
          },
          {
            path: 'theme',
            element: <Theme />
          },
          {
            path: 'about',
            element: <About />
          }
        ]
      },
      { path: '*', element: <Main /> }
    ]
  }
])

export default router
