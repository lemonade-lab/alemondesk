import { configureStore } from '@reduxjs/toolkit'
import botReducer from '@/store/bot'
import logReducer from '@/store/log'
import expansionsReducer from '@/store/expansions'
import commandReducer from '@/store/command'
import modulesReducer from '@/store/modules'
import appReducer from '@/store/app'
import aboutReducer from '@/store/about'
import viewsReducer from '@/store/views'
import gitExpSliceReducer from '@/store/gitExp'
import settingsSlice from '@/store/settings'
import npmExpansionsReducer from '@/store/NPMExpansions'
const store = configureStore({
  reducer: {
    about: aboutReducer,
    bot: botReducer,
    log: logReducer,
    expansions: expansionsReducer,
    command: commandReducer,
    modules: modulesReducer,
    app: appReducer,
    views: viewsReducer,
    gitExp: gitExpSliceReducer,
    settings: settingsSlice,
    npmExpansions: npmExpansionsReducer
  }
})
export type RootState = ReturnType<typeof store.getState>
export default store
