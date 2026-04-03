import { useNotification } from '@/context/Notification'
import { FeatModal } from '@/context/Pop'
import { RootState } from '@/store'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import GuideCommon from '@/views/Guide/Common'
import { resetAllGuides } from '@/views/Guide/keys'
import {
  AppDownloadFiles,
  AppExists,
  GetAppLogsFilePath
} from '@wailsjs/window/app/app'
import { BotResetBot } from '@wailsjs/window/bot/app'

const Common = () => {
  const app = useSelector((state: RootState) => state.app)
  const notification = useNotification()
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">通用</div>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  title: '缓存记录',
                  description: 'yarn.lock',
                  children: (
                    <Button
                      className="px-2 rounded-md border"
                      onClick={async () => {
                        const dir = `${app.userDataTemplatePath}/yarn.lock`
                        const T = await AppExists(dir)
                        if (!T) {
                          notification('yarn.lock不存在')
                          return
                        }
                        AppDownloadFiles(dir)
                      }}
                    >
                      下载
                    </Button>
                  )
                },
                {
                  title: '进程记录文件',
                  description: 'main.log',
                  children: (
                    <Button
                      className="px-2 rounded-md border"
                      onClick={async () => {
                        const dir = await GetAppLogsFilePath()
                        if (!dir) {
                          notification('日志文件路径获取失败')
                          return
                        }
                        const T = await AppExists(dir)
                        if (!T) {
                          notification('记录不存在')
                          return
                        }
                        AppDownloadFiles(dir)
                      }}
                    >
                      下载
                    </Button>
                  )
                },
                {
                  title: '重置机器人',
                  description: '模板以当前版本为准',
                  children: (
                    <Button
                      className="px-2 rounded-md border"
                      onClick={() => {
                        setOpen(true)
                      }}
                    >
                      重置
                    </Button>
                  )
                },
                {
                  title: '新手引导',
                  description: '重新触发所有新手引导提示',
                  children: (
                    <Button
                      className="px-2 rounded-md border"
                      onClick={() => {
                        resetAllGuides()
                        notification('已重置，刷新页面后将重新显示引导')
                        setTimeout(() => location.reload(), 800)
                      }}
                    >
                      重置
                    </Button>
                  )
                }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-40 text-sm shrink-0">{item.title}</div>
                  <div className="flex-1 text-xs text-secondary-text">{item.description}</div>
                  <div className="flex gap-2">{item.children}</div>
                </div>
              ))}
            </div>
            <GuideCommon />
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
      <FeatModal
        open={open}
        title="确认重置"
        textOk="确认重置"
        onClose={() => setOpen(false)}
        footer={null}
      >
        <div className="flex flex-col gap-4">
          <Button
            className="px-2 rounded-md border"
            onClick={async () => {
              BotResetBot()
              setOpen(false)
            }}
          >
            重置机器人
          </Button>
        </div>
        <div className="flex flex-col gap-4"></div>
      </FeatModal>
    </section>
  )
}
export default Common
