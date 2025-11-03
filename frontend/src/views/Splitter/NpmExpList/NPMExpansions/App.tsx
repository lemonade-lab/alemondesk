import { SecondaryDiv } from '@alemonjs/react-ui'
import PackageInfo from './PackageInfo'
import Init from './Init'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'

export default function NPMExpansions() {
  const npmExpansions = useSelector((state: RootState) => state.npmExpansions)
  const packageInfo = npmExpansions.packageInfo
  const select = npmExpansions.select
  return (
    <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 size-full">
      {select == 'shopping' && packageInfo ? <PackageInfo packageInfo={packageInfo} /> : <Init />}
    </SecondaryDiv>
  )
}
