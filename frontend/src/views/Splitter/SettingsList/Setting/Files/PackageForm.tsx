import { useEffect, useState } from 'react'
import { useNotification } from '@/context/Notification'
import { Button, Input, PrimaryDiv } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'

type Dependency = {
  name: string
  version: string
}

type Props = {
  dir: string
}

export default function PackageForm({ dir }: Props) {
  const notification = useNotification()
  const [deps, setDeps] = useState<Dependency[]>([])
  const [rawJson, setRawJson] = useState<Record<string, any>>({})
  const [saved, setSaved] = useState(true)

  const loadData = async () => {
    const exists = await AppExists(dir)
    if (!exists) {
      notification('package.json 不存在')
      return
    }
    const content = await AppReadFiles(dir)
    if (content) {
      try {
        const json = JSON.parse(content)
        setRawJson(json)
        const dependencies = json.dependencies || {}
        setDeps(
          Object.entries(dependencies).map(([name, version]) => ({
            name,
            version: version as string
          }))
        )
      } catch {
        notification('package.json 解析失败', 'error')
      }
    }
    setSaved(true)
  }

  useEffect(() => {
    loadData()
  }, [dir])

  const updateDep = (index: number, field: 'name' | 'version', val: string) => {
    const next = [...deps]
    next[index] = { ...next[index], [field]: val }
    setDeps(next)
    setSaved(false)
  }

  const addDep = () => {
    setDeps([...deps, { name: '', version: 'latest' }])
    setSaved(false)
  }

  const removeDep = (index: number) => {
    setDeps(deps.filter((_, i) => i !== index))
    setSaved(false)
  }

  const onSave = async () => {
    const dependencies: Record<string, string> = {}
    for (const dep of deps) {
      const name = dep.name.trim()
      if (!name) continue
      dependencies[name] = dep.version.trim() || 'latest'
    }
    const newJson = { ...rawJson, dependencies }
    const content = JSON.stringify(newJson, null, 2)
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
          <div className="text-xl font-semibold">插件管理</div>
          <div className="flex gap-2">
            <Button className="px-2 rounded-md" onClick={addDep}>
              添加插件
            </Button>
            <Button className="px-2 rounded-md" onClick={onSave} disabled={saved}>
              保存
            </Button>
          </div>
        </div>
        <div className="text-sm text-secondary-text mb-4">
          管理机器人使用的插件，保存后请重启应用生效
        </div>
        <div className="flex flex-col gap-3">
          {deps.length === 0 && (
            <div className="text-secondary-text text-center py-4">
              暂无插件，点击"添加插件"新增
            </div>
          )}
          {deps.map((dep, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={dep.name}
                onChange={e => updateDep(index, 'name', e.target.value)}
                className="flex-1 px-2 rounded-md"
                placeholder="包名，例: @alemonjs/qq-bot"
              />
              <Input
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={dep.version}
                onChange={e => updateDep(index, 'version', e.target.value)}
                className="w-32 px-2 rounded-md"
                placeholder="版本号"
              />
              <Button className="px-2 rounded-md" onClick={() => removeDep(index)}>
                删除
              </Button>
            </div>
          ))}
        </div>
      </PrimaryDiv>
    </div>
  )
}
