import React, { memo, useCallback, useState } from 'react'
import classNames from 'classnames'
import Markdown from '@/common/Markdown'
import { ChatMessage as ChatMessageType } from '@/store/chat'
import { CopyOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'

interface ChatMessageProps {
  message: ChatMessageType
  onEdit?: (messageId: string, content: string) => void
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({ message, onEdit }) => {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [message.content])

  const handleEdit = useCallback(() => {
    if (onEdit && isUser) {
      onEdit(message.id, message.content)
    }
  }, [onEdit, isUser, message.id, message.content])

  if (isTool) {
    return (
      <div className="flex px-4 py-1 justify-center">
        <div
          className={classNames(
            'max-w-[85%] min-w-0 rounded-lg px-3 py-2 text-xs leading-relaxed border',
            {
              'border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300':
                message.confirmPending,
              'border-green-400/40 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':
                !message.confirmPending && message.executed,
              'border-red-400/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300':
                !message.confirmPending && message.executed === false
            }
          )}
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          {message.confirmPending && (
            <span className="ml-2 opacity-60 animate-pulse">等待确认...</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={classNames('group flex px-4 py-2', {
        'justify-end': isUser,
        'justify-start': !isUser
      })}
    >
      {/* 消息内容 */}
      <div className={classNames('max-w-[80%] min-w-0')}>
        <div
          className={classNames('rounded-2xl px-4 py-2 text-sm leading-relaxed', {
            'bg-blue-500 text-white rounded-tr-sm': isUser,
            'chat-bubble-ai rounded-tl-sm': !isUser
          })}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          ) : (
            <div className="chat-markdown">
              {message.content ? (
                <Markdown source={message.content} />
              ) : message.loading ? (
                <span className="chat-typing-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              ) : null}
            </div>
          )}
        </div>
        {/* 操作按钮行 */}
        <div className={classNames('flex items-center gap-2 mt-1 px-1', {
          'justify-end': isUser,
          'flex-row-reverse justify-end': !isUser
        })}>
          <span className="text-xs opacity-30">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity">
            <button
              onClick={handleCopy}
              className="chat-msg-action-btn"
              title="复制"
            >
              {copied ? <CheckOutlined /> : <CopyOutlined />}
            </button>
            {isUser && onEdit && (
              <button
                onClick={handleEdit}
                className="chat-msg-action-btn"
                title="编辑并重发"
              >
                <EditOutlined />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

ChatMessage.displayName = 'ChatMessage'

export default ChatMessage
