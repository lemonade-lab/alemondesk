import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
  name: string
  // 类型
  data: [
    {
      // 命令
      command: string
      // 是否是给主进程发送的
      isMainProcess: boolean
    }
  ],
  view: string
  webviewCache: Record<string, string>
}

// 初始状态
const initialState: State = {
  name: '',
  data: [
    {
      command: 'open.devTools',
      isMainProcess: true
    }
  ],
  view: '',
  webviewCache: {}
}

const notificationSlice = createSlice({
  name: 'command',
  initialState,
  reducers: {
    setCommand(state, action: PayloadAction<string>) {
      state.name = action.payload
    },
    setWebview(state, action: PayloadAction<string>) {
      state.view = action.payload
    },
    setWebviewCache(
      state,
      action: PayloadAction<{
        command: string
        view: string
      }>
    ) {
      const { command, view } = action.payload
      if (!command || !view) return
      state.webviewCache[command] = view
    },
    clearWebviewCache(state) {
      state.webviewCache = {}
    }
  }
})

export const { setCommand, setWebview, setWebviewCache, clearWebviewCache } = notificationSlice.actions
export default notificationSlice.reducer
