import { useEffect, useRef, useState, useCallback } from 'react'
import { debounce } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNotification } from '@/context/Notification'
import { Button } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import ExpansionsCard from './ExpansionsCard'
import SearchCard from './SearchCard'
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons'
import { AppExists, AppReadFiles } from '@wailsjs/window/app/app'
import { ExpansionsPostMessage } from '@wailsjs/window/expansions/app'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { Events } from '@wailsio/runtime'
import { PackageInfoType } from '@/views/types'
import {
  setPackageInfo,
  setSelect,
  setTab,
  setSearchResults,
  setSearchLoading
} from '@/store/NPMExpansions'
import { setViews } from '@/store/views'
import { setAddLoading } from '@/store/gitExp'
import { searchPackages, searchDefaultPackages, fetchPackageInfo } from '@/api'
import Tabs from '@/common/ui/Tabs'
import Box from '@/common/layout/Box'
import CloneForm from './CloneForm'
const EventsOn = Events.On

const SEARCH_CACHE_KEY = 'ALemonDesk_npm_search_cache'
const SEARCH_CACHE_TTL = 1000 * 60 * 30 // 30 分钟缓存

export default function NpmExpList() {
  const notification = useNotification()

  const app = useSelector((state: RootState) => state.app)
  const expansions = useSelector((state: RootState) => state.expansions)
  const npmExpansions = useSelector((state: RootState) => state.npmExpansions)
  const dispatch = useDispatch()

  const { tab, searchResults, searchLoading } = npmExpansions

  const [searchInput, setSearchInput] = useState('')
  const [operating, setOperating] = useState(false)
  const defaultLoadedRef = useRef(false)

  const operatingRef = useRef(false)

  // 写入本地缓存
  const saveSearchCache = (keyword: string, results: any[]) => {
    try {
      localStorage.setItem(
        SEARCH_CACHE_KEY,
        JSON.stringify({ keyword, results, timestamp: Date.now() })
      )
    } catch (_) {}
  }

  // 读取本地缓存
  const loadSearchCache = () => {
    try {
      const raw = localStorage.getItem(SEARCH_CACHE_KEY)
      if (!raw) return null
      const cache = JSON.parse(raw)
      if (Date.now() - cache.timestamp > SEARCH_CACHE_TTL) return null
      return cache as { keyword: string; results: any[] }
    } catch (_) {
      return null
    }
  }

  // 搜索扩展
  const doSearch = useCallback(
    debounce(async (keyword: string) => {
      if (!keyword.trim()) {
        // 清空用户输入时回到默认推荐
        loadDefaultResults()
        return
      }
      dispatch(setSearchLoading(true))
      try {
        const results = await searchPackages(keyword.trim())
        dispatch(setSearchResults(results))
        saveSearchCache(keyword.trim(), results)
      } catch (err) {
        console.error(err)
        notification('搜索失败，请检查网络', 'error')
      } finally {
        dispatch(setSearchLoading(false))
      }
    }, 600),
    []
  )

  // 加载默认推荐扩展
  const loadDefaultResults = useCallback(async () => {
    // 先尝试读缓存
    const cache = loadSearchCache()
    if (cache && !cache.keyword) {
      dispatch(setSearchResults(cache.results))
      return
    }
    dispatch(setSearchLoading(true))
    try {
      const results = await searchDefaultPackages()
      dispatch(setSearchResults(results))
      saveSearchCache('', results)
    } catch (err) {
      console.error(err)
    } finally {
      dispatch(setSearchLoading(false))
    }
  }, [])

  // 切换到搜索 Tab 时自动加载默认推荐
  useEffect(() => {
    if (tab === 'search' && searchResults.length === 0 && !defaultLoadedRef.current) {
      defaultLoadedRef.current = true
      loadDefaultResults()
    }
  }, [tab])

  // 查看已安装扩展详情
  const handlePackageClick = debounce(async (packageName: string) => {
    const info = expansions.package.find(v => v.name === packageName)
    if (!info) {
      notification(`本地没有找到 ${packageName} 的数据。`, 'error')
      return
    }
    const dir = app.userDataNodeModulesPath + '/' + packageName + '/README.md'
    let __logo: string | null = null
    let __icon = null
    if (info?.alemonjs?.desktop?.logo) {
      if (info.alemonjs.desktop.logo.startsWith('antd.')) {
        __icon = info.alemonjs.desktop.logo
      } else {
        const __dir = info.alemonjs.desktop.logo.replace(/^\./, '').replace(/^\//, '')
        __logo = app.userDataNodeModulesPath + '/' + packageName + '/' + __dir
      }
    }
    const data: PackageInfoType = {
      'name': info?.name || '',
      'description': info?.description || '',
      'author': info?.author || null,
      'dist-tags': { latest: info?.version || '' },
      'version': info?.version || '',
      'readme': '',
      'isLink': info?.isLink || false,
      'isGit': info?.isGit || false,
      'isPkg': false,
      '__logo': __logo,
      '__icon': __icon
    }
    // 检查是否位于 packages 目录
    try {
      const pkgDir = app.userDataTemplatePath + '/packages/' + packageName
      data.isPkg = await AppExists(pkgDir)
    } catch {}
    try {
      const readme = await AppReadFiles(dir)
      data.readme = readme
    } catch (err) {
      console.error(err)
    }
    dispatch(setPackageInfo(data))
    dispatch(setSelect('shopping'))
    dispatch(setViews({ key: 'npm-expansions' }))
  }, 500)

  // 点击搜索结果查看详情
  const handleSearchResultClick = debounce(async (packageName: string) => {
    try {
      const info = await fetchPackageInfo(packageName)
      const data: PackageInfoType = {
        'name': info.name,
        'description': info.description,
        'author': info.author,
        'dist-tags': info['dist-tags'],
        'version': info.version,
        'readme': info.readme || '',
        '__logo_url': info['__logo_url'],
        '__icon': info['__icon']
      }
      dispatch(setPackageInfo(data))
      dispatch(setSelect('shopping'))
      dispatch(setViews({ key: 'npm-expansions' }))
    } catch (err) {
      console.error(err)
      notification(`无法获取 ${packageName} 的信息`, 'error')
    }
  }, 500)

  // 安装扩展（从搜索结果直接安装）
  const handleInstall = (packageName: string) => {
    if (operating) {
      notification('正在执行中，请稍后', 'warning')
      return
    }
    setOperating(true)
    operatingRef.current = true
    notification(`开始安装 ${packageName}`)
    YarnCommands({
      type: 'add',
      args: [packageName, '-W']
    })
  }

  // 监听 yarn 事件
  useEffect(() => {
    const cancel = EventsOn('yarn', (e: any) => {
      const args = e.data ?? []
      const data = args[0] ?? null
      if (!data || !data.type) return

      const type = data.type
      const value = data.value

      // 处理 add 事件（从搜索结果安装）
      if (type === 'add') {
        if (operatingRef.current) {
          setOperating(false)
          operatingRef.current = false
        }
        if (value === 0) {
          notification('安装失败', 'warning')
        } else {
          notification('安装完成')
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }

      // 处理 install 事件（克隆后自动安装）
      if (type === 'install') {
        dispatch(setAddLoading(false))
        if (value === 0) {
          notification('依赖安装失败', 'warning')
        } else {
          notification('依赖安装完成')
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }

      // 处理 remove 事件
      if (type === 'remove') {
        if (value === 0) {
          notification('卸载失败', 'warning')
        } else {
          notification('卸载完成')
          ExpansionsPostMessage({ type: 'get-expansions', data: '' })
        }
        return
      }
    })

    return () => {
      if (cancel) cancel()
    }
  }, [])

  const isInstalled = (name: string) =>
    expansions.package.some(item => item.name === name)

  return (
    <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col border-l size-full">
      {/* 顶部 Tab 切换 */}
      <div className="flex flex-col gap-2 px-2 py-1">
        <Tabs
          value={tab}
          options={[
            { key: 'installed', label: '已安装' },
            { key: 'search', label: '搜索扩展' },
            { key: 'clone', label: '克隆仓库' }
          ]}
          onChange={value => dispatch(setTab(value as 'installed' | 'search' | 'clone'))}
        />
        {/* 搜索模式下显示搜索框 */}
        {tab === 'search' && (
          <div className="flex items-center gap-1">
            <Input
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="输入扩展名搜索..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value)
                doSearch(e.target.value)
              }}
              className="w-full px-2 py-1 rounded-sm"
            />
            <Button
              className="px-2 rounded-full"
              onClick={() => doSearch(searchInput)}
            >
              {searchLoading ? <LoadingOutlined /> : <SearchOutlined />}
            </Button>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <Box className="flex-1 flex flex-col gap-1 border-t py-2">
        {tab === 'clone' ? (
          <CloneForm />
        ) : tab === 'installed' ? (
          // 已安装列表
          expansions.package.length > 0 ? (
            expansions.package.map(item => (
              <ExpansionsCard
                item={item}
                key={item.name}
                handlePackageClick={name => handlePackageClick(name)}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm opacity-50">
              暂无已安装扩展
            </div>
          )
        ) : (
          // 搜索结果
          searchLoading ? (
            <div className="flex-1 flex items-center justify-center text-sm opacity-50">
              <LoadingOutlined className="mr-1" /> 搜索中...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(item => (
              <SearchCard
                key={item.name}
                item={item}
                isInstalled={isInstalled(item.name)}
                onClick={() => handleSearchResultClick(item.name)}
                onInstall={() => handleInstall(item.name)}
              />
            ))
          ) : searchInput.trim() ? (
            <div className="flex-1 flex items-center justify-center text-sm opacity-50">
              未找到相关扩展
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm opacity-50">
              <LoadingOutlined className="mr-1" /> 加载推荐扩展...
            </div>
          )
        )}
      </Box>
    </SidebarDiv>
  )
}
