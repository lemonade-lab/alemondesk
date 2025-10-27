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
  return (
    <section className="flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 max-w-[40rem]">
        {select == '' && <Init />}
        {[
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
        ].map((item, index) => {
          if (select === item.value) {
            return <EditFile key={index} title={item.title} mode={item.mode} dir={item.dir} />
          }
          return null
        })}
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col w-[10rem] border-l h-full">
        <div className="flex-1 ">
          <SecondaryDiv className="flex flex-col gap-1  border-t py-2  overflow-auto  h-[calc(100vh-5.9rem)]">
            {[
              {
                name: 'package.json',
                value: 'package'
              },
              {
                name: '.npmrc',
                value: 'npmrc'
              },
              {
                name: '.puppeteerrc.cjs',
                value: 'puppeteerrc'
              },
              {
                name: 'alemon.config.yaml',
                value: 'config'
              },
              {
                name: 'alemonjs/index.js',
                value: 'index'
              },
              {
                name: 'alemonjs/desktop.js',
                value: 'desktop'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 px-2 cursor-pointer"
                onClick={() => setSelect(item.value)}
              >
                {item.name}
              </div>
            ))}
          </SecondaryDiv>
        </div>
      </SidebarDiv>
    </section>
  )
}
