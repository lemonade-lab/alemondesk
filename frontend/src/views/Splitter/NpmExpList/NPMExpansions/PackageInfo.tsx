import { Fragment, MouseEventHandler, useEffect, useRef, useState } from 'react'
import logoURL from '@/assets/logo.jpg'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNotification } from '@/context/Notification'
import { addPackage, putPackage } from '@/store/expansions'
import { Select } from '@alemonjs/react-ui'
import {
  DownloadOutlined,
  LoadingOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { AntdIcon } from '@/common/ui/AntdIcon'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { GitPull, GitDelete } from '@wailsjs/window/git/app'
import { ExpansionsPostMessage } from '@wailsjs/window/expansions/app'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import { Events } from '@wailsio/runtime'
import { fetchPackageInfo } from '@/api'
import Markdown from '@/common/Markdown'
import { PackageInfoType } from '@/views/types'
import Box from '@/common/layout/Box'
import { usePop } from '@/context/Pop'
const EventsOn = Events.On

export default function PackageInfo({ packageInfo }: { packageInfo: PackageInfoType }) {
  const [pkgInfo, setPkgInfo] = useState<PackageInfoType>(packageInfo)
  const pkgInfoRef = useRef<PackageInfoType>(packageInfo)
  const notification = useNotification()
  const expansions = useSelector((state: RootState) => state.expansions)
  const dispatch = useDispatch()
  const [options, setOptions] = useState<string[]>([])
  const [operating, setOperating] = useState(false)
  const { setPopValue } = usePop()

  // 同步 ref
  useEffect(() => {
    pkgInfoRef.current = pkgInfo
  }, [pkgInfo])

  const onInstall = (name: string) => {
    if (operating) return
    setOperating(true)
    notification(`开始安装 ${name}`)
    if (pkgInfo['isLink']) {
      YarnCommands({ type: 'link', args: [name] })
    } else {
      YarnCommands({ type: 'add', args: [name, '-W'] })
    }
  }

  const onClickUpdate = async () => {
    if (!pkgInfo || operating) return
    setOperating(true)

    // Git 仓库（isPkg 时 git 优先）走 git pull + yarn install
    if (pkgInfo['isPkg'] && pkgInfo['isGit']) {
      notification(`正在拉取 ${pkgInfo.name} 最新代码...`)
      GitPull('packages', pkgInfo.name)
      return
    }

    // 非 isPkg 的 link 包不支持更新
    if (pkgInfo['isLink']) {
      notification('link 包无法更新')
      setOperating(false)
      return
    }

    // 非 isPkg 的 git 包也走 git pull
    if (pkgInfo['isGit']) {
      notification(`正在拉取 ${pkgInfo.name} 最新代码...`)
      GitPull('packages', pkgInfo.name)
      return
    }

    // NPM 包走 yarn upgrade
    notification(`正在检查 ${pkgInfo.name} 最新版本...`)
    try {
      const msg = await fetchPackageInfo(pkgInfo.name)
      if (msg['dist-tags']) {
        const version = msg['dist-tags'].latest
        if (pkgInfo['dist-tags'].latest !== version) {
          notification(`检查到最新版本 ${version}，开始更新`)
          setPkgInfo({ ...pkgInfo, __version: version })
          YarnCommands({ type: 'upgrade', args: [`${pkgInfo.name}@${version}`, '-W'] })
        } else {
          notification('当前已是最新版本')
          setOperating(false)
        }
      } else {
        notification(`无法获取 ${pkgInfo.name} 最新版本`, 'error')
        setOperating(false)
      }
    } catch (err) {
      notification(`无法获取 ${pkgInfo.name} 最新版本`, 'error')
      setOperating(false)
      console.error(err)
    }
  }

  const onDelete = (item: { name: string; [key: string]: any }) => {
    if (!item || operating) return
    const isPkgGit = item.isPkg && item.isGit
    setPopValue({
      open: true,
      title: isPkgGit ? '确认删除仓库' : '确认卸载',
      description: isPkgGit
        ? `确认删除仓库 ${item.name}？此操作将移除本地仓库文件，不可恢复。`
        : `确认卸载 ${item.name}？`,
      buttonText: '确认',
      buttonCancelText: '取消',
      data: {},
      code: 0,
      confirmDelay: 6,
      onConfirm: doDelete
    })
  }

  const doDelete = () => {
    const item = pkgInfoRef.current
    if (!item) return
    setOperating(true)
    notification(`开始卸载 ${item.name}`)
    // 优先级：isPkg 时 git > link，否则 link > git
    if (item.isPkg && item.isGit) {
      notification(`正在删除 ${item.name} 仓库...`)
      GitDelete('packages', item.name)
    } else if (item.isLink) {
      YarnCommands({ type: 'unlink', args: [item.name] })
    } else if (item.isGit) {
      notification(`正在删除 ${item.name} 仓库...`)
      GitDelete('packages', item.name)
    } else {
      YarnCommands({ type: 'remove', args: [item.name, '-W'] })
    }
  }

  useEffect(() => {
    setPkgInfo(packageInfo)
    pkgInfoRef.current = packageInfo
    setOptions([packageInfo['dist-tags'].latest])
    setOperating(false)
  }, [packageInfo])

  // 监听 yarn 事件 — 带清理
  useEffect(() => {
    const cancelYarn = EventsOn('yarn', (e: any) => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (!data?.type) return

      const type = data.type
      const value = data.value
      const current = pkgInfoRef.current

      if (type === 'add') {
        setOperating(false)
        if (value === 0) {
          notification(`安装 ${current?.name} 失败`, 'warning')
        } else {
          notification(`安装 ${current?.name} 完成`)
          if (!current) return
          const __version = current['__version'] || current['dist-tags'].latest
          setPkgInfo({ ...current, 'dist-tags': { latest: __version } })
          dispatch(putPackage({ name: current.name, version: __version }))
          ExpansionsPostMessage({ type: 'add-expansions', data: current.name })
        }
        return
      }

      // git pull 后 yarn install 完成
      if (type === 'install') {
        if (current?.isGit) {
          setOperating(false)
          if (value === 0) {
            notification(`依赖安装失败`, 'warning')
          } else {
            notification(`${current?.name} 更新完成`)
            ExpansionsPostMessage({ type: 'get-expansions', data: '' })
          }
        }
        return
      }

      if (type === 'upgrade') {
        setOperating(false)
        if (value === 0) {
          notification(`更新 ${current?.name} 失败`, 'warning')
        } else {
          notification(`更新 ${current?.name} 完成`)
          if (!current) return
          dispatch(addPackage({ name: current.name, version: current['dist-tags'].latest }))
          ExpansionsPostMessage({ type: 'add-expansions', data: current.name })
        }
        return
      }

      if (type === 'unlink') {
        setOperating(false)
        if (value === 0) {
          notification(`取消链接 ${current?.name} 失败`, 'warning')
        } else {
          notification(`取消链接 ${current?.name} 完成`)
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }

      if (type === 'remove') {
        setOperating(false)
        if (value === 0) {
          notification(`卸载 ${current?.name} 失败`, 'warning')
        } else {
          notification(`卸载 ${current?.name} 完成`)
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }

      if (type === 'link') {
        setOperating(false)
        if (value === 0) {
          notification(`链接 ${current?.name} 失败`, 'warning')
        } else {
          notification(`链接 ${current?.name} 完成`)
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }
    })

    // 监听 git 事件
    const cancelGit = EventsOn('git', (e: any) => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (!data?.type) return

      if (data.type === 'pull') {
        const current = pkgInfoRef.current
        if (data.value === 0) {
          setOperating(false)
          notification(`拉取 ${current?.name} 失败`, 'warning')
        } else {
          notification(`拉取 ${current?.name} 成功，正在安装依赖...`)
          // git pull 成功后自动 yarn install
          YarnCommands({ type: 'install', args: ['--ignore-warnings'] })
        }
      }

      if (data.type === 'delete') {
        setOperating(false)
        const current = pkgInfoRef.current
        if (data.value === 0) {
          notification(`删除 ${current?.name} 失败`, 'warning')
        } else {
          notification(`${current?.name} 已删除，正在重新安装依赖...`)
          YarnCommands({ type: 'install', args: ['--ignore-warnings'] })
        }
      }
    })

    return () => {
      if (cancelYarn) cancelYarn()
      if (cancelGit) cancelGit()
    }
  }, [])

  const loadVersion: MouseEventHandler<HTMLSelectElement> = async e => {
    e.stopPropagation()
    if (options.length > 1) return
    const info = await fetchPackageInfo(pkgInfo.name)
    setOptions(info.versions)
  }

  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (pkgInfo['isLink']) {
      notification('link 包无法切换版本')
      return
    }
    if (operating) return
    const version = e.target.value
    if (version === pkgInfo['dist-tags'].latest) return
    setPopValue({
      open: true,
      title: '确认版本切换',
      description: `确定要将 ${pkgInfo.name} 从 v${pkgInfo['dist-tags'].latest} 切换到 v${version} 吗？`,
      buttonText: '确认',
      buttonCancelText: '取消',
      data: {},
      code: 0,
      confirmDelay: 6,
      onConfirm: () => {
        setOperating(true)
        notification(`开始切换 ${pkgInfo.name} 到 v${version}`)
        setPkgInfo({ ...pkgInfo, __version: version })
        YarnCommands({ type: 'upgrade', args: [`${pkgInfo.name}@${version}`, '-W'] })
      }
    })
  }

  /**
   *
   * @param pkgInfo
   * @returns
   */
  const createIcon = (pkgInfo: PackageInfoType) => {
    let url: string | null = null
    if (pkgInfo['__logo_url']) {
      url = pkgInfo['__logo_url']
    } else if (pkgInfo['__logo']) {
      url = `${RESOURCE_PROTOCOL_PREFIX}${pkgInfo['__logo']}`
    } else {
      url = logoURL
    }
    const defaultIcon = (
      <img src={url} alt={`${pkgInfo.name} logo`} className="size-20  rounded-md" />
    )
    if (!pkgInfo['__icon']) return defaultIcon
    const icon = pkgInfo['__icon'].split('.')[1]
    return (
      <AntdIcon
        className="size-20 flex justify-center items-center text-8xl"
        defaultIcon={defaultIcon}
        icon={icon}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col size-full select-text">
      <div
        className="p-2  flex items-center justify-center gap-4 border-b 
           border-secondary-border
           dark:border-dark-secondary-border"
      >
        <div className="flex items-center justify-center">{createIcon(pkgInfo)}</div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between">
            <div className="text-xl flex gap-2 text-secondary-text">
              <div className="font-bold">{pkgInfo.name}</div>
              {pkgInfo['isPkg'] && <div className="text-xs text-secondary-text">pkg</div>}
              {pkgInfo['isLink'] && <div className="text-xs text-secondary-text">link</div>}
              {pkgInfo['isGit'] && <div className="text-xs text-secondary-text">git</div>}
            </div>
            <div>
              {!pkgInfo['isLink'] && !pkgInfo['isGit'] && (
                <Select onChange={onSelect} onClick={loadVersion} className="rounded-md">
                  {options.map((item, index) => (
                    <option key={index}>{item}</option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {typeof pkgInfo.author === 'string' ? (
              <div>{pkgInfo.author}</div>
            ) : (
              <div className="flex gap-2 items-center">
                {pkgInfo.author?.url ? (
                  <div>
                    <a target="_blank" rel="noreferrer" href={pkgInfo.author?.url}>
                      {pkgInfo.author?.name ?? '未知'}
                    </a>
                  </div>
                ) : (
                  <div>{pkgInfo.author?.name ?? '未知'}</div>
                )}
                <div> {pkgInfo.author?.email ? `| ${pkgInfo.author?.email}` : ' '}</div>
              </div>
            )}
          </div>
          <div className="text-secondary-text">{pkgInfo.description}</div>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <div>Version: {pkgInfo['dist-tags'].latest}</div>
              {expansions.package.find(item => item.name == pkgInfo.name) ? (
                <Fragment>
                  <div
                    className={`flex items-center gap-1 cursor-pointer ${operating ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onClickUpdate}
                  >
                    {operating ? <LoadingOutlined /> : <SyncOutlined />}
                    {(pkgInfo['isPkg'] && pkgInfo['isGit']) || pkgInfo['isGit'] ? '拉取更新' : '更新'}
                  </div>
                  {pkgInfo.name != '@alemonjs/process' && (
                    <div
                      className={`flex items-center gap-1 cursor-pointer ${operating ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => onDelete(pkgInfo)}
                    >
                      {operating ? <LoadingOutlined /> : <UploadOutlined />} 卸载
                    </div>
                  )}
                </Fragment>
              ) : (
                <div
                  className={`flex items-center gap-1 cursor-pointer ${operating ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => onInstall(pkgInfo.name)}
                >
                  {operating ? <LoadingOutlined /> : <DownloadOutlined />} 安装
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Box >
        <Markdown source={pkgInfo.readme} />
      </Box>


    </div>
  )
}
