import { PackageInfoType } from '@/views/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SearchResultItem {
    name: string
    version: string
    description: string
    author: string | { name: string; email?: string; url?: string } | null
}

interface State {
    packageInfo: PackageInfoType | null
    select: string
    tab: 'installed' | 'search' | 'clone' | 'tool'
    searchKeyword: string
    searchResults: SearchResultItem[]
    searchLoading: boolean
}

const initialState: State = {
    packageInfo: null,
    select: '',
    tab: 'installed',
    searchKeyword: '',
    searchResults: [],
    searchLoading: false
}

const npmExpansions = createSlice({
    name: 'npmExpansions',
    initialState,
    reducers: {
        setPackageInfo(state, action: PayloadAction<PackageInfoType | null>) {
            state.packageInfo = action.payload
        },
        setSelect(state, action: PayloadAction<string>) {
            state.select = action.payload
        },
        setTab(state, action: PayloadAction<'installed' | 'search' | 'clone' | 'tool'>) {
            state.tab = action.payload
        },
        setSearchKeyword(state, action: PayloadAction<string>) {
            state.searchKeyword = action.payload
        },
        setSearchResults(state, action: PayloadAction<SearchResultItem[]>) {
            state.searchResults = action.payload
        },
        setSearchLoading(state, action: PayloadAction<boolean>) {
            state.searchLoading = action.payload
        }
    }
})

export const {
    setPackageInfo,
    setSelect,
    setTab,
    setSearchKeyword,
    setSearchResults,
    setSearchLoading
} = npmExpansions.actions
export default npmExpansions.reducer
