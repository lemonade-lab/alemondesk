import { Button } from '@alemonjs/react-ui'
import { useState, useRef, useEffect } from 'react'

// 链接组件
const LinkText = ({
  url,
  onAction
}: {
  url: string
  onAction: (url: string, action: 'copy' | 'open') => void
}) => {
  const [showActions, setShowActions] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showActions])

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions(prev => !prev)
  }

  const handleActionClick = (action: 'copy' | 'open') => {
    onAction(url, action)
    setShowActions(false) // 执行操作后关闭菜单
  }

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
    >
      <span
        className="text-blue-500 underline cursor-pointer hover:text-blue-700 px-1 rounded hover:bg-blue-50 transition-colors"
        onClick={handleLinkClick}
      >
        {url}
      </span>

      {showActions && (
        <div className="select-none absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-1 min-w-32">
          <div className="flex flex-col gap-1">
            <Button
              className="justify-start"
              onClick={(e) => {
                e.stopPropagation()
                handleActionClick('copy')
              }}
            >
              📋 复制链接
            </Button>
            <Button
              className="justify-start"
              onClick={(e) => {
                e.stopPropagation()
                handleActionClick('open')
              }}
            >
              🔗 打开链接
            </Button>
          </div>
        </div>
      )}
    </span>
  )
}

export default LinkText