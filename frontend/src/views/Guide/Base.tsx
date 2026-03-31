import { useCallback, useEffect, useState } from 'react'
import Joyride from 'react-joyride'

/** 读取当前生效的 CSS 变量值 */
const cv = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** 根据当前主题（是否有 dark class）构建 Joyride styles */
function useJoyrideThemeStyles() {
  const isDark = useCallback(
    () => document.documentElement.classList.contains('dark'),
    []
  )

  const buildStyles = useCallback(() => {
    const dark = isDark()
    const prefix = dark ? '--alemonjs-dark-' : '--alemonjs-'
    const bg = cv(`${prefix}secondary-bg`) || (dark ? '#003b46' : '#faf8ff')
    const text = cv(`${prefix}primary-text`) || (dark ? '#839496' : '#2a1b5e')
    const btnBg = cv(`${prefix}button-bg`) || (dark ? '#586e75' : '#a78bfa')
    const btnText = cv(`${prefix}button-text`) || '#ffffff'
    const btnHover = cv(`${prefix}button-bg-hover`) || (dark ? '#708183' : '#8b5cf6')
    const border = cv(`${prefix}secondary-border`) || (dark ? '#586e75' : '#d5c8b2')

    return {
      options: {
        zIndex: 5000,
        primaryColor: btnBg,
        arrowColor: bg,
        backgroundColor: bg,
        textColor: text,
        overlayColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.45)'
      },
      tooltip: {
        borderRadius: 12,
        padding: '16px 20px',
        fontSize: 14,
        border: `1px solid ${border}`,
        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.12)'
      },
      tooltipContent: {
        padding: '8px 0',
        color: text
      },
      buttonNext: {
        borderRadius: 8,
        padding: '6px 16px',
        fontSize: 13,
        backgroundColor: btnBg,
        color: btnText
      },
      buttonBack: {
        borderRadius: 8,
        padding: '6px 16px',
        fontSize: 13,
        marginRight: 8,
        color: text
      },
      buttonSkip: {
        fontSize: 12,
        color: text,
        opacity: 0.6
      },
      buttonClose: {
        color: text
      },
      spotlight: {
        borderRadius: 8,
        border: `2px solid ${btnHover}`
      },
      tooltipTitle: {
        color: text,
        fontSize: 15,
        fontWeight: 600
      }
    }
  }, [isDark])

  const [styles, setStyles] = useState(buildStyles)

  useEffect(() => {
    // 监听 :root class 变化（dark 切换）及 CSS 变量变化
    const observer = new MutationObserver(() => setStyles(buildStyles()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    })
    return () => observer.disconnect()
  }, [buildStyles])

  return styles
}

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
  const [filteredSteps, setFilteredSteps] = useState(steps)
  const joyrideStyles = useJoyrideThemeStyles()

  // 引导回调函数
  const handleJoyrideCallback = (data: { action: string; index: number; type: string }) => {
    if (data.type == 'tour:end') {
      // 跳过或完成，都持久化记住
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
      // 延迟等待 DOM 渲染完成，再过滤掉不存在的目标元素
      const timer = setTimeout(() => {
        const available = steps.filter(s => document.querySelector(s.target))
        if (available.length > 0) {
          setFilteredSteps(available)
          setStep(1)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [stepIndex])

  return (
    <Joyride
      steps={step == -1 ? [] : filteredSteps}
      run={step == -1 ? false : true}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableScrolling={true}
      locale={{
        skip: '不再显示',
        next: '下一步',
        back: '上一步',
        last: '完成',
        close: '关闭'
      }}
      styles={joyrideStyles}
    />
  )
}

