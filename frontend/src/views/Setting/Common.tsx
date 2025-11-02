import { useNotification } from '@/context/Notification'
import { FeatModal } from '@/context/Pop'
import { RootState } from '@/store'
import { Button } from '@alemonjs/react-ui'
import { PrimaryDiv } from '@alemonjs/react-ui'
import _ from 'lodash'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import GuideCommon from '../Guide/Common'
import {
  AppDownloadFiles,
  AppExists,
  GetAppLogsFilePath
} from '@wailsjs/window/app/app'
import { BotResetBot} from '@wailsjs/window/bot/app'

const Common = () => {
  const app = useSelector((state: RootState) => state.app)
  const notification = useNotification()
  const [open, setOpen] = useState(false)
  return (
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex">
      <div className="flex-col gap-2 flex-1 flex p-6 ">
        <PrimaryDiv className="flex flex-col flex-1  p-6 rounded-lg shadow-inner  max-w-full">
          <div className="text-2xl font-semibold mb-4 border-b border-secondary-border dark:border-dark-secondary-border">
            通用
          </div>
          <div className="flex flex-col gap-4">
            {[
              // {
              //   title: '开机自启',
              //   children: (
              //     <Switch
              //       value={desktopCheckeds.autoLaunch}
              //       onChange={checked => onChangeDesktop('AUTO_LAUNCH', checked)}
              //     />
              //   )
              // },
              {
                title: '依赖锁文件',
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
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-2 justify-between">
                <div className="flex flex-row gap-2 items-center">
                  <div>{item.title}</div>
                  {item.description && (
                    <div className="text-sm text-secondary-text">{item.description}</div>
                  )}
                </div>
                <div className="flex gap-2">{item.children}</div>
              </div>
            ))}
          </div>
          <GuideCommon />
        </PrimaryDiv>
      </div>
      <FeatModal
        open={open}
        title="选择重置"
        textOk="启动"
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
    </div>
  )
}
export default Common
