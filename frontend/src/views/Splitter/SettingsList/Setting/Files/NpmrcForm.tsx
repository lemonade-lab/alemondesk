import { useEffect, useState } from 'react'
import { useNotification } from '@/context/Notification'
import { Button, Input, PrimaryDiv } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'

type NpmrcEntry = {
  key: string
  value: string
}

/**
 * 将 .npmrc 内容解析为 key=value 数组
 */
function parseNpmrc(content: string): NpmrcEntry[] {
  if (!content.trim()) return []
  return content
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=')
      if (idx === -1) return { key: line.trim(), value: '' }
      return { key: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() }
    })
}

/**
 * 将 key=value 数组序列化回 .npmrc 格式
 */
function serializeNpmrc(entries: NpmrcEntry[]): string {
  return entries
    .filter(e => e.key.trim())
    .map(e => `${e.key}=${e.value}`)
    .join('\n')
}

type Props = {
  dir: string
}

export default function NpmrcForm({ dir }: Props) {
  const notification = useNotification()
  const [entries, setEntries] = useState<NpmrcEntry[]>([])
  const [saved, setSaved] = useState(true)

  const loadData = async () => {
    const exists = await AppExists(dir)
    if (!exists) {
      setEntries([])
      return
    }
    const content = await AppReadFiles(dir)
    if (content) {
      setEntries(parseNpmrc(content))
    }
    setSaved(true)
  }

  useEffect(() => {
    loadData()
  }, [dir])

  const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...entries]
    next[index] = { ...next[index], [field]: val }
    setEntries(next)
    setSaved(false)
  }

  const addEntry = () => {
    setEntries([...entries, { key: '', value: '' }])
    setSaved(false)
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
    setSaved(false)
  }

  const onSave = async () => {
    const content = serializeNpmrc(entries)
    const ok = await AppWriteFiles(dir, content)
    if (ok) {
      setSaved(true)
      notification('保存成功')
    } else {
      notification('保存失败', 'error')
    }
  }

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 overflow-auto">
      <PrimaryDiv className="flex flex-col flex-1 p-6 rounded-lg shadow-inner">
        <div className="flex items-center justify-between mb-4 border-b border-secondary-border dark:border-dark-secondary-border pb-2">
          <div className="text-xl font-semibold">NPM 配置 (.npmrc)</div>
          <div className="flex gap-2">
            <Button className="px-2 rounded-md" onClick={addEntry}>
              添加
            </Button>
            <Button className="px-2 rounded-md" onClick={onSave} disabled={saved}>
              保存
            </Button>
          </div>
        </div>
        <div className="text-sm text-secondary-text mb-4">
          配置 npm 镜像源等选项，例如 registry=https://registry.npmmirror.com
        </div>
        <div className="flex flex-col gap-3">
          {entries.length === 0 && (
            <div className="text-secondary-text text-center py-4">
              暂无配置项，点击"添加"新增
            </div>
          )}
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={entry.key}
                onChange={e => updateEntry(index, 'key', e.target.value)}
                className="w-40 px-2 rounded-md"
                placeholder="配置名"
              />
              <span>=</span>
              <Input
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={entry.value}
                onChange={e => updateEntry(index, 'value', e.target.value)}
                className="flex-1 px-2 rounded-md"
                placeholder="配置值"
              />
              <Button className="px-2 rounded-md" onClick={() => removeEntry(index)}>
                删除
              </Button>
            </div>
          ))}
        </div>
      </PrimaryDiv>
    </div>
  )
}
