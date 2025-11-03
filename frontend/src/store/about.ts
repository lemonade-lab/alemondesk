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

const aboutSlice = createSlice({
    name: 'about',
    initialState,
    reducers: {
        setAbout(state, action: PayloadAction<State>) {
            for (const key in action.payload) {
                const KEY = key as keyof State
                state[KEY] = action.payload[KEY]
            }
        }
    }
})

export const { setAbout } = aboutSlice.actions
export default aboutSlice.reducer
