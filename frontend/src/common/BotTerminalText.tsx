import { useNotification } from '@/context/Notification'
import LinkText from './LinkText'
import { Browser, Clipboard } from '@wailsio/runtime'
const BrowserOpenURL = Browser.OpenURL
const ClipboardSetText = Clipboard.SetText

const ParseLogMessage = ({ message }: { message: string }) => {
  const notification = useNotification()

  const errorRegex = /\[ERROR\]/i
  // 改进的链接正则表达式，确保不会匹配数字和方括号
  const urlRegex =
    /(?:https?|ftp|ws|wss):\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g

  const handleLinkClick = async (url: string, action: 'copy' | 'open') => {
    try {
      if (action === 'copy') {
        await ClipboardSetText(url)
        notification('已复制到剪贴板')
      } else if (action === 'open') {
        await BrowserOpenURL(url)
      }
    } catch (error) {
      console.error('操作失败:', error)
      notification('操作失败', 'error')
    }
  }

  // 更精确的清理链接末尾的标点符号
  const cleanUrl = (url: string): { cleanedUrl: string; trailingChars: string } => {
    // 只移除真正的标点符号，保留数字和字母
    const match = url.match(/^(.*?)([.,;:!?)\s]+)$/)
    if (match) {
      return {
        cleanedUrl: match[1],
        trailingChars: match[2]
      }
    }
    return {
      cleanedUrl: url,
      trailingChars: ''
    }
  }
  if (!message || !message.match) return null

  // 如果消息包含链接
  const urlMatch = message.match(urlRegex)
  if (urlMatch) {
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0

    urlMatch.forEach((originalUrl, index) => {
      const { cleanedUrl, trailingChars } = cleanUrl(originalUrl)
      const urlStartIndex = message.indexOf(originalUrl, lastIndex)

      // 添加链接前的文本
      if (urlStartIndex > lastIndex) {
        const textBefore = message.slice(lastIndex, urlStartIndex)
        parts.push(
          errorRegex.test(textBefore) ? (
            <span className="text-red-500" key={`text-${index}`}>
              {textBefore}
            </span>
          ) : (
            textBefore
          )
        )
      }

      // 只有清理后的URL看起来像真正的URL才渲染为链接
      if (isValidUrl(cleanedUrl)) {
        // 添加链接组件
        parts.push(<LinkText key={`link-${index}`} url={cleanedUrl} onAction={handleLinkClick} />)
        // 添加尾随字符
        if (trailingChars) {
          parts.push(trailingChars)
        }
      } else {
        // 如果不是有效的URL，直接显示原始文本
        parts.push(originalUrl)
      }

      // 更新最后索引位置
      lastIndex = urlStartIndex + originalUrl.length
    })

    // 添加剩余文本
    if (lastIndex < message.length) {
      const remainingText = message.slice(lastIndex)
      parts.push(
        errorRegex.test(remainingText) ? (
          <span className="text-red-500" key="remaining">
            {remainingText}
          </span>
        ) : (
          remainingText
        )
      )
    }

    return <span>{parts}</span>
  }

  // 普通错误消息
  if (errorRegex.test(message)) {
    return <span className="text-red-500">{message}</span>
  }

  return <span>{message}</span>
}

// 辅助函数：验证是否为有效的URL
const isValidUrl = (url: string): boolean => {
  try {
    // 简单的URL验证，确保有协议和域名
    return url.includes('://') && url.split('://')[1].includes('.')
  } catch {
    return false
  }
}

export default ParseLogMessage
