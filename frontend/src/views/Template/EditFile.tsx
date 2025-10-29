import { useEffect, useState } from 'react'
import { useNotification } from '@/context/Notification'
import { Button } from '@alemonjs/react-ui'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/go/windowapp/App'
import FileEdit from '@/common/FileEdit'

type EditFileProps = {
  title: string
  dir: string
  mode?: string
}

/**
 *
 * @returns
 */
export default function EditFile({ title, dir, mode }: EditFileProps) {
  const notification = useNotification()
  const [value, setValue] = useState(``)
  const [initValue, setInitValue] = useState('')
  // 保存
  const onSave = async (value: string) => {
    const isDir = await AppExists(dir)
    if (!isDir) {
      notification(title + '不存在')
      return
    }
    // 保存数据。
    const T = await AppWriteFiles(dir, value)
    if (T) {
      setInitValue(value)
    } else {
      notification('保存失败', 'error')
    }
  }
  // 初始化数据
  const initData = async () => {
    const isDir = await AppExists(dir)
    if (!isDir) {
      notification(title + '不存在')
      return
    }
    const data = await AppReadFiles(dir)
    if (data && data != '') {
      setValue(data)
      setInitValue(data)
    }
  }
  // 放弃
  const onGiveUp = () => {
    setValue(initValue)
  }
  // 初始化
  useEffect(() => {
    initData()
  }, [])
  return (
    <FileEdit
      language={mode || 'markdown'}
      name={title}
      disableName
      value={value}
      onSave={(_, value) => onSave(value)}
      controller={({ value }) => {
        if (initValue && value && initValue !== value)
          return (
            <Button className="px-2 rounded-md" onClick={() => onGiveUp()}>
              放弃
            </Button>
          )
        return null
      }}
    />
  )
}