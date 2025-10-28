import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import useGoNavigate from '@/hook/useGoNavigate'
import { setBotStatus } from '@/store/bot'
import { setCommand } from '@/store/command'
import { setModulesStatus } from '@/store/modules'
import { initPackage, setExpansionsStatus } from '@/store/expansions'
import { RootState } from '@/store'
import { setPath } from '@/store/app'
import { postMessage } from '@/store/log'
import { usePop } from '@/context/Pop'
import { useNotification } from '@/context/Notification'
import { PrimaryDiv } from '@alemonjs/react-ui'
import Menu from '@/views/Menu'
import WordBox from '@/views/WordBox'
import GuideMain from '@/views/Guide/Main'
import Header from '@/common/Header'
import { ExpansionsPostMessage, ExpansionsRun } from '@wailsjs/go/windowexpansions/App'
import { AppGetPathsState } from '@wailsjs/go/windowapp/App'
import { ThemeLoadVariables, ThemeMode } from '@wailsjs/go/windowtheme/App'
import { EventsOn } from '@wailsjs/runtime/runtime'
import { YarnCommands } from '@wailsjs/go/windowyarn/App'

export default (function App() {
  const navigate = useGoNavigate()
  const dispatch = useDispatch()
  const notification = useNotification()
  const modules = useSelector((state: RootState) => state.modules)
  const expansions = useSelector((state: RootState) => state.expansions)
  const modulesRef = useRef(modules)
  const { setPopValue, closePop } = usePop()

  const [step, setStep] = useState(-1)

  // watch
  useEffect(() => {
    // 加载css变量
    ThemeLoadVariables()

    // 加载主题
    ThemeMode().then(res => {
      if (res === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
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
    EventsOn('theme', cssVariables => {
      try {
        const vars = JSON.parse(cssVariables)
        Object.keys(vars).forEach(key => {
          document.documentElement.style.setProperty(`--${key}`, vars[key])
        })
      } catch (e) {
        console.error(e)
      }
    })
    // 监听依赖安装状态 0 失败 1 成功
    EventsOn('yarn', data => {
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
    EventsOn('bot', data => {
      const value = data.value
      dispatch(
        setBotStatus({
          runStatus: value == 0 ? false : true
        })
      )
    })
    // 监听 通知消息
    EventsOn('notification', data => {
      const value = data.value
      const type = data.type
      notification(value, type || 'info')
    })
    // 监听 expansions状态
    EventsOn('expansions-status', data => {
      const value = data.value
      if (value == 0) {
        notification('扩展器已停止', 'warning')
      } else {
        notification('扩展器已启动')
      }
      dispatch(
        setExpansionsStatus({
          runStatus: value == 0 ? false : true
        })
      )
    })
    // 监听 expansions消息
    EventsOn('expansions', data => {
      try {
        if (/^action:/.test(data.type)) {
          const actions = data.type.split(':')
          const db = data.data
          if (actions[1] === 'application' && actions[2] === 'sidebar' && actions[3] === 'load') {
            navigate('/application', {
              state: {
                view: db
              }
            })
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
    EventsOn('terminal', (data: any) => {
      dispatch(postMessage(data))
    })
    // 监听  modal 弹窗机制
    EventsOn('controller', data => {
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
  }, [])

  /**
   * 感知依赖安装状态。
   * 安装完成后，自动启动扩展器，
   * 依赖没安装的情况下，要禁止一些涉及使用依赖的功能
   */
  useEffect(() => {
    modulesRef.current = modules
    // 依赖安装完成后，启动扩展器
    if (modules.nodeModulesStatus) {
      notification('依赖加载完成')
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
        navigate(command.name.replace('view.', ''))
      } else {
        ExpansionsPostMessage({ type: 'command', data: command.name })
      }
    }
  }, [command.name])

  return (
    <>
      <div className=" flex flex-col flex-1 h-screen relative ">
        <Header>
          <WordBox />
        </Header>
        <PrimaryDiv className="steps-0 flex flex-1 z-40">
          <Menu />
          <div className="flex flex-1">
            <Outlet />
          </div>
        </PrimaryDiv>
      </div>
      <GuideMain stepIndex={step} />
    </>
  )
})
