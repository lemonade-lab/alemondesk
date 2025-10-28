import { useEffect, useState } from 'react'
import Joyride from 'react-joyride'
// 引导
const KEY = 'FIRST_GUIDE_COMMON'
// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps = [
  {
    target: '.steps-common-2',
    content: '如果你想加载个性化机器人，或把桌面安装到指定目录，可“以指定目录打开”'
    // disableBeacon: true
  }
]

export default function GuideCommon({ stepIndex = 1 }: { stepIndex?: number }) {
  const [step, setStep] = useState(-1)

  // 引导回调函数
  const handleJoyrideCallback = (data: { action: string; index: number; type: string }) => {
    console.log(data)
    if (data.action == 'skip' && data.type == 'tour:end') {
      localStorage.setItem(KEY, KEY_DATA)
    }
  }

  useEffect(() => {
    // 为 -1，表示不显示引导
    if (stepIndex == -1) {
      return
    }
    // 检查本地存储，是否已经显示过引导
    const openKey = localStorage.getItem(KEY)
    if (!openKey || (openKey && openKey != KEY_DATA)) {
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
        skip: '不再显示'
      }}
      styles={{
        options: {
          zIndex: 1000 // 设置 z-index
        }
      }}
    />
  )
}
