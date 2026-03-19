import React from 'react'
import { Splitter } from 'antd'
import Terminal from '@/views/Terminal/App'
import ChatPanel from './ChatPanel'
import ConversationList from './ConversationList'

const HomeMain: React.FC = () => {
  return (
    <Splitter className="h-[calc(100vh-29.8px)] max-w-[calc(100vw-48px)]">
      <Splitter.Panel>
        <Splitter layout="vertical">
          <Splitter.Panel min="40%" collapsible>
            <ChatPanel />
          </Splitter.Panel>
          <Splitter.Panel defaultSize="30%" min="20%" collapsible>
            <Terminal />
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel style={{ overflow: 'hidden' }} collapsible defaultSize="20%" min="15%" max="30%">
        <ConversationList />
      </Splitter.Panel>
    </Splitter>
  )
}

export default HomeMain
