import { useMemo } from 'react'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { SecondaryDiv } from '@alemonjs/react-ui'
import WebView from '@/common/WebView'
import { RESOURCE_PROTOCOL_PREFIX } from '@/api/config'
import { Sidebar } from '@/views/types'
import Box from '@/common/layout/Box'

export default function Webviews() {
  const expansions = useSelector((state: RootState) => state.expansions)
  const command = useSelector((state: RootState) => state.command)

  const viewSidebars = useMemo(() => {
    return (
      expansions.package?.flatMap(item => {
        return (
          item.alemonjs?.desktop?.sidebars?.map((sidebar: Sidebar) => ({
            ...sidebar,
            command: sidebar.command ?? sidebar.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      }) || []
    )
  }, [expansions.package])

  return (
    <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 size-full">
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
                ? '未找到相关扩展，请包管理下载'
                : '可选择右侧导航栏中的应用进行查看'}
            </div>
          </div>
        )}
      </Box>
    </SecondaryDiv>
  )
}
