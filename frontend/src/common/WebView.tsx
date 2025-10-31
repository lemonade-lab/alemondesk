import { EventsOff, EventsOn } from '@wailsjs/runtime/runtime'
import { useEffect, useRef } from 'react'

// 定义消息类型
interface WebViewMessage {
  global: 'go' | 'runtime' | 'message' | 'callback'
  type: string
  args?: any[]
  callbackId?: number
  result?: any
  error?: string
}

interface WebViewProps {
  src: string
  rules?: {
    protocol: string
    work: string
  }[]
}

const WebView = ({ src, rules }: WebViewProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastSrcRef = useRef<string>('') // 记录上次发送的内容
  const initTimestampRef = useRef<number>(0) // 初始化时间戳

  // 初始化和重建 iframe
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      console.warn('[WebView] 容器引用不存在')
      return
    }

    // 防止重复推送相同内容
    if (lastSrcRef.current === src) {
      console.log('[WebView] 内容未变化，跳过推送')
      return
    }

    if(!src){
      // 被清空内容
      return;
    }

    // 生成唯一的初始化时间戳
    const timestamp = Date.now()
    initTimestampRef.current = timestamp

    console.log(`[WebView] 内容变化，重建 iframe (timestamp: ${timestamp})`)

    // 清空容器（删除旧 iframe）
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    console.log(`[WebView] 已清空容器`)

    // 创建新的 iframe
    const newIframe = document.createElement('iframe')
    newIframe.src = '/webview.html'
    newIframe.allowFullscreen = true
    newIframe.title = 'WebView'
    newIframe.id = 'active-frame'
    newIframe.className = 'm-0 p-0 w-full h-full border-0'

    // 等待新 iframe 加载完成
    newIframe.onload = () => {
      // 确保这是最新的初始化请求（防止快速切换时的竞态条件）
      if (initTimestampRef.current === timestamp && newIframe.contentWindow) {
        console.log(`[WebView] 新 iframe 已加载，发送内容 (timestamp: ${timestamp})`)
        newIframe.contentWindow.postMessage(
          {
            global: 'message',
            type: 'initialize',
            src: src,
            rules: rules,
            timestamp: timestamp
          },
          '*'
        )
        // 更新已发送的内容
        lastSrcRef.current = src
      } else {
        console.log(`[WebView] 初始化已被新请求覆盖 (timestamp: ${timestamp})`)
      }
    }

    // 插入新 iframe 到容器
    container.appendChild(newIframe)

    // 更新 ref
    iframeRef.current = newIframe

    console.log(`[WebView] 新 iframe 已创建并插入`)

    // 开始处理消息监听

    const observeKeys: {
      [key: string]: string
    } = {
      EventsOnMultiple: 'EventsOnMultiple'
    }
    const observeType: {
      [key: string]: string
    } = {}
    // 这里callback
    const postMessage = (data: WebViewMessage) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(data, '*')
      }
    }
    // 处理 Runtime 方法调用
    const handleRuntimeCall = async (data: WebViewMessage) => {
      try {
        const runtimeProp = (window as any).runtime?.[data.type]
        if (typeof runtimeProp === 'function') {
          const args = data?.args ?? []
           console.log(`[WebView] 调用 runtime.${data.type} 方法`, args)
          // 拦截订阅
          if (observeKeys[data.type]) {
            const eventName = args[0]
            if (!eventName) return
            if(!observeType[eventName]){
            // 记录订阅类型，方便取消
            observeType[eventName] = data.type
              // 订阅事件
              EventsOn(eventName, (...args) => {
                console.log(`检查`, eventName, args)
                iframeRef.current?.contentWindow?.postMessage(
                  {
                    global: 'runtime',
                    type: eventName,
                    args: args
                  },
                  '*'
                )
              })
            }
            return
          }
          const result = await runtimeProp(...args)
          // postMessage({
          //   global: 'callback',
          //   type: 'callback',
          //   callbackId: data.callbackId!,
          //   result: result
          // })
        } else {
          throw new Error(`runtime.${data.type} is not a function`)
        }
      } catch (error) {
        // postMessage({
        //   global: 'callback',
        //   type: 'callback',
        //   callbackId: data.callbackId!,
        //   error: error instanceof Error ? error.message : 'Unknown error'
        // })
      }
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      // 处理 API 调用
      const apiMessage = data as WebViewMessage
      // 验证消息结构
      if (!apiMessage.global || !apiMessage.type) return
      if (apiMessage.global === 'runtime') {
        handleRuntimeCall(apiMessage)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      // 清理订阅
      Object.keys(observeType).forEach(key => {
        EventsOff(observeType[key])
      })
    }
  }, [src])

  return <div ref={containerRef} className="m-0 p-0 w-full h-full" />
}

export default WebView;
