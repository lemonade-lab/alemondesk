import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WebviewTab {
  id: string
  command: string
  title: string
  icon: string
  expansionsName: string
  view: string
}

interface State {
  name: string
  data: [
    {
      command: string
      isMainProcess: boolean
    }
  ],
  view: string
  webviewCache: Record<string, string>
  tabs: WebviewTab[]
  activeTabId: string
}

const initialState: State = {
  name: '',
  data: [
    {
      command: 'open.devTools',
      isMainProcess: true
    }
  ],
  view: '',
  webviewCache: {},
  tabs: [],
  activeTabId: ''
}

const findTab = (state: State, id: string) => state.tabs.find(tab => tab.id === id)

const notificationSlice = createSlice({
  name: 'command',
  initialState,
  reducers: {
    setCommand(state, action: PayloadAction<string>) {
      state.name = action.payload
    },
    openWebviewTab(state, action: PayloadAction<Omit<WebviewTab, 'view'> & { view?: string }>) {
      const exists =
        state.tabs.find(
          tab =>
            tab.command === action.payload.command ||
            tab.title === action.payload.title
        ) || findTab(state, action.payload.id)
      if (exists) {
        state.activeTabId = exists.id
        state.view = exists.view
        return
      }
      const tab: WebviewTab = {
        ...action.payload,
        view: action.payload.view || ''
      }
      state.tabs.push(tab)
      state.activeTabId = tab.id
      state.view = tab.view
    },
    closeWebviewTab(state, action: PayloadAction<string>) {
      const index = state.tabs.findIndex(tab => tab.id === action.payload)
      if (index === -1) return
      const wasActive = state.activeTabId === action.payload
      state.tabs.splice(index, 1)

      if (wasActive) {
        const nextTab = state.tabs[index] || state.tabs[index - 1]
        state.activeTabId = nextTab?.id || ''
        state.view = nextTab?.view || ''
      }
    },
    setActiveWebviewTab(state, action: PayloadAction<string>) {
      state.activeTabId = action.payload
      const activeTab = findTab(state, action.payload)
      state.view = activeTab?.view || ''
    },
    setWebview(state, action: PayloadAction<string>) {
      state.view = action.payload
      const activeTab = findTab(state, state.activeTabId)
      if (activeTab) {
        activeTab.view = action.payload
      }
    },
    setWebviewTabView(
      state,
      action: PayloadAction<{
        tabId: string
        view: string
      }>
    ) {
      const tab = findTab(state, action.payload.tabId)
      if (!tab) return
      tab.view = action.payload.view
      if (state.activeTabId === action.payload.tabId) {
        state.view = action.payload.view
      }
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
    },
    clearWebviewTabs(state) {
      state.tabs = []
      state.activeTabId = ''
      state.view = ''
    }
  }
})

export const {
  setCommand,
  openWebviewTab,
  closeWebviewTab,
  setActiveWebviewTab,
  setWebview,
  setWebviewTabView,
  setWebviewCache,
  clearWebviewCache,
  clearWebviewTabs
} = notificationSlice.actions

export default notificationSlice.reducer
