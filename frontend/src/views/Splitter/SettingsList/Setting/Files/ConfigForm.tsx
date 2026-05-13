import { useEffect, useState, useCallback } from 'react'
import { useNotification } from '@/context/Notification'
import { Button, Input, PrimaryDiv, Select } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'
import YAML from 'js-yaml'

// ====== 类型定义 ======

type MappingTextItem = { regular: string; target: string }

/** 表单状态 */
type FormState = {
  // 基础配置
  login: string
  port: string
  serverPort: string
  input: string
  url: string
  is_full_receive: boolean
  // 权限管理
  master_id: string[]
  master_key: string[]
  bot_id: string[]
  bot_key: string[]
  // 消息过滤
  disabled_text_regular: string
  disabled_selects: Record<string, boolean>
  disabled_user_id: string[]
  disabled_user_key: string[]
  redirect_text_regular: string
  redirect_text_target: string
  mapping_text: MappingTextItem[]
  // 处理器
  repeated_event_time: string
  repeated_user_time: string
}

const defaultState: FormState = {
  login: '',
  port: '',
  serverPort: '',
  input: '',
  url: '',
  is_full_receive: false,
  master_id: [],
  master_key: [],
  bot_id: [],
  bot_key: [],
  disabled_text_regular: '',
  disabled_selects: {},
  disabled_user_id: [],
  disabled_user_key: [],
  redirect_text_regular: '',
  redirect_text_target: '',
  mapping_text: [],
  repeated_event_time: '',
  repeated_user_time: ''
}

// 事件类型选项
const EVENT_TYPES = [
  { key: 'private.message.create', label: '私聊消息' },
  { key: 'message.create', label: '群组消息' },
  { key: 'interaction.create', label: '交互事件' },
  { key: 'private.interaction.create', label: '私聊交互事件' },
]

const LOGIN_PLATFORM_OPTIONS = [
  { label: '自定义', value: '' },
  { label: 'QQ Bot', value: 'qq-bot' },
  { label: 'OneBot', value: 'onebot' },
  { label: 'Discord', value: 'discord' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'KOOK', value: 'kook' }
]

// ====== 工具函数 ======

/** 从 {key: true} map 提取 key 列表 */
function mapToList(map: unknown): string[] {
  if (!map || typeof map !== 'object') return []
  return Object.keys(map as Record<string, unknown>)
}

/** 从 key 列表构建 {key: true} map */
function listToMap(list: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  list.forEach(k => {
    const trimmed = k.trim()
    if (trimmed) map[trimmed] = true
  })
  return map
}

/** 从 YAML 原始数据解析为 FormState */
function parseConfig(raw: Record<string, unknown>): FormState {
  const processor = (raw.processor ?? {}) as Record<string, unknown>
  return {
    login: String(raw.login ?? ''),
    port: raw.port != null ? String(raw.port) : '',
    serverPort: raw.serverPort != null ? String(raw.serverPort) : '',
    input: String(raw.input ?? ''),
    url: String(raw.url ?? ''),
    is_full_receive: raw.is_full_receive === true || raw.is_full_receive === 'true' || raw.is_full_receive === '1',
    master_id: mapToList(raw.master_id),
    master_key: mapToList(raw.master_key),
    bot_id: mapToList(raw.bot_id),
    bot_key: mapToList(raw.bot_key),
    disabled_text_regular: String(raw.disabled_text_regular ?? ''),
    disabled_selects: (raw.disabled_selects ?? {}) as Record<string, boolean>,
    disabled_user_id: mapToList(raw.disabled_user_id),
    disabled_user_key: mapToList(raw.disabled_user_key),
    redirect_text_regular: String(raw.redirect_text_regular ?? ''),
    redirect_text_target: String(raw.redirect_text_target ?? ''),
    mapping_text: Array.isArray(raw.mapping_text)
      ? raw.mapping_text.map((m: any) => ({ regular: String(m.regular ?? ''), target: String(m.target ?? '') }))
      : [],
    repeated_event_time: processor.repeated_event_time != null ? String(processor.repeated_event_time) : '',
    repeated_user_time: processor.repeated_user_time != null ? String(processor.repeated_user_time) : ''
  }
}

