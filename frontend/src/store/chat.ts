import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  loading?: boolean
  // 工具调用相关
  toolName?: string
  toolCallId?: string
  executed?: boolean
  confirmPending?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  loading: boolean
  streamingId: string | null
  suggestions: { label: string; text: string }[]
}

const STORAGE_KEY = 'ALemonDesk_chat'

/** 从 localStorage 加载持久化的会话数据 */
function loadPersistedState(): Partial<ChatState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return {
      conversations: data.conversations || [],
      activeConversationId: data.activeConversationId || null
    }
  } catch {
    return {}
  }
}

const persisted = loadPersistedState()

const initialState: ChatState = {
  conversations: persisted.conversations || [],
  activeConversationId: persisted.activeConversationId || null,
  loading: false,
  streamingId: null,
  suggestions: []
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 会话管理
    createConversation(state, action: PayloadAction<{ id: string; title?: string }>) {
      const conv: Conversation = {
        id: action.payload.id,
        title: action.payload.title || '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      state.conversations.unshift(conv)
      state.activeConversationId = conv.id
    },
    switchConversation(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload
      state.loading = false
      state.streamingId = null
    },
    deleteConversation(state, action: PayloadAction<string>) {
      state.conversations = state.conversations.filter(c => c.id !== action.payload)
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.conversations[0]?.id || null
      }
    },
    renameConversation(state, action: PayloadAction<{ id: string; title: string }>) {
      const conv = state.conversations.find(c => c.id === action.payload.id)
      if (conv) {
        conv.title = action.payload.title
      }
    },
    // 消息管理
    addMessage(state, action: PayloadAction<ChatMessage>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        conv.messages.push(action.payload)
        conv.updatedAt = Date.now()
        // 用第一条用户消息自动命名
        if (action.payload.role === 'user' && conv.title === '新对话') {
          conv.title = action.payload.content.slice(0, 20) + (action.payload.content.length > 20 ? '...' : '')
        }
      }
      // 发送新消息时清除建议
      if (action.payload.role === 'user') {
        state.suggestions = []
      }
    },
    updateMessage(state, action: PayloadAction<{ id: string; content: string }>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      const msg = conv?.messages.find(m => m.id === action.payload.id)
      if (msg) {
        msg.content = action.payload.content
      }
    },
    appendMessageContent(state, action: PayloadAction<{ id: string; content: string }>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      const msg = conv?.messages.find(m => m.id === action.payload.id)
      if (msg) {
        msg.content += action.payload.content
      }
    },
    setMessageLoading(state, action: PayloadAction<{ id: string; loading: boolean }>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      const msg = conv?.messages.find(m => m.id === action.payload.id)
      if (msg) {
        msg.loading = action.payload.loading
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setStreamingId(state, action: PayloadAction<string | null>) {
      state.streamingId = action.payload
    },
    clearMessages(state) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        conv.messages = []
        conv.updatedAt = Date.now()
      }
      state.loading = false
      state.streamingId = null
      state.suggestions = []
    },
    removeMessage(state, action: PayloadAction<string>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        conv.messages = conv.messages.filter(m => m.id !== action.payload)
      }
    },
    // 截断到指定消息（不含该消息），用于重新编辑
    truncateFromMessage(state, action: PayloadAction<string>) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        const idx = conv.messages.findIndex(m => m.id === action.payload)
        if (idx >= 0) {
          conv.messages = conv.messages.slice(0, idx)
          conv.updatedAt = Date.now()
        }
      }
      state.loading = false
      state.streamingId = null
    },
    // 工具确认相关
    addToolMessage(
      state,
      action: PayloadAction<{
        id: string
        toolCallId: string
        toolName: string
        content: string
        confirmPending?: boolean
      }>
    ) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        conv.messages.push({
          id: action.payload.id,
          role: 'tool',
          content: action.payload.content,
          timestamp: Date.now(),
          toolCallId: action.payload.toolCallId,
          toolName: action.payload.toolName,
          confirmPending: action.payload.confirmPending ?? false
        })
        conv.updatedAt = Date.now()
      }
    },
    resolveToolConfirm(
      state,
      action: PayloadAction<{ toolCallId: string; executed: boolean; result?: string }>
    ) {
      const conv = state.conversations.find(c => c.id === state.activeConversationId)
      if (conv) {
        const msg = conv.messages.find(m => m.toolCallId === action.payload.toolCallId)
        if (msg) {
          msg.confirmPending = false
          msg.executed = action.payload.executed
          if (action.payload.result) {
            msg.content = action.payload.result
          }
        }
      }
    },
    // 设置下一步建议
    setSuggestions(state, action: PayloadAction<{ label: string; text: string }[]>) {
      state.suggestions = action.payload
    }
  }
})

export const {
  createConversation,
  switchConversation,
  deleteConversation,
  renameConversation,
  addMessage,
  updateMessage,
  appendMessageContent,
  setMessageLoading,
  setLoading,
  setStreamingId,
  clearMessages,
  removeMessage,
  truncateFromMessage,
  addToolMessage,
  resolveToolConfirm,
  setSuggestions
} = chatSlice.actions

/** 持久化中间件：每次 chat action 后保存到 localStorage */
export const chatPersistMiddleware =
  (storeAPI: { getState: () => { chat: ChatState } }) =>
  (next: (action: unknown) => unknown) =>
  (action: unknown) => {
    const result = next(action)
    // 仅持久化 chat 相关 action
    if (typeof action === 'object' && action !== null && 'type' in action) {
      const type = (action as { type: string }).type
      if (type.startsWith('chat/')) {
        const { conversations, activeConversationId } = storeAPI.getState().chat
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ conversations, activeConversationId })
          )
        } catch {
          // localStorage 满或不可用时忽略
        }
      }
    }
    return result
  }

export default chatSlice.reducer
