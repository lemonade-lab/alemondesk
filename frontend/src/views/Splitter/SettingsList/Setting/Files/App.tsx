import { SecondaryDiv } from '@alemonjs/react-ui'
import ConfigForm from './ConfigForm'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import GuideConfig from '@/views/Guide/Config'
export default function Files() {
  const app = useSelector((state: RootState) => state.app)
  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="steps-config-form animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <ConfigForm dir={app.userDataTemplatePath + '/alemon.config.yaml'} />
      </SecondaryDiv>
      <GuideConfig />
    </section>
  )
}
