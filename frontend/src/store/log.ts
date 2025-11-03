import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
  rolu: 'post' | 'del'
  message: string[]
}

const initialState: State = {
  rolu: 'post',
  message: []
}

const logsSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    postMessage(state, action: PayloadAction<string>) {
      state.rolu = 'post'
      state.message.push(action.payload)
    },
    delMessage(state, action: PayloadAction<number>) {
      state.rolu = 'del'
      state.message.splice(0, action.payload)  // 从开头删除
    }
  }
})

export const { postMessage, delMessage } = logsSlice.actions
export default logsSlice.reducer
