import MdToJsx from 'markdown-to-jsx'
import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import classNames from 'classnames'
import LinkText from './LinkText'
import { useNotification } from '@/context/Notification'
import { Browser, Clipboard } from '@wailsio/runtime'
const BrowserOpenURL = Browser.OpenURL
const ClipboardSetText = Clipboard.SetText

const CodeBlock = ({ className, children }: { className?: string; children: string }) => {
  const ref = useRef<HTMLElement>(null)
  const lang = className?.replace('lang-', '') || ''

  useEffect(() => {
    if (ref.current) {
      ref.current.removeAttribute('data-highlighted')
      hljs.highlightElement(ref.current)
    }
  }, [children, lang])

  return (
    <pre className="md-pre">
      <code ref={ref} className={lang ? `language-${lang}` : ''}>
        {children}
      </code>
    </pre>
  )
}

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="md-inline-code">{children}</code>
)

const AnchorLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
  const notification = useNotification()
  const url = href || ''
  if (!url) return <span>{children}</span>
  return (
    <LinkText
      url={url}
      onAction={async (u: string, action: 'copy' | 'open') => {
        try {
          if (action === 'copy') {
            await ClipboardSetText(u)
            notification('已复制到剪贴板')
          } else if (action === 'open') {
            await BrowserOpenURL(u)
          }
        } catch (error) {
          console.error('操作失败:', error)
          notification('操作失败', 'error')
        }
      }}
    />
  )
}

const Markdown = ({ source, className }: { source: string; className?: string }) => {
  return (
    <div
      className={classNames(className, 'md-body animate__animated animate__fadeIn select-text')}
      style={{ padding: '0.5rem' }}
    >
      <MdToJsx
        options={{
          forceBlock: true,
          overrides: {
            a: { component: AnchorLink },
            pre: { component: ({ children }: { children: React.ReactNode }) => <>{children}</> },
            code: {
              component: ({ className, children }: { className?: string; children: string }) => {
                if (className) {
                  return <CodeBlock className={className}>{children}</CodeBlock>
                }
                return <InlineCode>{children}</InlineCode>
              }
            }
          }
        }}
      >
        {source || ''}
      </MdToJsx>
    </div>
  )
}

export default Markdown
