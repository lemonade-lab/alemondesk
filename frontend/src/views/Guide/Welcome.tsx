import { useEffect, useState } from 'react'
import { PrimaryDiv, SecondaryDiv, Button } from '@alemonjs/react-ui'
import {
  RocketOutlined,
  AppstoreAddOutlined,
  MessageOutlined,
  SettingOutlined,
  RobotOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'

const WELCOME_KEY = 'ALEMON_WELCOME_v1'
const WELCOME_VALUE = '1'

const features = [
  {
    icon: <MessageOutlined style={{ fontSize: 28 }} />,
    title: 'AI 智能助手',
    desc: '通过自然语言与 AI 对话，轻松管理机器人'
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28 }} />,
    title: '机器人管理',
    desc: '一键启动、停止机器人，实时查看运行日志'
  },
  {
    icon: <AppstoreAddOutlined style={{ fontSize: 28 }} />,
    title: '扩展市场',
    desc: '浏览和安装丰富的扩展，扩展机器人功能'
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 28 }} />,
    title: '应用管理',
    desc: '查看和操作已安装的应用，管理侧边栏'
  },
  {
    icon: <SettingOutlined style={{ fontSize: 28 }} />,
    title: '个性化配置',
    desc: '自定义主题、配置参数，打造专属体验'
  },
  {
    icon: <RocketOutlined style={{ fontSize: 28 }} />,
    title: '快速上手',
    desc: '完善的引导系统，帮助你快速了解所有功能'
  }
]

export default function Welcome({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0) // 0: welcome, 1: features
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(WELCOME_KEY)
    if (!stored || stored !== WELCOME_VALUE) {
      setVisible(true)
    }
  }, [])

  const handleNext = () => {
    setFadeIn(false)
    setTimeout(() => {
      setStep(1)
      setFadeIn(true)
    }, 300)
  }

  const handleFinish = () => {
    localStorage.setItem(WELCOME_KEY, WELCOME_VALUE)
    setFadeIn(false)
    setTimeout(() => {
      setVisible(false)
      onFinish()
    }, 300)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center welcome-overlay">
      <PrimaryDiv
        className={`relative w-[560px] max-w-[90vw] rounded-2xl overflow-hidden transition-all duration-300 welcome-card ${
          fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {step === 0 ? (
          /* 欢迎页 */
          <div className="flex flex-col items-center py-12 px-8 gap-6">
            {/* Logo */}
            <div className="welcome-logo-wrap flex items-center justify-center w-20 h-20 rounded-2xl">
              <span className="text-3xl font-bold" style={{ color: 'var(--alemonjs-button-text)' }}>A</span>
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-primary-text dark:text-dark-primary-text">
                欢迎使用 ALemon Desk
              </h1>
              <p className="text-sm text-secondary-text dark:text-dark-secondary-text max-w-sm">
                一站式机器人管理桌面应用，集成 AI 助手、扩展市场、实时日志等强大功能
              </p>
            </div>

            <Button
              onClick={handleNext}
              className="mt-4 px-8 py-2.5 rounded-full font-medium text-sm welcome-primary-btn"
            >
              了解功能
            </Button>

            <button
              onClick={handleFinish}
              className="text-xs text-secondary-text dark:text-dark-secondary-text opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
            >
              跳过引导，直接开始
            </button>
          </div>
        ) : (
          /* 功能介绍页 */
          <div className="flex flex-col py-8 px-8 gap-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-primary-text dark:text-dark-primary-text">
                核心功能
              </h2>
              <p className="text-xs text-secondary-text dark:text-dark-secondary-text opacity-60">
                以下是 ALemon Desk 的主要功能模块
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <SecondaryDiv
                  key={i}
                  className="welcome-feature-card flex items-start gap-3 p-3 rounded-xl border transition-all duration-200"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    animation: 'fadeInUp 0.4s ease-out both'
                  }}
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg welcome-feature-icon flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary-text dark:text-dark-primary-text">
                      {f.title}
                    </div>
                    <div className="text-xs text-secondary-text dark:text-dark-secondary-text opacity-60 mt-0.5">
                      {f.desc}
                    </div>
                  </div>
                </SecondaryDiv>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-2">
              <Button
                onClick={() => {
                  setFadeIn(false)
                  setTimeout(() => {
                    setStep(0)
                    setFadeIn(true)
                  }, 300)
                }}
                className="px-6 py-2 rounded-full text-sm"
              >
                上一步
              </Button>
              <Button
                onClick={handleFinish}
                className="px-8 py-2 rounded-full font-medium text-sm welcome-primary-btn"
              >
                开始使用
              </Button>
            </div>
          </div>
        )}
      </PrimaryDiv>
    </div>
  )
}
