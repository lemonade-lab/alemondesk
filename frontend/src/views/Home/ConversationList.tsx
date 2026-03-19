import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames'
import { RootState } from '@/store'
import {
  createConversation,
  switchConversation,
  deleteConversation,
  renameConversation
} from '@/store/chat'
import { SidebarDiv } from '@alemonjs/react-ui'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  MessageOutlined
} from '@ant-design/icons'

let _convCounter = 0
const genConvId = () => `conv_${Date.now()}_${++_convCounter}`

const ConversationList: React.FC = () => {
  const dispatch = useDispatch()
  const chat = useSelector((state: RootState) => state.chat)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleNew = useCallback(() => {
    dispatch(createConversation({ id: genConvId() }))
  }, [dispatch])

  const handleSwitch = useCallback(
    (id: string) => {
      if (id !== chat.activeConversationId) {
        dispatch(switchConversation(id))
      }
    },
    [dispatch, chat.activeConversationId]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      dispatch(deleteConversation(id))
    },
    [dispatch]
  )

  const handleStartRename = useCallback((e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(title)
  }, [])

  const handleConfirmRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (editingId && editTitle.trim()) {
        dispatch(renameConversation({ id: editingId, title: editTitle.trim() }))
      }
      setEditingId(null)
    },
    [dispatch, editingId, editTitle]
  )

  return (
    <SidebarDiv className="flex flex-col size-full border-l">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">对话列表</span>
        <button
          onClick={handleNew}
          className="size-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          title="新建对话"
        >
          <PlusOutlined style={{ fontSize: 12 }} />
        </button>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto chat-messages-scroll">
        {chat.conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 opacity-30 text-xs select-none">
            <MessageOutlined className="text-2xl mb-2" />
            <span>暂无对话</span>
          </div>
        ) : (
          chat.conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => handleSwitch(conv.id)}
              className={classNames(
                'group flex items-center gap-2 px-3 py-2 cursor-pointer border-b text-sm transition-colors',
                {
                  'conv-item-active': conv.id === chat.activeConversationId,
                  'conv-item': conv.id !== chat.activeConversationId
                }
              )}
            >
              <MessageOutlined className="flex-shrink-0 opacity-40" style={{ fontSize: 12 }} />

              {editingId === conv.id ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmRename(e as unknown as React.MouseEvent)
                  }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-transparent border-b outline-none text-sm"
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate">{conv.title}</span>
              )}

              {/* 操作按钮 */}
              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === conv.id ? (
                  <button
                    onClick={handleConfirmRename}
                    className="size-5 flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <CheckOutlined style={{ fontSize: 10 }} />
                  </button>
                ) : (
                  <button
                    onClick={e => handleStartRename(e, conv.id, conv.title)}
                    className="size-5 flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <EditOutlined style={{ fontSize: 10 }} />
                  </button>
                )}
                <button
                  onClick={e => handleDelete(e, conv.id)}
                  className="size-5 flex items-center justify-center rounded hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                >
                  <DeleteOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SidebarDiv>
  )
}

export default ConversationList
