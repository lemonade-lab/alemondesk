import BaseGuide from './Base'
import { GUIDE_REGISTRY } from './keys'

const { key, data, steps } = GUIDE_REGISTRY.GIT_EXP

export default function GuideGitExp({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={[...steps]} stepIndex={stepIndex} stepStoreKey={key} stepSessionKey={data} />
  )
}
