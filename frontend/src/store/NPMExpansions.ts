import { PackageInfoType } from '@/views/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface State {
    packageInfo: PackageInfoType | null
    select: string
}

const initialState: State = {
    packageInfo: null,
    select: ''
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
        }
    }
})

export const { setPackageInfo, setSelect } = npmExpansions.actions
export default npmExpansions.reducer
