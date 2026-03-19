import React, { memo, useMemo, useCallback } from 'react'
import classNames from 'classnames'
import { SendOutlined, StopOutlined, ClearOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { createEditor, Descendant, Editor, Transforms, Node, BaseEditor } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'

type ParagraphElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }
type CustomElement = ParagraphElement

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  onClear: () => void
}

const emptyValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

/** 从 Slate 节点树中提取纯文本 */
const serialize = (nodes: Descendant[]): string =>
  nodes.map(n => Node.string(n)).join('\n')

/** 检查编辑器内容是否为空 */
const isEmpty = (nodes: Descendant[]) => serialize(nodes).trim().length === 0

const ChatInput: React.FC<ChatInputProps> = memo(({ onSend, onStop, onClear }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const chat = useSelector((state: RootState) => state.chat)
  const isLoading = chat.loading

  /** 重置编辑器内容 */
  const resetEditor = useCallback(() => {
    // 删除所有旧内容
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, [])
      }
    })
    // 确保始终有一个空段落
    if (editor.children.length === 0) {
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] })
    }
  }, [editor])

  const handleSend = useCallback(() => {
    const text = serialize(editor.children)
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    resetEditor()
  }, [editor, isLoading, onSend, resetEditor])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const hasContent = !isEmpty(editor.children)

  return (
    <div className="chat-input-container px-4 py-3">
      <div className="chat-input-box">
        {/* Slate 编辑器区域 */}
        <div className="chat-slate-wrapper">
          <Slate editor={editor} initialValue={emptyValue}>
            <Editable
              className="chat-slate-editable"
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </Slate>
        </div>

        {/* 底部工具栏 */}
        <div className="chat-input-toolbar">
          <button
            onClick={onClear}
            className="chat-toolbar-btn"
            title="清空对话"
          >
            <ClearOutlined />
          </button>

          <div className="flex-1" />

          {isLoading ? (
            <button
              onClick={onStop}
              className="chat-send-btn chat-stop-btn"
              title="停止生成"
            >
              <StopOutlined />
              <span>停止</span>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasContent}
              className={classNames('chat-send-btn', {
                'chat-send-btn-active': hasContent,
                'chat-send-btn-disabled': !hasContent
              })}
              title="发送消息"
            >
              <SendOutlined />
              <span>发送</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ChatInput.displayName = 'ChatInput'

export default ChatInput
