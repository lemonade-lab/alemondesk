import React, { memo, useCallback, useState } from 'react'
import classNames from 'classnames'
import Markdown from '@/common/Markdown'
import { ChatMessage as ChatMessageType } from '@/store/chat'
import { CopyOutlined, EditOutlined, CheckOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

interface ChatMessageProps {
  message: ChatMessageType
  onEdit?: (messageId: string, content: string) => void
  onToolConfirm?: (toolCallId: string, confirmed: boolean) => void
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({ message, onEdit, onToolConfirm }) => {
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
            'max-w-[85%] min-w-0 rounded-lg px-3 py-2 text-xs leading-relaxed',
            {
              'chat-tool-msg-pending': message.confirmPending,
              'chat-tool-msg': !message.confirmPending && message.executed,
              'chat-tool-msg-error': !message.confirmPending && message.executed === false
            }
          )}
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          {message.confirmPending && (
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                className="chat-confirm-btn chat-confirm-btn--cancel"
                onClick={() => onToolConfirm?.(message.toolCallId!, false)}
              >
                <CloseCircleOutlined /> 拒绝
              </button>
              <button
                className="chat-confirm-btn chat-confirm-btn--ok"
                onClick={() => onToolConfirm?.(message.toolCallId!, true)}
              >
                <CheckCircleOutlined /> 确认执行
              </button>
            </div>
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
            'chat-bubble-user rounded-tr-sm': isUser,
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
