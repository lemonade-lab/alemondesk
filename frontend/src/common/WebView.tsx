import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

interface WebViewProps {
  src: string
  preload?: string
}

export interface WebViewHandle {
  reload: () => void
  postMessage: (message: any) => void
  getIframe: () => HTMLIFrameElement | null
}

const WebView = forwardRef<WebViewHandle, WebViewProps>(({ src, preload }, ref) => {
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


  return (
    <iframe
      ref={iframeRef}
      src={src}
      allowFullScreen
      loading="lazy"
      title=""
      id="active-frame"
      className="m-0 p-0 size-full"
      sandbox="allow-scripts"
      allow="cross-origin-isolated; autoplay; clipboard-read; clipboard-write;"
    />
  )
})

WebView.displayName = 'WebView'

export default WebView
