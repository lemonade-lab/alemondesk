import React, { memo, useMemo, useCallback, useEffect, useState, useRef } from 'react'
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

interface QuickCategory {
  title: string
  items: { label: string; text: string }[]
}

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  onClear: () => void
  editingContent?: string | null
  onEditingConsumed?: () => void
  quickCategories?: QuickCategory[]
}

const emptyValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

/** 从 Slate 节点树中提取纯文本 */
const serialize = (nodes: Descendant[]): string =>
  nodes.map(n => Node.string(n)).join('\n')

/** 检查编辑器内容是否为空 */
const isEmpty = (nodes: Descendant[]) => serialize(nodes).trim().length === 0

const ChatInput: React.FC<ChatInputProps> = memo(({ onSend, onStop, onClear, editingContent, onEditingConsumed, quickCategories = [] }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const chat = useSelector((state: RootState) => state.chat)
  const isLoading = chat.loading
  const [showQuick, setShowQuick] = useState(false)
  const quickRef = useRef<HTMLDivElement>(null)

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

  // 编辑消息时将内容填入输入框
  useEffect(() => {
    if (editingContent != null) {
      // 先清空
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, [])
        }
      })
      // 按行拆分插入
      const lines = editingContent.split('\n')
      const nodes: Descendant[] = lines.map(line => ({
        type: 'paragraph' as const,
        children: [{ text: line }]
      }))
      Transforms.removeNodes(editor, { at: [0] })
      Transforms.insertNodes(editor, nodes, { at: [0] })
      // 光标移到末尾
      Transforms.select(editor, Editor.end(editor, []))
      ReactEditor.focus(editor)
      onEditingConsumed?.()
    }
  }, [editingContent, editor, onEditingConsumed])

  const handleSend = useCallback(() => {
    const text = serialize(editor.children)
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    resetEditor()
  }, [editor, isLoading, onSend, resetEditor])

  // 点击快捷指令
  const handleQuickSend = useCallback(
    (text: string) => {
      if (isLoading) return
      setShowQuick(false)
      onSend(text)
    },
    [isLoading, onSend]
  )

  // 点击外部关闭弹出层
  useEffect(() => {
    if (!showQuick) return
    const handleClickOutside = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as HTMLElement)) {
        setShowQuick(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showQuick])

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
    <div className="chat-input-container px-1 py-2 relative" ref={quickRef}>
      {/* 快捷指令弹出层 — 渲染在 chat-input-box 外部，避免 overflow 裁剪 */}
      {showQuick && (
        <div className="absolute bottom-full left-4 mb-2 w-48 max-h-52 overflow-y-auto rounded-md shadow-lg border border-secondary-border dark:border-dark-secondary-border bg-primary-bg dark:bg-dark-primary-bg z-50 py-1">
          {quickCategories.map(cat => (
            <div key={cat.title}>
              <div className="px-2.5 py-1 text-[10px] font-medium opacity-40 sticky top-0 bg-primary-bg dark:bg-dark-primary-bg">
                {cat.title}
              </div>
              {cat.items.map(q => (
                <button
                  key={q.label}
                  className="w-full text-left px-2.5 py-1 text-xs hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors leading-tight"
                  disabled={isLoading}
                  onClick={() => handleQuickSend(q.text)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

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

          {/* 快捷指令按钮 */}
          <button
            onClick={() => setShowQuick(v => !v)}
            className={classNames('chat-toolbar-btn', { 'opacity-100': showQuick })}
            title="快捷指令"
          >
            <span className="font-mono font-bold text-sm">/</span>
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
