import { useState } from 'react'
import { SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import Init from './Init'
import EditFile from './EditFile'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
export default function Template() {
  const [select, setSelect] = useState('')
  const app = useSelector((state: RootState) => state.app)

  const pages = [
    {
      title: 'npmrc',
      value: 'npmrc',
      mode: null,
      dir: app.userDataTemplatePath + '/.npmrc'
    },
    {
      title: 'package.json',
      value: 'package',
      mode: 'application/json',
      dir: app.userDataTemplatePath + '/package.json'
    },
    {
      title: 'alemon.config.yaml',
      value: 'config',
      mode: 'yaml',
      dir: app.userDataTemplatePath + '/alemon.config.yaml'
    },
    {
      title: '.puppeteerrc.cjs',
      value: 'puppeteerrc',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/.puppeteerrc.cjs'
    },
    {
      title: 'index.js',
      value: 'index',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/alemonjs/index.js'
    },
    {
      title: 'desktop.js',
      value: 'desktop',
      mode: 'javascript',
      dir: app.userDataTemplatePath + '/alemonjs/desktop.js'
    }
  ]

  const item = pages.find(item => item.value === select)

  return (
    <section className="flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        {item ? (
          <EditFile key={item.title} title={item.title} mode={item.mode} dir={item.dir} />
        ) : (
          <Init />
        )}
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col border-l overflow-auto h-[calc(100vh-2rem)]">
        {pages.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 px-2 cursor-pointer"
            onClick={() => setSelect(item.value)}
          >
            {item.title}
          </div>
        ))}
      </SidebarDiv>
    </section>
  )
}
