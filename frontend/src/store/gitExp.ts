import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { GitRepoInfo } from '@wailsjs/window/git/models'

interface State {
    data: GitRepoInfo[],
    loading: boolean,
    space: string,
    tabValue: string,
    currentRepo: {
        item: GitRepoInfo | null,
        show: boolean,
        package: null | {
            name: string
        },
        packageString: string,
        // readme 内容
        readme: string,
        // 分支列表
        branches: string[],
        // 提交记录
        commits: Array<{
            hash: string
            message: string
        }>
    }
}

const initialState: State = {
    data: [],
    loading: false,
    space: 'packages',
    tabValue: '1',
    currentRepo: {
        item: null,
        show: false,
        package: null,
        packageString: '',
        readme: '',
        branches: [],
        commits: []
    }
}

const gitExpSlice = createSlice({
    name: 'about',
    initialState,
    reducers: {
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload
        },
        setData(state, action: PayloadAction<GitRepoInfo[]>) {
            state.data = action.payload
        },
        setSpace(state, action: PayloadAction<string>) {
            state.space = action.payload
        },
        setTabValue(state, action: PayloadAction<string>) {
            state.tabValue = action.payload
        },
        setCurrentRepo(state, action: PayloadAction<State['currentRepo']>) {
            state.currentRepo = action.payload
        }
    }
})

export const { setLoading, setData, setSpace, setTabValue, setCurrentRepo } = gitExpSlice.actions
export default gitExpSlice.reducer
