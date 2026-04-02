import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNotification } from '@/context/Notification'
import { Button, Input, PrimaryDiv, SecondaryDiv, Select } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { validatePkgVersion } from '@/api'
import { Events } from '@wailsio/runtime'
import { LoadingOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, CodeOutlined, StopOutlined } from '@ant-design/icons'
import Box from '@/common/layout/Box'
import { SystemPackage } from '@/api/config'

const EventsOn = Events.On

 
type Dependency = {
  name: string
  version: string
}

export default function PackageTool() {
  const notification = useNotification()
  const app = useSelector((state: RootState) => state.app)

  const [deps, setDeps] = useState<Dependency[]>([])
  const [rawJson, setRawJson] = useState<Record<string, any>>({})
  const [saved, setSaved] = useState(true)
  const [loading, setLoading] = useState(false)
  const [yarnCmd, setYarnCmd] = useState('')
  const [yarnAction, setYarnAction] = useState('add')
  const [yarnRunning, setYarnRunning] = useState(false)
  const yarnRunningRef = useRef(false)

  const pkgPath = app.userDataPackagePath

  const loadData = async () => {
    if (!pkgPath) return
    setLoading(true)
    try {
      const exists = await AppExists(pkgPath)
      if (!exists) {
        notification('package.json 不存在', 'warning')
        setLoading(false)
        return
      }
      const content = await AppReadFiles(pkgPath)
      if (content) {
        const json = JSON.parse(content)
        setRawJson(json)
        const dependencies = json.dependencies || {}
        setDeps(
          Object.entries(dependencies).map(([name, version]) => ({
            name,
            version: version as string
          }))
        )
      }
      setSaved(true)
    } catch {
      notification('package.json 解析失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pkgPath])

  // 监听 yarn 事件
  useEffect(() => {
    const cancel = EventsOn('yarn', (e: any) => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (!data?.type) return
      if (!yarnRunningRef.current) return

      const type = data.type
      const value = data.value

      if (type === 'cmd') {
        setYarnRunning(false)
        yarnRunningRef.current = false
        if (value === 0) {
          notification('命令执行失败', 'warning')
        } else {
          notification('命令执行完成')
        }
        return
      }

      if (type === 'install') {
        setYarnRunning(false)
        yarnRunningRef.current = false
        if (value === 0) {
          notification('安装依赖失败', 'warning')
        } else {
          notification('安装依赖完成')
        }
        return
      }
    })

    return () => {
      if (cancel) cancel()
    }
  }, [])

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
    const dep = deps[index]
    if (dep && SystemPackage.includes(dep.name.trim())) {
      notification(`${dep.name} 是系统包，禁止删除`, 'warning')
      return
    }
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
    // 检查是否有系统包被移除
    const origDeps = rawJson.dependencies || {}
    const missing = SystemPackage.filter(p => p in origDeps && !(p in dependencies))
    if (missing.length > 0) {
      notification(`系统包 ${missing.join(', ')} 不可移除`, 'warning')
      return
    }

    const newJson = { ...rawJson, dependencies }
    const content = JSON.stringify(newJson, null, 2)
    const ok = await AppWriteFiles(pkgPath, content)
    if (ok) {
      setSaved(true)
      setRawJson(newJson)
      notification('保存成功')
      // 后台校验包版本，不阻塞保存
      const entries = Object.entries(dependencies)
      Promise.all(
        entries.map(([name, ver]) => validatePkgVersion(name, ver))
      ).then(results => {
        const warnings: string[] = []
        results.forEach((r, i) => {
          if (!r.valid) warnings.push(r.error || `${entries[i][0]}@${entries[i][1]} 无效`)
        })
        if (warnings.length > 0) {
          notification('部分依赖版本异常：' + warnings.join('；'), 'warning')
        }
      })
    } else {
      notification('保存失败', 'error')
    }
  }

  const runYarnInstall = () => {
    if (yarnRunning) return
    setYarnRunning(true)
    yarnRunningRef.current = true
    notification('开始安装依赖...')
    YarnCommands({ type: 'install', args: ['--ignore-warnings'] })
  }

  const runYarnCmd = () => {
    const arg = yarnCmd.trim()
    if (!arg || yarnRunning) return
    const fullCmd = `${yarnAction} ${arg}`
    const parts = fullCmd.split(/\s+/)
    const action = parts[0]?.toLowerCase()
    if (action === 'remove' || action === 'uninstall') {
      const targets = parts.slice(1).filter(a => !a.startsWith('-'))
      const blocked = targets.filter(t => SystemPackage.includes(t))
      if (blocked.length > 0) {
        notification(`系统包 ${blocked.join(', ')} 禁止卸载`, 'warning')
        return
      }
    }
    setYarnRunning(true)
    yarnRunningRef.current = true
    notification(`执行: yarn ${fullCmd}`)
    YarnCommands({ type: 'cmd', args: parts })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm opacity-50">
        <LoadingOutlined className="mr-1" /> 加载中...
      </div>
    )
  }

  return (
    <Box className="flex-1 flex flex-col gap-3 px-2">
      {/* Yarn 工具 */}
      <SecondaryDiv className="flex flex-col gap-2 rounded-md">
        <div className='flex gap-2 justify-between'>
            <div className="text-sm font-medium">Yarn工具</div>
        <div className="flex gap-1 flex-wrap">
          <Button
            className="px-2 py-0.5 text-xs rounded-sm flex items-center gap-1"
            onClick={runYarnInstall}
            disabled={yarnRunning}
          >
            {yarnRunning ? <LoadingOutlined /> : <CodeOutlined />} Install
          </Button>
        </div>
        </div>
        <div className="flex items-center gap-1">
          <Select
            value={yarnAction}
            onChange={e => setYarnAction((e.target as HTMLSelectElement).value)}
            className="px-1 py-0.5 rounded-sm text-xs"
          >
            <option value="add">add</option>
            <option value="remove">remove</option>
            <option value="upgrade">upgrade</option>
            <option value="link">link</option>
            <option value="unlink">unlink</option>
            <option value="info">info</option>
            <option value="why">why</option>
          </Select>
          <Input
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            value={yarnCmd}
            onChange={e => setYarnCmd(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runYarnCmd() }}
            className="flex-1 w-full px-2 py-0.5 rounded-sm text-xs"
            placeholder="lodash -W"
          />
          <Button
            className="px-2 py-0.5 text-xs rounded-sm"
            onClick={runYarnCmd}
            disabled={yarnRunning || !yarnCmd.trim()}
          >
            {yarnRunning ? <LoadingOutlined /> : 'Go'}
          </Button>
        </div>
      </SecondaryDiv>

      <PrimaryDiv className="border-2 opacity-20" />

      {/* package.json 编辑器 */}
      <SecondaryDiv className="flex flex-col gap-2 flex-1 min-h-0 rounded-md">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">package.json 依赖</div>
          <div className="flex gap-1">
            <Button className="px-2 py-0.5 text-xs rounded-sm flex items-center gap-1" onClick={addDep}>
              <PlusOutlined /> 添加
            </Button>
            <Button
              className="px-2 py-0.5 text-xs rounded-sm flex items-center gap-1"
              onClick={onSave}
              disabled={saved}
            >
              <SaveOutlined /> 保存
            </Button>
          </div>
        </div>
        <div className="text-xs opacity-50">手动编辑依赖后保存，再执行 yarn install 生效</div>
        <div className="flex flex-col gap-1.5 flex-1 overflow-auto">
          {deps.length === 0 ? (
            <div className="text-xs opacity-50 text-center py-2">暂无依赖</div>
          ) : (
            deps.map((dep, index) => (
              <div key={index} className="flex items-center gap-1">
                {!SystemPackage.includes(dep.name.trim()) ? (
                  <Button className="px-1.5 py-0.5 rounded-sm text-xs flex items-center gap-1" onClick={() => removeDep(index)}>
                    <DeleteOutlined />
                  </Button>
                ) : (
                  <span className="px-1.5 py-0.5 text-xs opacity-30" title="系统包，禁止删除">
                    <StopOutlined />
                  </span>
                )}
                <Input
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={dep.name}
                  onChange={e => updateDep(index, 'name', e.target.value)}
                  className="flex-1 px-2 py-0.5 rounded-sm text-xs"
                  placeholder="包名"
                />
                <Input
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={dep.version}
                  onChange={e => updateDep(index, 'version', e.target.value)}
                  className="w-24 px-2 py-0.5 rounded-sm text-xs"
                  placeholder="版本"
                />
              </div>
            ))
          )}
        </div>
      </SecondaryDiv>
    </Box>
  )
}
