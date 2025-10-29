import { useEffect, useState } from 'react'
import MonacoEditor from './MonacoEditor'
import useCodeTheme from '@/hook/useCodeTheme'
import { createMonacoChineseConfig } from './monacoI18n'
import { Button, Input } from '@alemonjs/react-ui'
import { useNotification } from '@/context/Notification'

const FileEdit = ({
  name,
  value,
  onSave,
  disableName = false,
  language = 'plaintext',
  controller = undefined
}: {
  name?: string
  value: string
  onSave: (name: string, value: string) => void
  disableName?: boolean
  language?: string
  controller?: ({ value }: { value: string }) => React.ReactNode
}) => {
  const notification = useNotification()
  const [fileData, setFileData] = useState<string>(value || '')
  const [inputValue, setInputValue] = useState<string>(name || '')
  const theme = useCodeTheme()

  useEffect(() => {
    setFileData(value || '')
    if (name) {
      setInputValue(name)
    }
  }, [name, value])

  const handleCodeChange = (val: string | undefined) => {
    setFileData(val ?? '')
  }

  // 获取MonacoEditor稳定配置
  const monacoConfig = createMonacoChineseConfig(language, theme)

  const handleSave = () => {
    if (!inputValue) {
      notification('文件名不能为空', 'error')
      return
    }
    onSave(inputValue, fileData)
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br ">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r rounded-t-xl">
        <div className="flex items-center gap-3">
          {!disableName && (
            <div className="relative">
              <Input
                value={inputValue}
                placeholder="文件名称"
                onChange={e => setInputValue(e.target.value)}
                style={{ minWidth: 120 }}
              />
            </div>
          )}
          {disableName && (
            <div className="px-4 py-2 inline-block">
              <span className="">{name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button className="px-2 rounded-md" onClick={handleSave}>
            保存
          </Button>
          {controller && controller({ value: fileData })}
        </div>
      </div>

      {/* 编辑器区域 */}
      <MonacoEditor
        disabled={false}
        onSave={() => {
          handleSave()
        }}
        value={fileData}
        language={language}
        width="100%"
        height="100%"
        theme={theme}
        onChange={handleCodeChange}
        {...monacoConfig}
      />
    </div>
  )
}

export default FileEdit
