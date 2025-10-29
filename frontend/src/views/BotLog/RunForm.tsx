import _ from 'lodash'
import { Input } from '@alemonjs/react-ui'

const RUN_CONFIG = 'RUN_CONFIG'

export type Config = {
  login: string
  port: number
  serverPort: number
}

export const initialRunConfig: Config = {
  login: '',
  port: 17117,
  serverPort: 18110
}

// 得到json
export const getRunConfig = () => {
  const value = localStorage.getItem(RUN_CONFIG)
  if (value) {
    try {
      return JSON.parse(value)
    } catch {
      return initialRunConfig
    }
  }
  return initialRunConfig
}

export const setRunConfig = (config: Config) => {
  localStorage.setItem(RUN_CONFIG, JSON.stringify(config))
}

const RunForm = ({
  value: fromValue,
  onChange
}: {
  value: Config
  onChange: (value: Config) => void
}) => {
  const onValueChange = (value: Config) => {
    // 端口不能一样
    if (value.port === value.serverPort) {
      return
    }
    onChange(value)
  }
  return (
    <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
      <div className="flex items-center gap-2">
        <div className=" w-24">登录名</div>
        <Input
          value={fromValue.login}
          onChange={e => onValueChange({ ...fromValue, login: e.target.value })}
          className="w-full px-2 rounded-md"
          placeholder="例：discord (空为开发模式)"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className=" w-24">协议端口</div>
        <Input
          value={fromValue.port}
          type="number"
          onChange={e => {
            const value = Number(e.target.value)
            if (value < 0) {
              onValueChange({ ...fromValue, port: 0 })
              return
            }
            if (value > 65535) {
              onValueChange({ ...fromValue, port: 65535 })
              return
            }
            onValueChange({ ...fromValue, port: value })
          }}
          className="w-full px-2 rounded-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className=" w-24">应用端口</div>
        <Input
          value={fromValue.serverPort}
          type="number"
          onChange={e => {
            const value = Number(e.target.value)
            if (value < 0) {
              onValueChange({ ...fromValue, serverPort: 0 })
              return
            }
            if (value > 65535) {
              onValueChange({ ...fromValue, serverPort: 65535 })
              return
            }
            onValueChange({ ...fromValue, serverPort: value })
          }}
          className="w-full px-2 rounded-md"
        />
      </div>
    </form>
  )
}

export default RunForm
