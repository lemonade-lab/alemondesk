import React from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import logoURL from '@/assets/logo.jpg'

const HomeMain: React.FC = () => {
  return (
    <div className="relative flex-1 size-full">
      {/* 居中的背景图片 */}
      <img
        src={logoURL}
        alt="logo"
        className="w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
      />
      {/* 前景内容 */}
      <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)] z-10 relative">
        <Splitter.Panel>
          <Splitter layout="vertical">
            <Splitter.Panel collapsible></Splitter.Panel>
            <Splitter.Panel defaultSize="30%" collapsible>
              <Terminal />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </div>
  )
}

export default HomeMain
