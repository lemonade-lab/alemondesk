import { Input } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'
import YAML from 'js-yaml'

export type Config = {
  login: string
  port: string
  serverPort: string
}

export const initialRunConfig: Config = {
  login: '',
  port: '',
  serverPort: ''
}

/** 从 alemon.config.yaml 读取启动配置 */
export const getRunConfig = async (configPath: string): Promise<Config> => {
  try {
    const exists = await AppExists(configPath)
    if (!exists) return initialRunConfig
    const content = await AppReadFiles(configPath)
    if (!content) return initialRunConfig
    const raw = (YAML.load(content) ?? {}) as Record<string, unknown>
    return {
      login: String(raw.login ?? ''),
      port: raw.port != null ? String(raw.port) : '',
      serverPort: raw.serverPort != null ? String(raw.serverPort) : ''
    }
  } catch {
    return initialRunConfig
  }
}

/** 将启动配置写回 alemon.config.yaml（保留其他字段） */
export const setRunConfig = async (config: Config, configPath: string) => {
  try {
    let raw: Record<string, unknown> = {}
    const exists = await AppExists(configPath)
    if (exists) {
      const content = await AppReadFiles(configPath)
      if (content) {
        raw = (YAML.load(content) ?? {}) as Record<string, unknown>
      }
    }
    // 更新字段
    if (config.login) {
      raw.login = config.login
    } else {
      delete raw.login
    }
    if (config.port) {
      raw.port = Number(config.port) || config.port
    } else {
      delete raw.port
    }
    if (config.serverPort) {
      raw.serverPort = Number(config.serverPort) || config.serverPort
    } else {
      delete raw.serverPort
    }
    const yamlStr = YAML.dump(raw, { indent: 2, lineWidth: -1 })
    await AppWriteFiles(configPath, yamlStr)
  } catch (e) {
    console.error('保存启动配置失败', e)
  }
}

const RunForm = ({
  value: fromValue,
  onChange
}: {
  value: Config
  onChange: (value: Config) => void
}) => {
  return (
    <form className="flex flex-col gap-4" onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
    }}>
      <div className="flex items-center gap-2">
        <div className=" w-24">登录名</div>
        <Input
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          value={fromValue.login}
          onChange={e => onChange({ ...fromValue, login: e.target.value })}
          className="w-full px-2 rounded-md"
          placeholder="例: qq-bot"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className=" w-24">协议端口</div>
        <Input
          value={fromValue.port}
          type="number"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={e => {
            const val = e.target.value
            if (val === '') {
              onChange({ ...fromValue, port: '' })
              return
            }
            const num = Number(val)
            if (num < 0 || num > 65535) return
            onChange({ ...fromValue, port: val })
          }}
          className="w-full px-2 rounded-md"
          placeholder="可选，默认不开放外部互联"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className=" w-24">应用端口</div>
        <Input
          value={fromValue.serverPort}
          type="number"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={e => {
            const val = e.target.value
            if (val === '') {
              onChange({ ...fromValue, serverPort: '' })
              return
            }
            const num = Number(val)
            if (num < 0 || num > 65535) return
            onChange({ ...fromValue, serverPort: val })
          }}
          className="w-full px-2 rounded-md"
          placeholder="可选，默认不启动扩展Web"
        />
      </div>
    </form>
  )
}

export default RunForm
