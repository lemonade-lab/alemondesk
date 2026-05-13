import { useMemo } from 'react'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { SecondaryDiv } from '@alemonjs/react-ui'
import WebView from '@/common/WebView'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import Box from '@/common/layout/Box'
import { getDesktopSidebars, hasDesktopEntry } from '@/common/expansionPackage'

export default function Webviews() {
  const expansions = useSelector((state: RootState) => state.expansions)
  const command = useSelector((state: RootState) => state.command)

  const viewSidebars = useMemo(() => {
    return expansions.package?.flatMap(item => getDesktopSidebars(item)) || []
  }, [expansions.package])

  const hasDesktopPackages = useMemo(
    () => expansions.package.some(item => hasDesktopEntry(item)),
    [expansions.package]
  )

  return (
    <SecondaryDiv className="steps-pkg-webview animate__animated animate__fadeIn flex flex-col flex-1 size-full">
      <Box>
        {command.view && (
          <WebView
            src={command.view}
            name={command.name}
            rules={[
              {
                protocol: 'resource://-/',
                work: RESOURCE_PROTOCOL_PREFIX
              }
            ]}
          />
        )}
        {!command.view && (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex-col flex justify-center items-center">
              {viewSidebars.length === 0
                ? expansions.package.length === 0
                  ? '未检测到已安装扩展，请先到扩展管理安装'
                  : hasDesktopPackages
                    ? '未找到可显示的应用入口'
                    : '已安装扩展中没有声明桌面应用入口'
                : '可选择右侧导航栏中的应用进行查看'}
            </div>
          </div>
        )}
      </Box>
    </SecondaryDiv>
  )
}
