import MarkdownPreview from '@uiw/react-markdown-preview'
import rehypeHighlight from 'rehype-highlight'
import rehypePrism from 'rehype-prism'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeRaw from 'rehype-raw'
import rehypeAttr from 'rehype-attr'
import { useEffect } from 'react'
import { ThemeMode } from '@wailsjs/window/theme/app'
import classNames from 'classnames'
import LinkText from './LinkText'
import { useNotification } from '@/context/Notification'
import { Browser, Clipboard } from '@wailsio/runtime'
const BrowserOpenURL = Browser.OpenURL
const ClipboardSetText = Clipboard.SetText

const useTheme = () => {
  // theme
  useEffect(() => {
    // 读取本地存储的主题
    ThemeMode().then(res => {
      if (res === 'dark') {
        document.documentElement.setAttribute('data-color-mode', 'dark')
      } else {
        document.documentElement.setAttribute('data-color-mode', 'light')
      }
    })
    // 监听主题变化
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDarkClass = document.documentElement.classList.contains('dark')
          document.documentElement.setAttribute('data-color-mode', hasDarkClass ? 'dark' : 'light')
        }
      }
    })
    // 监听根元素的 class 变化
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => {
      // 移除监听
      observer.disconnect()
    }
  }, [])
}

/**
 * @param param0
 * @returns
 */
const Markdown = ({ source, className }: { source: string; className?: string }) => {
  const notification = useNotification()
  useTheme()
  return (
    <MarkdownPreview
      className={classNames(className, 'animate__animated animate__fadeIn select-text')}
      style={{
        padding: '0.5rem',
        backgroundColor: '#FFFFFF00'
      }}
      source={source}
      components={{
        // 该为必然是 外部浏览器打开
        a: ({ node, ...props }) => {
          if(typeof props.children !== 'object' || !props.children || !('props' in props.children)){
            return <span>{props.children}</span>
          }
          const href = props.children.props?.href ?? ''
          if(!href){
            return <span>{props.children}</span>
          }
          return <LinkText url={href} onAction={async (url: string, action: 'copy' | 'open') => {
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
          }} />
        }
      }}
      rehypePlugins={[
        // rehypeSanitize, // 清理不安全的 HTML
        rehypeHighlight, // 代码高亮
        rehypePrism, // Prism.js 高亮
        rehypeSlug, // 为标题生成锚点
        rehypeRaw, // 允许处理原始 HTML
        [rehypeAutolinkHeadings, { behavior: 'wrap' }], // 自动为标题添加链接
        [
          rehypeAttr,
          {
            // 示例：为所有链接添加 target="_blank"
            properties: {
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
        ]
      ]}
    />
  )
}

export default Markdown
