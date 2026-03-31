import { useNotification } from '@/context/Notification'
import { useState, useEffect } from 'react'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import { ChatGetConfig, ChatSetConfig } from '@wailsjs/window/chat/app'
import GuideAISettings from '@/views/Guide/AISettings'

interface AIConfig {
  apiEndpoint: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

const defaultConfig: AIConfig = {
  apiEndpoint: 'http://localhost:11434/v1/chat/completions',
  apiKey: '',
  model: 'qwen2.5',
  maxTokens: 2048,
  temperature: 0.7
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
  [key: string]: any
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-40 text-sm shrink-0">{label}</div>
        <Input
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2 rounded-md"
          placeholder={placeholder}
          {...rest}
        />
      </div>
      {hint && <div className="text-xs text-secondary-text ml-[168px]">{hint}</div>}
    </div>
  )
}

const AISettings = () => {
  const notification = useNotification()
  const [config, setConfig] = useState<AIConfig>(defaultConfig)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    ChatGetConfig()
      .then(cfg => {
        setConfig(prev => ({ ...prev, ...cfg }))
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    try {
      await ChatSetConfig(config)
      setSaved(true)
      notification('AI 配置已保存')
    } catch {
      notification('保存失败', 'error')
    }
  }

  const update = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="steps-ai-panel animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">AI 设置</div>
              <Button className="px-3 rounded-md" onClick={handleSave} disabled={saved}>
                保存
              </Button>
            </div>
            <div className="text-sm text-secondary-text -mt-2">
              配置 AI 对话模型接口，保存后立即生效
            </div>

            {/* 接口配置 */}
            <Field
              label="API 地址"
              value={config.apiEndpoint}
              onChange={v => update('apiEndpoint', v)}
              placeholder="http://localhost:11434/v1/chat/completions"
              hint="支持 OpenAI 兼容接口（Ollama / LM Studio / vLLM / OpenAI 等）"
            />
            <Field
              label="API Key"
              value={config.apiKey}
              onChange={v => update('apiKey', v)}
              placeholder="可留空（本地模型无需 Key）"
              type="password"
              hint="本地服务（Ollama 等）无需填写，仅远程 API 需要"
            />
            <Field
              label="模型"
              value={config.model}
              onChange={v => update('model', v)}
              placeholder="qwen2.5"
              hint="如 qwen2.5、llama3、deepseek-r1、gpt-4o 等"
            />
            <Field
              label="最大 Tokens"
              value={String(config.maxTokens)}
              onChange={v => update('maxTokens', parseInt(v) || 2048)}
              placeholder="2048"
              type="number"
              hint="单次对话允许的最大 Token 数"
            />
            <Field
              label="Temperature"
              value={String(config.temperature)}
              onChange={v => update('temperature', parseFloat(v) || 0.7)}
              placeholder="0.7"
              type="number"
              step="0.1"
              min="0"
              max="2"
              hint="值越高回答越随机，越低越确定（0-2）"
            />
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
      <GuideAISettings />
    </section>
  )
}

export default AISettings
