import { useNotification } from '@/context/Notification'
import { useState, useEffect } from 'react'
import { Button, PrimaryDiv } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import Box from '@/common/layout/Box'
import { ChatGetConfig, ChatSetConfig } from '@wailsjs/window/chat/app'

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

const AISettings = () => {
  const notification = useNotification()
  const [config, setConfig] = useState<AIConfig>(defaultConfig)

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
      notification('AI 配置已保存')
    } catch {
      notification('保存失败', 'error')
    }
  }

  return (
    <Box className="animate__animated animate__fadeIn flex-1 flex-col flex size-full">
      <div className="flex-col gap-2 flex-1 flex p-4 size-full">
        <PrimaryDiv className="flex flex-col flex-1 p-2 rounded-lg shadow-inner size-full">
          <div
            className="text-2xl flex items-center justify-between font-semibold mb-4 border-b
            border-secondary-border
            dark:border-dark-secondary-border
          "
          >
            <div>AI 设置</div>
            <div className="flex gap-2 items-center">
              <Button
                className="text-base px-2 rounded-lg"
                onClick={handleSave}
              >
                <div>保存</div>
              </Button>
            </div>
          </div>
          <Box className="gap-4 p-2">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">API 地址</div>
              <Input
                value={config.apiEndpoint}
                onChange={e =>
                  setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))
                }
                className="w-full px-2 rounded-md"
                placeholder="http://localhost:11434/v1/chat/completions"
              />
              <div className="text-xs opacity-50">支持 OpenAI 兼容的 API 接口（Ollama / LM Studio / vLLM / OpenAI 等）</div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">API Key</div>
              <Input
                type="password"
                value={config.apiKey}
                onChange={e =>
                  setConfig(prev => ({ ...prev, apiKey: e.target.value }))
                }
                className="w-full px-2 rounded-md"
                placeholder="可留空（本地模型无需 Key）"
              />
              <div className="text-xs opacity-50">本地服务（Ollama 等）无需填写，仅远程 API 需要</div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">模型</div>
              <Input
                value={config.model}
                onChange={e =>
                  setConfig(prev => ({ ...prev, model: e.target.value }))
                }
                className="w-full px-2 rounded-md"
                placeholder="qwen2.5"
              />
              <div className="text-xs opacity-50">如 qwen2.5、llama3、deepseek-r1、gpt-4o 等</div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <div className="text-sm font-medium">最大 Tokens</div>
                <Input
                  type="number"
                  value={String(config.maxTokens)}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value) || 2048
                    }))
                  }
                  className="w-full px-2 rounded-md"
                  placeholder="2048"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="text-sm font-medium">Temperature</div>
                <Input
                  type="number"
                  value={String(config.temperature)}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      temperature: parseFloat(e.target.value) || 0.7
                    }))
                  }
                  className="w-full px-2 rounded-md"
                  placeholder="0.7"
                  step="0.1"
                  min="0"
                  max="2"
                />
              </div>
            </div>
          </Box>
        </PrimaryDiv>
      </div>
    </Box>
  )
}

export default AISettings
