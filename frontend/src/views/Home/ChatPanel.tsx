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
import { ChatSend, ChatStop, ChatSetHistory, ChatConfirmTool, ChatClear } from '@wailsjs/window/chat/app'

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
      ChatStop()
    } catch {
      // ignore
    }
  }, [])

  // 编辑中内容
  const [editingContent, setEditingContent] = React.useState<string | null>(null)
  const handleEditingConsumed = useCallback(() => setEditingContent(null), [])

  // 重新编辑消息：截断到该消息，将内容填入输入框等待用户修改
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
        ChatSetHistory(remaining).catch(() => {})
      }
      // 将内容填入输入框，等用户修改后手动发送
      setEditingContent(content)
    },
    [dispatch, chat.loading, chat.conversations, chat.activeConversationId]
  )

  // 工具确认/拒绝
  const handleToolConfirm = useCallback(
    async (toolCallId: string, confirmed: boolean) => {
      try {
        ChatConfirmTool(toolCallId, confirmed)
      } catch {
        // ignore
      }
    },
    []
  )

  // 清空当前对话消息
  const handleClear = useCallback(async () => {
    dispatch(clearMessages())
    try {
      ChatClear()
    } catch {
      // ignore
    }
  }, [dispatch])

  const quickCategories = useMemo(
    () => [
      {
        title: '🤖 机器人',
        items: [
          { label: '启动', text: '帮我启动机器人' },
          { label: '停止', text: '帮我停止机器人' },
          { label: '重启', text: '帮我重启机器人' },
          { label: '查看配置', text: '机器人现在的配置是什么' },
          { label: '查看状态', text: '查看机器人运行状态' }
        ]
      },
      {
        title: '📦 包管理',
        items: [
          { label: '安装依赖', text: '帮我重新安装依赖' },
          { label: '已装列表', text: '列出所有已安装的包' },
          { label: '安装新包', text: '帮我安装一个包' },
          { label: '升级包', text: '帮我升级一个包' }
        ]
      },
      {
        title: '🎨 主题',
        items: [
          { label: '切换明暗', text: '帮我切换主题' },
          { label: '随机主题', text: '根据配置说明随机生成主题' },
          { label: '重置主题', text: '帮我重置主题' },
          { label: '导出主题', text: '帮我导出当前主题' }
        ]
      },
      {
        title: '🧩 扩展 & 仓库',
        items: [
          { label: '启动扩展', text: '帮我启动扩展服务' },
          { label: '停止扩展', text: '帮我停止扩展服务' },
          { label: '仓库列表', text: '列出所有仓库' },
          { label: '克隆仓库', text: '帮我克隆一个仓库' }
        ]
      }
    ],
    []
  )

  return (
    <div className="steps-home-chat flex flex-col size-full chat-container">
      {/* 消息列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto chat-messages-scroll">
        {activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full select-none px-6 opacity-40">
            <div className="text-sm">输入消息或点击工具栏 <span className="font-mono bg-secondary-bg dark:bg-dark-secondary-bg px-1 rounded">/</span> 快捷指令开始对话</div>
          </div>
        ) : (
          <div className="py-4">
            {activeMessages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onEdit={handleEdit} onToolConfirm={handleToolConfirm} />
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
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        onClear={handleClear}
        editingContent={editingContent}
        onEditingConsumed={handleEditingConsumed}
        quickCategories={quickCategories}
      />
    </div>
  )
}

export default ChatPanel
