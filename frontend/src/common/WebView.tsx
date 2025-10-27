import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { textContent } from './textContent'

interface WebViewProps {
  src: string
}

export interface WebViewHandle {
  reload: () => void
  postMessage: (message: any) => void
  getIframe: () => HTMLIFrameElement | null
}

const WebView = forwardRef<WebViewHandle, WebViewProps>(({ src }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 暴露方法给外部 ref
  useImperativeHandle(
    ref,
    () => ({
      reload: () => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src
        }
      },
      postMessage: (message: any) => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, '*')
        }
      },
      getIframe: () => {
        return iframeRef.current
      }
    }),
    []
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // 尝试注入预加载脚本
      try {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow && iframeWindow.document) {
          const script = iframeWindow.document.createElement('script')
          script.textContent = textContent
          iframeWindow.document.head.appendChild(script)
        }
      } catch (error) {
        console.log('跨域 iframe，无法直接注入脚本')
      }
    }

    iframe.addEventListener('load', handleLoad)

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [src])

  return (
    <iframe
      ref={iframeRef}
      id="myIframe"
      src={src}
      style={{ width: '100%', height: '500px', border: 'none' }}
      allowFullScreen
      loading="lazy"
    />
  )
})

WebView.displayName = 'WebView'

export default WebView
