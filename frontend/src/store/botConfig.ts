import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
    version: string
    node: string
    platform: string
    arch: string
}

const initialState: State = {
    version: '',
    node: '',
    platform: '',
    arch: ''
}

const botConfigSlice = createSlice({
    name: 'botConfig',
    initialState,
    reducers: {
        setBotConfig(state, action: PayloadAction<State>) {
            for (const key in action.payload) {
                const KEY = key as keyof State
                state[KEY] = action.payload[KEY]
            }
        }
    }
})

export const {  } = botConfigSlice.actions
export default botConfigSlice.reducer
