import { Fragment, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import useGoNavigate from '@/hook/useGoNavigate'
import { setBotStatus } from '@/store/bot'
import { setCommand, setWebview } from '@/store/command'
import { setModulesStatus } from '@/store/modules'
import { initPackage, setExpansionsStatus } from '@/store/expansions'
import { RootState } from '@/store'
import { setPath } from '@/store/app'
import { postMessage } from '@/store/log'
import { usePop } from '@/context/Pop'
import { useNotification } from '@/context/Notification'
import { HeaderDiv, PrimaryDiv } from '@alemonjs/react-ui'
import Menu from '@/views/Menu'
import WordBox from '@/views/CommandInput'
import GuideMain from '@/views/Guide/Main'
import Header from '@/views/Header'
import {
  ExpansionsPostMessage,
  ExpansionsRun,
  ExpansionsStatus
} from '@wailsjs/window/expansions/app'
import { AppGetPathsState } from '@wailsjs/window/app/app'
import { ThemeLoadVariables, ThemeMode } from '@wailsjs/window/theme/app'
import { Events } from '@wailsio/runtime'
import { BotStatus } from '@wailsjs/window/bot/app'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { setViews } from '@/store/views'
import { useTheme } from '@/hook/useTheme'
const EventsOn = Events.On

export default (function App() {
  const navigate = useGoNavigate()
  const dispatch = useDispatch()
  const notification = useNotification()
  const modules = useSelector((state: RootState) => state.modules)
  const expansions = useSelector((state: RootState) => state.expansions)
  const modulesRef = useRef(modules)
  const { setPopValue, closePop } = usePop()
  const [_theme, themeController] = useTheme()

  // watch
  useEffect(() => {
    // 加载css变量
    ThemeLoadVariables()

    // 加载主题
    ThemeMode().then(res => {
      if (res === 'dark') {
        themeController.dark()
      } else {
        themeController.light()
      }
    })

    // 获取路径配置
    AppGetPathsState().then(paths => dispatch(setPath(paths)))

    // 立即安装依赖
    YarnCommands({
      type: 'install',
      args: ['--ignore-warnings']
    })

    // 监听 css 变量
    EventsOn('theme', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      try {
        const vars = JSON.parse(data)
        Object.keys(vars).forEach(key => {
          document.documentElement.style.setProperty(`--${key}`, vars[key])
        })
      } catch (e) {
        console.error(e)
      }
    })
    // 监听依赖安装状态 0 失败 1 成功
    EventsOn('yarn', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      const value = data.value
      // 每一次安装依赖的后，都更新依赖状态
      if (data.type == 'install') {
        if (value == 0) {
          // 失败就让用户重启
          notification('初始化失败，请尝试重启', 'error')
        }
        dispatch(
          setModulesStatus({
            nodeModulesStatus: value == 0 ? false : true
          })
        )
      }
      // 其他的通知
    })
    // 监听 bot 状态
    EventsOn('bot', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      const value = data.value
      dispatch(
        setBotStatus({
          runStatus: value == 0 ? false : true
        })
      )
    })
    // 监听 通知消息
    EventsOn('notification', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      const value = data.value
      const type = data.type
      notification(value, type || 'info')
    })
    // 监听 expansions状态
    EventsOn('expansions-status', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      console.log('expansions-status', data)
      const value = data.value
      dispatch(
        setExpansionsStatus({
          runStatus: value == 0 ? false : true
        })
      )
    })
    // 监听 expansions消息
    EventsOn('expansions', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      try {
        if (/^action:/.test(data.type)) {
          const actions = data.type.split(':')
          const db = data.data
          if (actions[1] === 'application' && actions[2] === 'sidebar' && actions[3] === 'load') {
            dispatch(setWebview(db))
            dispatch(setViews({ key: 'application' }))
            navigate('/pkg-app-list')
          }
        } else if (data.type === 'notification') {
          const db = data.data
          notification(db.value, db.typing)
          return
        } else if (data.type === 'command') {
          dispatch(setCommand(data.data))
          return
        } else if (data.type === 'get-expansions') {
          const db = data.data
          console.log('get-expansions', db)
          dispatch(initPackage(db))
        }
      } catch {
        console.error('HomeApp 解析消息失败')
      }
    })
    // 监听 terminal 消息
    EventsOn('terminal', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      dispatch(postMessage(data))
    })
    // 监听  modal 弹窗机制
    EventsOn('controller', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (data.open) {
        setPopValue({
          open: true,
          title: data.title,
          description: data.description,
          buttonText: data.buttonText,
          data: data.data,
          code: data.code
        })
        return
      } else {
        closePop()
      }
    })

    const onGlobalStatus = async () => {
      try {
        const T = await BotStatus()
        dispatch(
          setBotStatus({
            runStatus: T ? true : false
          })
        )
      } catch (error) {
        console.error('获取 Bot 状态失败', error)
      }
      try {
        const T = await ExpansionsStatus()
        dispatch(
          setExpansionsStatus({
            runStatus: T ? true : false
          })
        )
      } catch (error) {
        console.error('获取 Expansions 状态失败', error)
      }
    }

    const intervalId = setInterval(onGlobalStatus, 1000 * 3)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  /**
   * 感知依赖安装状态。
   * 安装完成后，自动启动扩展器，
   * 依赖没安装的情况下，要禁止一些涉及使用依赖的功能
   */
  useEffect(() => {
    modulesRef.current = modules
    // 依赖安装完成后，自动启动扩展器
    if (modules.nodeModulesStatus) {
      // notification('依赖加载完成')
      // 确保启动扩展器
      ExpansionsRun([])
    }
  }, [modules.nodeModulesStatus])

  /**
   * 感知扩展器状态。
   * 感知到扩展器重启后，获取扩展器列表
   */
  useEffect(() => {
    if (expansions.runStatus) {
      console.log('扩展器已启动，获取扩展器列表')
      // 获取扩展器列表
      ExpansionsPostMessage({ type: 'get-expansions' })
    }
  }, [expansions.runStatus])

  /**
   * 感知命令变化
   1. view. 开头的，前往对应页面
   2. 其他命令，发送给扩展器
   */
  const command = useSelector((state: RootState) => state.command)
  useEffect(() => {
    if (command.name) {
      // view
      if (/^view./.test(command.name)) {
        // 前往页面
        const viewMap = {
          'view.home': '/',
          'view.git-exp-manage': '/git-exp-list',
          'view.npm-exp-manage': '/npm-exp-list',
          'view.webview': '/pkg-app-list',
          'view.settings': '/settings'
        }
        if (!viewMap[command.name]) {
          return
        }
        navigate(viewMap[command.name] || '/')
      } else {
        ExpansionsPostMessage({ type: 'command', data: command.name })
      }
    }
  }, [command.name])

  return (
    <Fragment>
      <div className="flex flex-col flex-1 h-screen relative ">
        <Header>
          <WordBox />
        </Header>
        <HeaderDiv className="border-b w-full" />
        <PrimaryDiv className="steps-0 flex flex-1 z-40 size-full">
          <Menu />
          <div className="flex flex-1 size-full">
            <Outlet />
          </div>
        </PrimaryDiv>
      </div>
      <GuideMain />
    </Fragment>
  )
})
