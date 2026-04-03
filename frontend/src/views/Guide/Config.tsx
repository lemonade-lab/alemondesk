import BaseGuide from './Base'
import { GUIDE_REGISTRY } from './keys'

const { key, data, steps } = GUIDE_REGISTRY.CONFIG

export default function GuideConfig({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={[...steps]} stepIndex={stepIndex} stepStoreKey={key} stepSessionKey={data} />
  )
}
