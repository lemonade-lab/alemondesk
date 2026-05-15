import { GetVersions } from '@wailsjs/window/controller/app'
import logoURL from '@/assets/logo.jpg'
import { useEffect, useMemo, useState } from 'react'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { setAbout } from '@/store/about'
import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { Browser } from '@wailsio/runtime'

type ReleaseAsset = {
  name: string
}

type LatestRelease = {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

const RELEASES_URL = 'https://github.com/lemonade-lab/alemondesk/releases'
const API_URL = 'https://api.github.com/repos/lemonade-lab/alemondesk/releases/latest'
const DOWNLOAD_PROXY = 'https://ghfast.top/https://github.com/lemonade-lab/alemondesk/releases/download'

const normaliseVersion = (version: string) => {
  if (!version) return ''
  return version.startsWith('v') ? version : `v${version}`
}

const preferredAssetNames = (platform: string, arch: string) => {
  if (platform === 'windows') {
    return [
      `alemondesk-${arch}-installer.exe`,
      `alemondesk-${arch}.exe`,
      'alemondesk-amd64-installer.exe'
    ]
  }
  if (platform === 'darwin') {
    return ['alemondesk-macOS.zip', 'alemondesk.zip']
  }
  if (platform === 'linux') {
    return [
      arch === 'arm64' ? 'alemondesk-aarch64.AppImage' : 'alemondesk-x86_64.AppImage',
      'alemondesk-amd64.AppImage',
      'alemondesk.AppImage'
    ]
  }
  return []
}

const findMatchedAsset = (assets: ReleaseAsset[], platform: string, arch: string) => {
  const preferred = preferredAssetNames(platform, arch)
  for (const assetName of preferred) {
    const matched = assets.find(asset => asset.name === assetName)
    if (matched) return matched
  }
  return assets.find(asset => /\.(exe|zip|AppImage|dmg|pkg)$/i.test(asset.name))
}

const About = () => {
  const about = useSelector((state: RootState) => state.about)
  const dispatch = useDispatch()
  const [checking, setChecking] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [latestVersion, setLatestVersion] = useState('')

  useEffect(() => {
    if (!about.platform) {
      GetVersions().then(res => {
        dispatch(
          setAbout({
            arch: res.arch,
            node: res.node,
            platform: res.platform,
            version: res.version
          })
        )
      })
    }
  }, [about.platform, dispatch])

  const currentVersion = useMemo(() => normaliseVersion(about.version), [about.version])

  const checkUpdate = async () => {
    setChecking(true)
    setUpdateMessage('')
    setDownloadUrl('')
    setLatestVersion('')

    try {
      const response = await fetch(API_URL, {
        headers: {
          Accept: 'application/vnd.github+json'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const release = (await response.json()) as LatestRelease
      const nextVersion = normaliseVersion(release.tag_name)
      const matchedAsset = findMatchedAsset(release.assets || [], about.platform, about.arch)
      const nextDownloadUrl = matchedAsset
        ? `${DOWNLOAD_PROXY}/${nextVersion}/${matchedAsset.name}`
        : release.html_url || RELEASES_URL

      setLatestVersion(nextVersion)
      setDownloadUrl(nextDownloadUrl)

      if (nextVersion && nextVersion === currentVersion) {
        setUpdateMessage(`当前已是最新版本 ${nextVersion}`)
      } else if (nextVersion) {
        setUpdateMessage(`发现新版本 ${nextVersion}`)
      } else {
        setUpdateMessage('已获取最新发布信息')
      }
    } catch {
      setUpdateMessage('检查更新失败，请稍后重试')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">关于</div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <img src={logoURL} alt="logo" className="w-72 h-28" />
              <div className="flex flex-col justify-center items-center gap-1 text-md lg:text-xl xl:text-2xl">
                <div>{about.platform}-{about.arch}-{about.node}</div>
                <div>版本：{currentVersion || '0.0.0-dev'}</div>
                <div>Copyright © 2024-present Lemonade-Lab</div>
                <div
                  onClick={() => {
                    Browser.OpenURL('https://alemonjs.com')
                  }}
                  className="select-text text-blue-500 hover:underline cursor-pointer"
                >
                  https://alemonjs.com
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-secondary-border dark:border-dark-secondary-border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-base font-medium">检查更新</div>
                  <div className="text-sm opacity-70">
                    当前版本：{currentVersion || '0.0.0-dev'}
                    {latestVersion ? `，最新版本：${latestVersion}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-md text-sm border border-secondary-border dark:border-dark-secondary-border hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                    onClick={() => Browser.OpenURL(RELEASES_URL)}
                  >
                    发布页
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-md text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-60"
                    onClick={checkUpdate}
                    disabled={checking}
                  >
                    {checking ? '检查中...' : '检查更新'}
                  </button>
                </div>
              </div>

              {updateMessage ? (
                <div className="text-sm opacity-80">{updateMessage}</div>
              ) : null}

              {downloadUrl ? (
                <div className="flex flex-col gap-2">
                  <div
                    className="text-sm break-all select-text text-blue-500 hover:underline cursor-pointer"
                    onClick={() => Browser.OpenURL(downloadUrl)}
                  >
                    {downloadUrl}
                  </div>
                  <div>
                    <button
                      className="px-3 py-1.5 rounded-md text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      onClick={() => Browser.OpenURL(downloadUrl)}
                    >
                      下载对应安装包
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
    </section>
  )
}

export default About
