import BaseGuide from './Base'

const KEY = 'FIRST_GUIDE_AISETTINGS_v1'
const KEY_DATA = '1'

const steps = [
  {
    target: '.steps-ai-panel',
    content: '🤖 AI 配置面板：设置 AI 助手的 API 地址、密钥、模型和参数，支持 OpenAI 兼容接口（Ollama / DeepSeek / GPT 等）'
  }
]

export default function GuideAISettings({ stepIndex = 1 }: { stepIndex?: number }) {
  return (
    <BaseGuide steps={steps} stepIndex={stepIndex} stepStoreKey={KEY} stepSessionKey={KEY_DATA} />
  )
}
