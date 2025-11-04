import { Fragment, MouseEventHandler, useEffect, useState } from 'react'
import logoURL from '@/assets/logo.jpg'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNotification } from '@/context/Notification'
import { addPackage, putPackage } from '@/store/expansions'
import { Select } from '@alemonjs/react-ui'
import { DownloadOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { AntdIcon } from '@/common/ui/AntdIcon'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { ExpansionsPostMessage } from '@wailsjs/window/expansions/app'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import { Events } from '@wailsio/runtime'
import { fetchPackageInfo } from '@/api'
import Markdown from '@/common/Markdown'
import { PackageInfoType } from '@/views/types'
import Box from '@/common/layout/Box'
const EventsOn = Events.On

export default function PackageInfo({ packageInfo }: { packageInfo: PackageInfoType }) {
  const [pkgInfo, setPkgInfo] = useState<PackageInfoType>(packageInfo)
  const notification = useNotification()
  const expansions = useSelector((state: RootState) => state.expansions)
  const dispatch = useDispatch()
  const [options, setOptions] = useState<string[]>([])

  /**
   * @param name
   */
  const onInstall = (name: string) => {
    notification(`开始安装${name}`)
    if (pkgInfo['isLink']) {
      YarnCommands({
        type: `link`,
        args: [name]
      })
    } else {
      YarnCommands({
        type: `add`,
        args: [name, '-W']
      })
    }
  }

  /**
   *
   * @returns
   */
  const onClickUpdate = async () => {
    if (!pkgInfo) return
    let t = true
    setTimeout(() => {
      if (!t) return
      notification(`开始检查${pkgInfo.name}版本`)
    }, 1300)
    // 获取最新版本
    try {
      const msg = await fetchPackageInfo(pkgInfo.name)
      t = false
      if (msg['dist-tags']) {
        const version = msg['dist-tags'].latest
        if (pkgInfo['dist-tags'].latest !== version) {
          notification(`检查到最新版本${version}`, 'default')

          setPkgInfo({ ...pkgInfo, __version: version })

          //
          YarnCommands({
            type: `upgrade`,
            args: [`${pkgInfo.name}@${version}`, '-W']
          })
        } else {
          notification(`当前已是最新版本`, 'default')
        }
      } else {
        notification(`无法从npmjs中获取${pkgInfo.name}最新版本`, 'error')
      }
    } catch (err) {
      t = false
      notification(`无法从npmjs中获取${pkgInfo.name}最新版本`, 'error')
      console.error(err)
    }
  }

  /**
   *
   * @param item
   * @returns
   */
  const onDelete = (item: { name: string; [key: string]: any }) => {
    if (!item) return
    if (item.isLink) {
      YarnCommands({
        type: `unlink`,
        args: [item.name]
      })
      notification(`开始卸载${item.name}`)
    } else if (item.isGit) {
      notification(`待功能更新...`)
    } else {
      notification(`开始卸载${item.name}`)
      YarnCommands({
        type: `remove`,
        args: [item.name, '-W']
      })
    }
  }

  useEffect(() => {
    setPkgInfo(packageInfo)
    setOptions([packageInfo['dist-tags'].latest])
  }, [packageInfo])

  // 控制提交
  useEffect(() => {
    EventsOn('yarn', e => {
      const args = e.data ?? []
      const data = args[0] ?? null
      const type = data.type
      const value = data.value
      //
      if (type == 'add') {
        if (value == 0) {
          notification(`add ${pkgInfo?.name} 失败`, 'warning')
        } else {
          notification(`add ${pkgInfo?.name} 完成`)
          if (!pkgInfo) return

          const __version = pkgInfo['__version']

          setPkgInfo({
            ...pkgInfo,
            'dist-tags': { latest: __version }
          })

          // 更新数据
          dispatch(
            putPackage({
              name: pkgInfo.name,
              version: __version
            })
          )

          // 推送加载。
          ExpansionsPostMessage({
            type: 'add-expansions',
            data: pkgInfo.name
          })
        }
        return
      } else if (type == `upgrade`) {
        if (value == 0) {
          notification(`upgrade ${pkgInfo?.name} 失败`, 'warning')
        } else {
          notification(`upgrade ${pkgInfo?.name} 完成`)
          if (!pkgInfo) return

          // 更新数据
          dispatch(
            addPackage({
              name: pkgInfo.name,
              version: pkgInfo['dist-tags'].latest
            })
          )

          // 推送加载。
          ExpansionsPostMessage({
            type: 'add-expansions',
            data: pkgInfo.name
          })

          // 推送加载。
        }
        return
      } else if (type == `unlink`) {
        if (value == 0) {
          notification(`unlink ${pkgInfo?.name} 失败`, 'warning')
        } else {
          notification(`unlink ${pkgInfo?.name} 完成`)
          if (!pkgInfo) return
          // 推送加载。
          ExpansionsPostMessage({
            type: 'get-expansions',
            data: ''
          })
        }
        return
      } else if (type == `remove`) {
        if (value == 0) {
          notification(`remove ${pkgInfo?.name} 失败`, 'warning')
        } else {
          notification(`remove ${pkgInfo?.name} 完成`)
          if (!pkgInfo) return
          // 推送加载。
          ExpansionsPostMessage({
            type: 'get-expansions',
            data: ''
          })
        }
        return
      }
      if (type == 'link') {
        if (value == 0) {
          notification(`link ${pkgInfo?.name} 失败`, 'warning')
        } else {
          notification(`link ${pkgInfo?.name} 完成`)
          // 推送加载。
          ExpansionsPostMessage({
            type: 'get-expansions',
            data: ''
          })
        }
        return
      }
    })
  }, [])

  const loadVersion: MouseEventHandler<HTMLSelectElement> = async e => {
    e.stopPropagation()
    if (options.length > 1) return
    // 获取最新版本
    const info = await fetchPackageInfo(pkgInfo.name)
    setOptions(info.versions)
  }

  /**
   *
   * @param e
   * @returns
   */
  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (pkgInfo['isLink']) {
      notification(`link包无法切换版本`)
      return
    }
    // 选择版本,立即切换到该版本
    const version = e.target.value
    // 版本相同不处理
    if (version == pkgInfo['dist-tags'].latest) return

    // 切换版本
    notification(`开始切换${pkgInfo.name}版本到${version}`)

    setPkgInfo({
      ...pkgInfo,
      __version: version
    })

    //
    YarnCommands({
      type: `upgrade`,
      args: [`${pkgInfo.name}@${version}`, '-W']
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
              {pkgInfo['isLink'] && <div className="text-xs text-secondary-text">link</div>}
              {pkgInfo['isGit'] && <div className="text-xs text-secondary-text">git</div>}
            </div>
            <div>
              {!pkgInfo['isLink'] && (
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
                  {!pkgInfo['isLink'] && (
                    <div className="flex items-center gap-1 cursor-pointer" onClick={onClickUpdate}>
                      <SyncOutlined /> 更新
                    </div>
                  )}
                  {pkgInfo.name != '@alemonjs/process' && (
                    <div
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => onDelete(pkgInfo)}
                    >
                      <UploadOutlined /> 卸载
                    </div>
                  )}
                </Fragment>
              ) : (
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => onInstall(pkgInfo.name)}
                >
                  <DownloadOutlined /> 下载
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
