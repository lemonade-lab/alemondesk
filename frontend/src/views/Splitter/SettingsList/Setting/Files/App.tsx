import { useState } from 'react'
import { SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import Init from './Init'
import EditFile from './EditFile'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
export default function Files() {
  const app = useSelector((state: RootState) => state.app)
  const [select, setSelect] = useState('')

  const pages = [
    {
      title: 'alemon.config.yaml',
      name: "机器人配置",
      value: 'config',
      mode: 'yaml',
      dir: app.userDataTemplatePath + '/alemon.config.yaml'
    },
    {
      title: 'package.json',
      name: "包管理配置",
      value: 'package',
      mode: 'application/json',
      dir: app.userDataTemplatePath + '/package.json'
    },
    {
      title: 'npmrc',
      name: "依赖配置",
      value: 'npmrc',
      mode: null,
      dir: app.userDataTemplatePath + '/.npmrc'
    },
    {
      title: '.puppeteerrc.cjs',
      name: "浏览器配置",
      value: 'puppeteerrc',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/.puppeteerrc.cjs'
    },
    {
      title: 'index.js',
      name: "机器人脚本",
      value: 'index',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/alemonjs/index.js'
    },
    {
      title: 'desktop.js',
      name: "扩展器脚本",
      value: 'desktop',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/alemonjs/desktop.js'
    }
  ]

  const item = pages.find(item => item.value === select)

  return (
    <section className="flex flex-row flex-1 h-full shadow-md size-full">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        {item ? (
          <EditFile key={item.title} title={item.title} mode={item?.mode ?? ''} dir={item.dir} />
        ) : (
          <Init />
        )}
      </SecondaryDiv>
      <SidebarDiv className="flex flex-col border-l overflow-y-auto">
        {pages.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 px-2 cursor-pointer"
            onClick={() => setSelect(item.value)}
          >
            {item.name}
          </div>
        ))}
      </SidebarDiv>
    </section>
  )
}
