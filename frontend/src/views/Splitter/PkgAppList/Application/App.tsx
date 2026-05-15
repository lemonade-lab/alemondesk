import { useMemo } from 'react'
import classNames from 'classnames'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { closeWebviewTab, openWebviewTab, setActiveWebviewTab, setCommand } from '@/store/command'
import { SecondaryDiv } from '@alemonjs/react-ui'
import WebView from '@/common/WebView'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import Box from '@/common/layout/Box'
import ExpansionIcon from '@/common/ExpansionIcon'
import { Button, Dropdown } from 'antd'
import { CloseOutlined, DownOutlined } from '@ant-design/icons'
import { getDesktopSidebars, hasDesktopEntry } from '@/common/expansionPackage'

const createTabId = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function Webviews() {
  const dispatch = useDispatch()
  const expansions = useSelector((state: RootState) => state.expansions)
  const command = useSelector((state: RootState) => state.command)

  const viewSidebars = useMemo(() => {
    return (expansions.package?.flatMap(item => getDesktopSidebars(item)) || []).sort(item => {
      if (item.name === 'APPS') return -1
      return /@alemonjs-/.test(item.expansions_name) ? -1 : 1
    })
  }, [expansions.package])

  const hasDesktopPackages = useMemo(
    () => expansions.package.some(item => hasDesktopEntry(item)),
    [expansions.package]
  )

  const activeTab = useMemo(
    () => command.tabs.find(tab => tab.id === command.activeTabId) || null,
    [command.activeTabId, command.tabs]
  )

  const openApplication = (commandName: string) => {
    const selected = viewSidebars.find(item => item.command === commandName)
    if (!selected) return
    const tabId = createTabId()
    dispatch(
      openWebviewTab({
        id: tabId,
        command: selected.command,
        title: selected.name,
        icon: selected.icon,
        expansionsName: selected.expansions_name
      })
    )
    dispatch(setCommand(selected.command))
  }

  const closeTab = (tabId: string) => {
    dispatch(closeWebviewTab(tabId))
  }

  return (
    <SecondaryDiv className="steps-pkg-webview animate__animated animate__fadeIn flex flex-col flex-1 size-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-secondary-border dark:border-dark-secondary-border px-2 py-1.5">
        <div className="flex min-w-0 h-8  flex-1 items-center gap-1.5 overflow-x-auto pr-2 dark:border-dark-secondary-border">
          {command.tabs.length > 0 ? (
            command.tabs.map(tab => (
              <button
                key={tab.id}
                className={classNames(
                  'group flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors',
                  tab.id === command.activeTabId
                    ? 'border-secondary-border dark:border-dark-secondary-border bg-secondary-bg dark:bg-dark-secondary-bg shadow-sm'
                    : 'border-transparent bg-transparent opacity-80 hover:opacity-100 hover:bg-secondary-bg/60 dark:hover:bg-dark-secondary-bg/60'
                )}
                onClick={() => dispatch(setActiveWebviewTab(tab.id))}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <ExpansionIcon
                    name={tab.title}
                    icon={tab.icon}
                    expansions_name={tab.expansionsName}
                  />
                </span>
                <span className="max-w-24 truncate leading-none">{tab.title}</span>
                <span
                  className="flex size-4 items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={event => {
                    event.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <CloseOutlined style={{ fontSize: 9 }} />
                </span>
              </button>
            ))
          ) : (
            <div className="px-1 text-xs opacity-60">未打开应用</div>
          )}
        </div>
        <div className="flex  shrink-0 items-center justify-end gap-1.5 pl-2 border-l border-secondary-border dark:border-dark-secondary-border">
          <Dropdown
            trigger={['click']}
            menu={{
              items: viewSidebars.map(item => ({
                key: item.command,
                label: (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="flex size-3.5 shrink-0 items-center justify-center">
                      <ExpansionIcon
                        name={item.name}
                        icon={item.icon}
                        expansions_name={item.expansions_name}
                      />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                )
              })),
              onClick: ({ key }) => openApplication(String(key))
            }}
          >
            <Button size="small" className="ml-2 justify-between rounded-md text-xs">
              <span className="truncate">打开应用</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        </div>
      </div>

      <Box className="flex-1 overflow-hidden">
        {activeTab?.view ? (
          <WebView
            src={activeTab.view}
            name={activeTab.command}
            rules={[
              {
                protocol: 'resource://-/',
                work: RESOURCE_PROTOCOL_PREFIX
              }
            ]}
          />
        ) : activeTab ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-xs opacity-60">正在加载 {activeTab.title}...</div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex-col flex items-center justify-center gap-1.5 text-sm opacity-75">
              <div>
                {viewSidebars.length === 0
                  ? expansions.package.length === 0
                    ? '未检测到已安装扩展，请先到扩展管理安装'
                    : hasDesktopPackages
                      ? '未找到可显示的应用入口'
                      : '已安装扩展中没有声明桌面应用入口'
                  : '在右上角的应用列表中选择应用打开'}
              </div>
            </div>
          </div>
        )}
      </Box>
    </SecondaryDiv>
  )
}
