import { Fragment, useEffect, useRef, useState } from 'react'
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
import {
  appendMessageContent,
  setLoading,
  setMessageLoading,
  setStreamingId,
  addToolMessage,
  resolveToolConfirm,
  setSuggestions
} from '@/store/chat'
import { usePop } from '@/context/Pop'
import { useNotification } from '@/context/Notification'
import { HeaderDiv, PrimaryDiv } from '@alemonjs/react-ui'
import Menu from '@/views/Menu'
import GuideMain from '@/views/Guide/Main'
import Welcome from '@/views/Guide/Welcome'
import Header from '@/views/Header'
import { SettingOutlined } from '@ant-design/icons'
import {
  ExpansionsPostMessage,
  ExpansionsRun,
  ExpansionsStatus
} from '@wailsjs/window/expansions/app'
import { AppGetPathsState, AppReadFiles, AppExists } from '@wailsjs/window/app/app'
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
  const [guideReady, setGuideReady] = useState(false)
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
    AppGetPathsState().then(paths =>
      dispatch(
        setPath({
          userDataTemplatePath: paths.userDataTemplatePath,
          userDataNodeModulesPath: paths.userDataNodeModulesPath,
          userDataPackagePath: paths.userDataPackagePath,
          preloadPath: paths.preloadPath,
          resourcePath: paths.resourcePath
        })
      )
    )

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
          notification('初始化失败，请重启应用', 'error')
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
          const db: any[] = data.data || []
          console.log('get-expansions', db)
          // 补充后端可能遗漏的 alemonjs / @alemonjs/* 包
          AppGetPathsState().then(async paths => {
            const nodeModulesPath = paths.userDataNodeModulesPath
            const pkgJsonPath = paths.userDataPackagePath
            const existingNames = new Set(db.map((p: any) => p.name))
            const supplemented = [...db]
            try {
              const pkgRaw = await AppReadFiles(pkgJsonPath)
              const pkgJson = JSON.parse(pkgRaw)
              const allDeps = {
                ...(pkgJson.dependencies || {}),
                ...(pkgJson.devDependencies || {})
              }
              // 找出所有 alemonjs 或 @alemonjs/* 的依赖
              const alemonDeps = Object.keys(allDeps).filter(
                name => name === 'alemonjs' || name.startsWith('alemonjs-') || name.startsWith('@alemonjs/')
              )
              for (const depName of alemonDeps) {
                if (existingNames.has(depName)) continue
                try {
                  const depPkgPath = nodeModulesPath + '/' + depName + '/package.json'
                  const exists = await AppExists(depPkgPath)
                  if (exists) {
                    const depRaw = await AppReadFiles(depPkgPath)
                    const depPkg = JSON.parse(depRaw)
                    supplemented.push(depPkg)
                  }
                } catch {}
              }
            } catch {}
            dispatch(initPackage(supplemented))
          }).catch(() => {
            dispatch(initPackage(db))
          })
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
    // 监听 AI chat 消息
    EventsOn('chat', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (!data) return
      const { messageId, type, content } = data
      switch (type) {
        case 'start':
          dispatch(setMessageLoading({ id: messageId, loading: true }))
          break
        case 'chunk':
          dispatch(setMessageLoading({ id: messageId, loading: false }))
          dispatch(appendMessageContent({ id: messageId, content }))
          break
        case 'done':
          dispatch(setMessageLoading({ id: messageId, loading: false }))
          dispatch(setLoading(false))
          dispatch(setStreamingId(null))
          if (data.suggestions && Array.isArray(data.suggestions)) {
            dispatch(setSuggestions(data.suggestions))
          }
          break
        case 'stop':
          dispatch(setMessageLoading({ id: messageId, loading: false }))
          dispatch(setLoading(false))
          dispatch(setStreamingId(null))
          break
        case 'error':
          dispatch(setMessageLoading({ id: messageId, loading: false }))
          dispatch(appendMessageContent({ id: messageId, content: `⚠️ ${content}` }))
          dispatch(setLoading(false))
          dispatch(setStreamingId(null))
          break
        case 'tool_confirm': {
          const { toolCallId, toolName, description, arguments: toolArgs } = data
          const argsStr = toolArgs ? Object.entries(toolArgs).map(([k, v]) => `${k}: ${v}`).join(', ') : ''
          dispatch(
            addToolMessage({
              id: `tool-${toolCallId}`,
              toolCallId,
              toolName,
              content: `🔧 请求执行: ${description}${argsStr ? `\n参数: ${argsStr}` : ''}`,
              confirmPending: true
            })
          )
          break
        }
        case 'tool_result': {
          const { toolCallId, toolName, result, executed } = data
          dispatch(
            resolveToolConfirm({
              toolCallId,
              executed,
              result: executed
                ? `✅ ${toolName}: ${result}`
                : `❌ ${toolName}: ${result}`
            })
          )
          break
        }
      }
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

    // 监听全局快捷键
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + S 阻止默认保存
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('keydown', handleKeyPress)
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
          'view.npm-exp-manage': '/npm-exp-list',
          'view.webview': '/pkg-app-list',
          'view.settings': '/settings',
          'view.settings.common': '/settings/common',
          'view.settings.about': '/settings/about',
          'view.settings.theme': '/settings/theme',
          'view.settings.files': '/settings/files',
          'view.settings.notice': '/settings/notice',
          'view.settings.ai': '/settings/ai'
        }
        if (!viewMap[command.name]) {
          return
        }
        navigate(viewMap[command.name] || '/')
      }
      if (/^app./.test(command.name)) {
        // 发送之后。重新设置为空
        Events.Emit('app', { type: 'command', data: command.name })
        dispatch(setCommand(''))
      } else {
        ExpansionsPostMessage({ type: 'command', data: command.name })
        // 发送之后。重新设置为空
        dispatch(setCommand(''))
      }
    }
  }, [command.name])

  return (
    <Fragment>
      <div className="flex flex-col flex-1 h-screen relative ">
        <Header
          RightSlot={
            <span
              className="cursor-pointer flex items-center justify-center size-5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-60 hover:opacity-100"
              title="AI 设置"
              onClick={() => dispatch(setCommand('view.settings.ai'))}
            >
              <SettingOutlined style={{ fontSize: 12 }} />
            </span>
          }
        >
        </Header>
        <HeaderDiv className="border-b w-full" />
        <PrimaryDiv className="steps-0 flex flex-1 z-40 size-full">
          <Menu />
          <div className="flex flex-1 size-full">
            <Outlet />
          </div>
        </PrimaryDiv>
      </div>
      <Welcome onFinish={() => setGuideReady(true)} />
      <GuideMain stepIndex={guideReady ? 1 : -1} />
    </Fragment>
  )
})
