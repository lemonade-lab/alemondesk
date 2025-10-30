import { useEffect, useState } from 'react'
import Joyride from 'react-joyride'

// 引导
const KEY = 'FIRST_GUIDE'
// 条件
const KEY_DATA = '1'

// 定义引导步骤
const steps = [
  {
    target: '.steps-1',
    content:
      '这是“扩展器运行和暂停”按钮。用于增强和扩展应用功能。'
  },
  {
    target: '.steps-2',
    content:
      '这是“重载依赖”按钮。当提示缺失必要依赖(包)或挂本地文件(包)时，可尝试点击。'
  },
  {
    target: '.steps-3',
    content: '这是“指令”输入框，可以快捷执行桌面或扩展器设计的功能'
  },
  {
    target: '.steps-4',
    content: '这是“主页”按钮，可返回主页面的入口'
  },
  {
    target: '.steps-5',
    content: '这里“菜单栏-控制台”。可以查看机器人的运行日志，操作机器人的启动和停止'
  },
  {
    target: '.steps-6',
    content: '这里“菜单栏-扩展市场”。可以查看和安装扩展器'
  },
  {
    target: '.steps-7',
    content:
      '这里“菜单栏-应用列表”。可以查看和操作应用，修改不同应用的配置等。'
  },
  {
    target: '.steps-8',
    content: '设置可以让你对应用进行个性化调整，如主题...'
  }
]

export default function GuideMain({ stepIndex = 1}: { stepIndex?: number }) {
  const [step, setStep] = useState(-1)

  // 引导回调函数
  const handleJoyrideCallback = (data: { action: string; index: number; type: string }) => {
    if (data.action == 'skip' && data.type == 'tour:end') {
      // 跳过，关闭引导
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