/** 将 FormState 合并回原始 YAML 数据（保留未知字段如模块配置） */
function serializeConfig(form: FormState, rawConfig: Record<string, unknown>): string {
  const result: Record<string, unknown> = { ...rawConfig }

  // 已知字段列表 — 先清除再按需写入
  const knownKeys = [
    'login', 'port', 'serverPort', 'input', 'url', 'is_full_receive',
    'master_id', 'master_key', 'bot_id', 'bot_key',
    'disabled_text_regular', 'disabled_selects', 'disabled_user_id', 'disabled_user_key',
    'redirect_text_regular', 'redirect_text_target', 'mapping_text', 'processor'
  ]
  knownKeys.forEach(k => delete result[k])

  // 基础配置 — 非空才写入
  if (form.login) result.login = form.login
  if (form.port) result.port = Number(form.port) || form.port
  if (form.serverPort) result.serverPort = Number(form.serverPort) || form.serverPort
  if (form.input) result.input = form.input
  if (form.url) result.url = form.url
  if (form.is_full_receive) result.is_full_receive = true

  // 权限管理
  if (form.master_id.length) result.master_id = listToMap(form.master_id)
  if (form.master_key.length) result.master_key = listToMap(form.master_key)
  if (form.bot_id.length) result.bot_id = listToMap(form.bot_id)
  if (form.bot_key.length) result.bot_key = listToMap(form.bot_key)

  // 消息过滤
  if (form.disabled_text_regular) result.disabled_text_regular = form.disabled_text_regular
  const activeSel = Object.entries(form.disabled_selects).filter(([, v]) => v)
  if (activeSel.length) {
    result.disabled_selects = Object.fromEntries(activeSel)
  }
  if (form.disabled_user_id.length) result.disabled_user_id = listToMap(form.disabled_user_id)
  if (form.disabled_user_key.length) result.disabled_user_key = listToMap(form.disabled_user_key)
  if (form.redirect_text_regular) result.redirect_text_regular = form.redirect_text_regular
  if (form.redirect_text_target) result.redirect_text_target = form.redirect_text_target
  const validMappings = form.mapping_text.filter(m => m.regular.trim() || m.target.trim())
  if (validMappings.length) result.mapping_text = validMappings

  // 处理器
  const processor: Record<string, unknown> = {}
  if (form.repeated_event_time) processor.repeated_event_time = Number(form.repeated_event_time) || 60000
  if (form.repeated_user_time) processor.repeated_user_time = Number(form.repeated_user_time) || 1000
  if (Object.keys(processor).length) result.processor = processor

  return YAML.dump(result, { indent: 2, lineWidth: -1, quotingType: "'", forceQuotes: false })
}

// ====== 子组件 ======

/** 可添加/删除的字符串列表 */
function StringListField({
  label,
  hint,
  placeholder,
  items,
  onChange
}: {
  label: string
  hint?: string
  placeholder?: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="text-xs text-secondary-text">{hint}</div>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            value={item}
            onChange={e => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            className="flex-1 px-2 rounded-md"
            placeholder={placeholder}
          />
          <Button
            className="px-2 rounded-md"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            删除
          </Button>
        </div>
      ))}
      <div>
        <Button className="px-2 rounded-md" onClick={() => onChange([...items, ''])}>
          添加
        </Button>
      </div>
    </div>
  )
}

/** 折叠区块 */
function Section({
  title,
  defaultOpen = true,
  className,
  children
}: {
  title: string
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`border border-secondary-border dark:border-dark-secondary-border rounded-lg overflow-hidden${className ? ` ${className}` : ''}`}>
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer select-none bg-secondary-bg dark:bg-dark-secondary-bg"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-secondary-text">{open ? '收起 ▲' : '展开 ▼'}</span>
      </div>
      {open && <div className="flex flex-col gap-4 p-4">{children}</div>}
    </div>
  )
}

