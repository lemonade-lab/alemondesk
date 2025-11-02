import { createHashRouter, Navigate } from 'react-router-dom'
import App from '@/views/App'
import Main from '@/views/Home/App'
import Application from '@/views/Application/App'
import BotLog from '@/views/BotLog/App'
import NpmExpansions from '@/views/NPMExpansions/App'
import GitExpansions from '@/views/GitExpansions/App'
import Menu from '@/views/Setting/Menu'
import Common from '@/views/Setting/Common'
import Theme from '@/views/Setting/Theme'
import UpdateLog from '@/views/Setting/UpdateLog'
import About from '@/views/Setting/About'
import Template from './views/Template/App'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Main />
      },
      {
        path: 'git-expansions',
        element: <GitExpansions />
      },
      {
        path: 'application',
        element: <Application />
      },
      {
        path: 'bot-log',
        element: <BotLog />
      },
      {
        path: 'expansions',
        element: <NpmExpansions />
      },
      {
        path: 'settings',
        element: <Menu />,
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
            path: 'theme',
            element: <Theme />
          },
          {
            path: 'log',
            element: <UpdateLog />
          },
          {
            path: 'template',
            element: <Template />
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
