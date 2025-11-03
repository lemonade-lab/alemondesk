import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
    key: string
}

const initialState: State = {
    key: ''
}

const viewsSlice = createSlice({
    name: 'views',
    initialState,
    reducers: {
        setViews(state, action: PayloadAction<State>) {
            for (const key in action.payload) {
                const KEY = key as keyof State
                state[KEY] = action.payload[KEY]
            }
        }
    }
})

export const { setViews } = viewsSlice.actions
export default viewsSlice.reducer
