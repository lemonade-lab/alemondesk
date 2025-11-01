import { useEffect, useState } from 'react'
import Joyride from 'react-joyride'

export default function BaseGuide(props: {
  steps: {
    target: string
    content: string
  }[]
  stepIndex?: number
  stepStoreKey?: string
  stepSessionKey?: string
}) {
  const { steps, stepIndex = 1, stepStoreKey = 'GUIDE_v2', stepSessionKey = '1' } = props
  const [step, setStep] = useState(-1)

  // 引导回调函数
  const handleJoyrideCallback = (data: { action: string; index: number; type: string }) => {
    if (data.action == 'skip' && data.type == 'tour:end') {
      // 跳过，关闭引导
      localStorage.setItem(stepStoreKey, stepSessionKey)
    }
  }

  useEffect(() => {
    // 为 -1，表示不显示引导
    if (stepIndex == -1) {
      return
    }
    // 检查本地存储，是否已经显示过引导
    const openKey = localStorage.getItem(stepStoreKey)
    if (!openKey || (openKey && openKey != stepSessionKey)) {
      setStep(stepIndex)
    }
  }, [stepIndex])

  return (
    <Joyride
      steps={step == -1 ? [] : steps.slice(step - 1, steps.length)} // 引导步骤
      run={step == -1 ? false : true} // 是否运行引导
      callback={handleJoyrideCallback} // 回调函数
      continuous={true} // 是否连续显示步骤（显示“Next”按钮）
      showProgress={false} // 显示进度条
      showSkipButton={true} // 显示跳过按钮
      locale={{
        skip: '不再显示',
        next: '下一步',
        back: '上一步',
        last: '完成'
      }}
      styles={{
        options: {
          zIndex: 1000 // 设置 z-index
        }
      }}
    />
  )
}