/** 单行输入字段 */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
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
        />
      </div>
      {hint && <div className="text-xs text-secondary-text ml-[168px]">{hint}</div>}
    </div>
  )
}

function LoginField({
  label,
  value,
  onChange,
  placeholder,
  hint
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-40 text-sm shrink-0">{label}</div>
        <div className="flex flex-1 gap-2">
          <Select
            className="w-36 rounded-md"
            value={
              LOGIN_PLATFORM_OPTIONS.some(item => item.value === value)
                ? value
                : ''
            }
            onChange={(e: any) => onChange(e.target?.value ?? '')}
          >
            {LOGIN_PLATFORM_OPTIONS.map(item => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-2 rounded-md"
            placeholder={placeholder}
          />
        </div>
      </div>
      {hint && <div className="text-xs text-secondary-text ml-[168px]">{hint}</div>}
    </div>
  )
}

// ====== 主组件 ======

type Props = { dir: string }

export default function ConfigForm({ dir }: Props) {
  const notification = useNotification()
  const [form, setForm] = useState<FormState>({ ...defaultState })
  const [rawConfig, setRawConfig] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState(true)

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  // 加载
  const loadData = async () => {
    const exists = await AppExists(dir)
    if (!exists) {
      notification('配置文件不存在')
      return
    }
    const content = await AppReadFiles(dir)
    if (content) {
      try {
        const raw = (YAML.load(content) ?? {}) as Record<string, unknown>
        setRawConfig(raw)
        setForm(parseConfig(raw))
      } catch {
        notification('配置文件解析失败', 'error')
      }
    }
    setSaved(true)
  }

  useEffect(() => {
    loadData()
  }, [dir])

  // 保存
  const onSave = async () => {
    const yamlStr = serializeConfig(form, rawConfig)
    const ok = await AppWriteFiles(dir, yamlStr)
    if (ok) {
      setSaved(true)
      // 更新原始数据
      try {
        setRawConfig((YAML.load(yamlStr) ?? {}) as Record<string, unknown>)
      } catch { /* ignore */ }
      notification('保存成功')
    } else {
      notification('保存失败', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
      <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
          <div className="text-xl font-semibold">机器人配置</div>
          <Button className="px-3 rounded-md" onClick={onSave} disabled={saved}>
            保存
          </Button>
        </div>
        {/* ===== 基础配置 ===== */}
        <Section title="基础配置" className="steps-config-basic">
          <LoginField
            label="登录平台"
            value={form.login}
            onChange={v => update('login', v)}
            placeholder="例: discord / qq-bot / telegram / onebot / @alemonjs/qq-bot"
            hint="选择机器人连接的平台"
          />
          <Field
            label="CBP 端口"
            value={form.port}
            onChange={v => update('port', v)}
            placeholder="可选，默认0不启动，推荐17117"
            type="number"
            hint="与平台协议通信的端口"
          />
          <Field
            label="应用端口"
            value={form.serverPort}
            onChange={v => update('serverPort', v)}
            placeholder="可选，默认0不启动，推荐18118"
            type="number"
            hint="启动 Web 服务时使用的端口"
          />
          <Field
            label="CBP 地址"
            value={form.url}
            onChange={v => update('url', v)}
            placeholder="可选，默认 ws://127.0.0.1:17117"
            hint="CBP 服务器连接地址"
          />
        </Section>

        {/* ===== 权限管理 ===== */}
        <Section title="权限管理" className="steps-config-permission" defaultOpen={false}>
          <StringListField
            label="管理员 Key"
            hint="设置拥有管理员权限的用户Key"
            placeholder="输入用户Key"
            items={form.master_key}
            onChange={v => update('master_key', v)}
          />
          <StringListField
            label="机器人 Key"
            hint="将指定用户标识为机器人"
            placeholder="输入用户Key"
            items={form.bot_key}
            onChange={v => update('bot_key', v)}
          />
          <StringListField
            label="管理员 ID"
            hint="设置拥有管理员权限的用户ID"
            placeholder="输入用户ID"
            items={form.master_id}
            onChange={v => update('master_id', v)}
          />
          <StringListField
            label="机器人 ID"
            hint="将指定用户标识为机器人"
            placeholder="输入用户ID"
            items={form.bot_id}
            onChange={v => update('bot_id', v)}
          />
        </Section>

        {/* ===== 消息过滤 ===== */}
        <Section title="消息过滤" className="steps-config-filter" defaultOpen={false}>
          <Field
            label="禁用文本正则"
            value={form.disabled_text_regular}
            onChange={v => update('disabled_text_regular', v)}
            placeholder="例: /闭关"
            hint="匹配到该正则时禁用所有功能"
          />
          {/* 事件类型开关 */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">禁用事件类型</div>
            <div className="text-xs text-secondary-text">选择要禁用的消息类型</div>
            {EVENT_TYPES.map(evt => (
              <label key={evt.key} className="flex items-center gap-2 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={!!form.disabled_selects[evt.key]}
                  onChange={e => {
                    const next = { ...form.disabled_selects }
                    if (e.target.checked) {
                      next[evt.key] = true
                    } else {
                      delete next[evt.key]
                    }
                    update('disabled_selects', next)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{evt.label}</span>
                <span className="text-xs text-secondary-text">({evt.key})</span>
              </label>
            ))}
          </div>
          <StringListField
            label="禁用用户 ID"
            hint="这些用户的消息将被忽略"
            placeholder="输入用户ID"
            items={form.disabled_user_id}
            onChange={v => update('disabled_user_id', v)}
          />
          <StringListField
            label="禁用用户 Key"
            hint="这些用户的消息将被忽略"
            placeholder="输入用户Key"
            items={form.disabled_user_key}
            onChange={v => update('disabled_user_key', v)}
          />
          <Field
            label="重定向正则"
            value={form.redirect_text_regular}
            onChange={v => update('redirect_text_regular', v)}
            placeholder="例: ^#"
            hint="匹配文本前缀的正则表达式"
          />
          <Field
            label="重定向目标"
            value={form.redirect_text_target}
            onChange={v => update('redirect_text_target', v)}
            placeholder="例: /"
            hint="将匹配的前缀替换为此内容"
          />
          {/* 文本映射 */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">文本映射规则</div>
            <div className="text-xs text-secondary-text">将用户发送的文本替换为其他内容</div>
            {form.mapping_text.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={m.regular}
                  onChange={e => {
                    const next = [...form.mapping_text]
                    next[i] = { ...next[i], regular: e.target.value }
                    update('mapping_text', next)
                  }}
                  className="flex-1 px-2 rounded-md"
                  placeholder="匹配文本"
                />
                <span className="text-secondary-text">→</span>
                <Input
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={m.target}
                  onChange={e => {
                    const next = [...form.mapping_text]
                    next[i] = { ...next[i], target: e.target.value }
                    update('mapping_text', next)
                  }}
                  className="flex-1 px-2 rounded-md"
                  placeholder="替换文本"
                />
                <Button
                  className="px-2 rounded-md"
                  onClick={() => update('mapping_text', form.mapping_text.filter((_, idx) => idx !== i))}
                >
                  删除
                </Button>
              </div>
            ))}
            <div>
              <Button
                className="px-2 rounded-md"
                onClick={() => update('mapping_text', [...form.mapping_text, { regular: '', target: '' }])}
              >
                添加规则
              </Button>
            </div>
          </div>
        </Section>

        {/* ===== 处理器配置 ===== */}
        <Section title="处理器配置" defaultOpen={false}>
          <Field
            label="重复消息过滤"
            value={form.repeated_event_time}
            onChange={v => update('repeated_event_time', v)}
            placeholder="默认 60000"
            type="number"
            hint="过滤相同 MessageId 的时间窗口（毫秒）"
          />
          <Field
            label="连续消息过滤"
            value={form.repeated_user_time}
            onChange={v => update('repeated_user_time', v)}
            placeholder="默认 1000"
            type="number"
            hint="过滤同一用户连续消息的时间窗口（毫秒）"
          />
        </Section>
      </PrimaryDiv>
    </div>
  )
}
