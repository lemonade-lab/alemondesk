import MdToJsx from 'markdown-to-jsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import classNames from 'classnames'
import LinkText from './LinkText'
import { useNotification } from '@/context/Notification'
import { Browser, Clipboard } from '@wailsio/runtime'
import { CopyOutlined, CheckOutlined } from '@ant-design/icons'
const BrowserOpenURL = Browser.OpenURL
const ClipboardSetText = Clipboard.SetText

const CodeBlock = ({ className, children }: { className?: string; children: string }) => {
  const ref = useRef<HTMLElement>(null)
  const lang = className?.replace('lang-', '') || ''
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (ref.current) {
      ref.current.removeAttribute('data-highlighted')
      hljs.highlightElement(ref.current)
    }
  }, [children, lang])

  const lineCount = useMemo(() => {
    if (typeof children !== 'string') return 0
    return children.split('\n').length
  }, [children])

  const handleCopy = useCallback(() => {
    ClipboardSetText(typeof children === 'string' ? children : '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [children])

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{lang || 'text'}</span>
        <div className="md-code-actions">
          <span className="md-code-lines">{lineCount} 行</span>
          <button className="md-code-copy" onClick={handleCopy} title="复制代码">
            {copied ? <><CheckOutlined /> 已复制</> : <><CopyOutlined /> 复制</>}
          </button>
        </div>
      </div>
      <pre className="md-pre">
        <code ref={ref} className={lang ? `language-${lang}` : ''}>
          {children}
        </code>
      </pre>
    </div>
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

const MdCheckbox = ({ checked, children }: { checked?: boolean; children?: React.ReactNode }) => (
  <li className="md-task-item">
    <span className={classNames('md-checkbox', { 'md-checkbox-checked': checked })}>
      {checked ? '✓' : ''}
    </span>
    <span>{children}</span>
  </li>
)

const Markdown = ({ source, className }: { source: string; className?: string }) => {
  // 预处理：将 task list 语法转为带属性的 HTML
  const processed = useMemo(() => {
    if (!source) return ''
    return source
      .replace(/^(\s*)- \[x\] (.*)$/gm, '$1- <md-task checked>$2</md-task>')
      .replace(/^(\s*)- \[ \] (.*)$/gm, '$1- <md-task>$2</md-task>')
  }, [source])

  return (
    <div
      className={classNames(className, 'md-body animate__animated animate__fadeIn select-text')}
    >
      <MdToJsx
        options={{
          forceBlock: true,
          overrides: {
            a: { component: AnchorLink },
            pre: { component: ({ children }: { children: React.ReactNode }) => <>{children}</> },
            'md-task': {
              component: ({ checked, children }: { checked?: boolean; children?: React.ReactNode }) => (
                <MdCheckbox checked={checked !== undefined}>{children}</MdCheckbox>
              )
            },
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
        {processed}
      </MdToJsx>
    </div>
  )
}

export default Markdown
