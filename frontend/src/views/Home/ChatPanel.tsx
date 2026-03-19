import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
  addMessage,
  appendMessageContent,
  setLoading,
  setMessageLoading,
  setStreamingId,
  clearMessages,
  createConversation,
  truncateFromMessage,
  ChatMessage as ChatMessageType
} from '@/store/chat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { RobotOutlined } from '@ant-design/icons'

let _msgCounter = 0
const genId = () => `msg_${Date.now()}_${++_msgCounter}`

const ChatPanel: React.FC = () => {
  const dispatch = useDispatch()
  const chat = useSelector((state: RootState) => state.chat)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 当前会话消息
  const activeMessages = useMemo(() => {
    const conv = chat.conversations.find(c => c.id === chat.activeConversationId)
    return conv?.messages || []
  }, [chat.conversations, chat.activeConversationId])

  const suggestions = chat.suggestions || []

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeMessages, scrollToBottom])

  // 发送消息
  const handleSend = useCallback(
    async (content: string) => {
      // 如果没有活跃会话，自动创建一个
      if (!chat.activeConversationId) {
        dispatch(createConversation({ id: genId() }))
      }

      // 添加用户消息
      const userMsg: ChatMessageType = {
        id: genId(),
        role: 'user',
        content,
        timestamp: Date.now()
      }
      dispatch(addMessage(userMsg))

      // 添加 AI 占位消息
      const aiMsgId = genId()
      const aiMsg: ChatMessageType = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        loading: true
      }
      dispatch(addMessage(aiMsg))
      dispatch(setLoading(true))
      dispatch(setStreamingId(aiMsgId))

      try {
        const { ChatSend } = await import('@wailsjs/window/chat/app')
        ChatSend(aiMsgId, content)
      } catch {
        dispatch(
          appendMessageContent({
            id: aiMsgId,
            content: '发送失败，请检查后端服务是否正常运行。'
          })
        )
        dispatch(setMessageLoading({ id: aiMsgId, loading: false }))
        dispatch(setLoading(false))
        dispatch(setStreamingId(null))
      }
    },
    [dispatch, chat.activeConversationId]
  )

  // 停止生成
  const handleStop = useCallback(async () => {
    try {
      const { ChatStop } = await import('@wailsjs/window/chat/app')
      ChatStop()
    } catch {
      // ignore
    }
  }, [])

  // 重新编辑消息：截断到该消息并重新发送
  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      if (chat.loading) return
      // 截断前端消息
      dispatch(truncateFromMessage(messageId))
      // 同步后端历史：找到截断后的消息列表
      const conv = chat.conversations.find(c => c.id === chat.activeConversationId)
      if (conv) {
        const idx = conv.messages.findIndex(m => m.id === messageId)
        const remaining = conv.messages
          .slice(0, idx)
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }))
        import('@wailsjs/window/chat/app')
          .then(({ ChatSetHistory }) => ChatSetHistory(remaining))
          .catch(() => {})
      }
      setTimeout(() => handleSend(content), 0)
    },
    [dispatch, chat.loading, chat.conversations, chat.activeConversationId, handleSend]
  )

  // 清空当前对话消息
  const handleClear = useCallback(async () => {
    dispatch(clearMessages())
    try {
      const { ChatClear } = await import('@wailsjs/window/chat/app')
      ChatClear()
    } catch {
      // ignore
    }
  }, [dispatch])

  const quickStarts = useMemo(
    () => [
      { icon: '🤖', label: '启动机器人', text: '帮我启动机器人' },
      { icon: '🤚', label: '停止机器人', text: '帮我停止机器人' },
      { icon: '📦', label: '加载依赖', text: '帮我重新安装依赖' },
      { icon: '🧩', label: '查看扩展器', text: '机器人现在有多少个可用包扩展' },
      { icon: '⚙️', label: '机器人配置', text: '机器人现在的配置是什么' }
    ],
    []
  )

  return (
    <div className="flex flex-col size-full chat-container">
      {/* 消息列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto chat-messages-scroll">
        {activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full select-none px-6">
            <RobotOutlined className="text-5xl mb-3 opacity-25" />
            <p className="text-base opacity-30 mb-6">开始一段新的对话</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-md">
              {quickStarts.map(q => (
                <button
                  key={q.label}
                  className="chat-quick-btn"
                  onClick={() => handleSend(q.text)}
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="text-xs opacity-70">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {activeMessages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onEdit={handleEdit} />
            ))}
            {/* 下一步建议 */}
            {suggestions.length > 0 && !chat.loading && (
              <div className="flex flex-wrap gap-2 px-4 py-2 justify-start">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chat-suggestion-btn"
                    onClick={() => handleSend(s.text)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <ChatInput onSend={handleSend} onStop={handleStop} onClear={handleClear} />
    </div>
  )
}

export default ChatPanel
