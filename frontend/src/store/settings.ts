import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
    key: string
}

const initialState: State = {
    key: ''
}

const settingsSlice = createSlice({
    name: 'botConfig',
    initialState,
    reducers: {
        setSettings(state, action: PayloadAction<State>) {
            for (const key in action.payload) {
                const KEY = key as keyof State
                state[KEY] = action.payload[KEY]
            }
        }
    }
})

export const { setSettings } = settingsSlice.actions
export default settingsSlice.reducer
