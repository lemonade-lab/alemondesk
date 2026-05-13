import { Button, Input, PrimaryDiv, SecondaryDiv, Switch } from '@alemonjs/react-ui'
import {
  ThemeDownloadFiles,
  ThemeLoadVariables,
  ThemeResetTheme,
  ThemeSave
} from '@wailsjs/window/theme/app'
import Upload from 'antd/es/upload/Upload'
import { useEffect, useState } from 'react'
import { Events } from '@wailsio/runtime'
import { useTheme } from '@/hook/useTheme'
import { getWailsEventArg, parseWailsJson } from '@/common/wailsEvent'
const EventsOn = Events.On

type ThemeVariable = {
  name: string
  color: string
}

const Theme = () => {
  const [data, setData] = useState<ThemeVariable[]>([])
  const [update, setUpdate] = useState(false)
  const [_theme, themeController] = useTheme()
  const isDark = _theme === 'dark'

  const saveColor = () => {
    const _data: {
      [key: string]: string
    } = {}
    for (const item of data) {
      _data[`alemonjs-${item.name}`] = item.color
    }
    // 存储
    ThemeSave(JSON.stringify(_data))
  }

  /**
   *
   * @param name
   * @param color
   */
  const onChangeColor = (name: string, color: string) => {
    const index = data.findIndex(item => item.name === name)
    if (index !== -1 && data[index].color != color) {
      data[index].color = color
      setData([...data])
      setUpdate(true)
    }
  }

  const setColor = (name: string, color: string) => {
    const _name = `alemonjs-${name}`
    document.documentElement.style.setProperty(`--${_name}`, color)
  }

  useEffect(() => {
    // 加载css变量
    ThemeLoadVariables()

    // 监听 css 变量
    const cancel = EventsOn('theme', e => {
      const vars = parseWailsJson<Record<string, string>>(getWailsEventArg(e))
      if (!vars) return
      const arr = Object.keys(vars).map(key => ({
        name: key.replace(/^alemonjs-/g, ''),
        color: vars[key]
      }))
      setData(arr)
    })

    return () => {
      if (cancel) cancel()
    }
  }, [])

  const customRequest = (options: any) => {
    const { file, onSuccess, onError } = options
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result
      if (typeof content === 'string') {
        try {
          const vars = JSON.parse(content)
          const arr = Object.keys(vars).map(key => ({
            name: key.replace(/^alemonjs-/g, ''),
            color: vars[key]
          }))
          setData(arr)
          setUpdate(true)
          Promise.all(
            arr.map(item => {
              setColor(item.name, item.color)
            })
          )
          onSuccess && onSuccess('ok')
        } catch (e) {
          onError && onError(new Error('文件内容格式错误'))
        }
      } else {
        onError && onError(new Error('文件读取失败'))
      }
    }
    reader.readAsText(file as Blob)
  }

  /**
   *
   * @param status
   */
  const onChangeDesktop = (status: boolean) => {
    if (status) {
      themeController.dark()
    } else {
      themeController.light()
    }
  }
  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="flex gap-2 items-center">
                <div className="text-xl font-semibold">主题</div>
                <Button
                  onClick={() => {
                    ThemeResetTheme().then(t => {
                      t && ThemeLoadVariables()
                    })
                  }}
                  className="text-xs px-1 rounded-lg"
                >
                  恢复默认
                </Button>
                <Button
                  onClick={() => {
                    ThemeDownloadFiles()
                  }}
                  className="text-xs px-1 rounded-lg"
                >
                  导出
                </Button>
                <Upload
                  accept=".json"
                  showUploadList={false}
                  customRequest={customRequest}
                >
                  <Button className="text-xs px-1 rounded-lg">导入</Button>
                </Upload>
              </div>
              <div className="flex gap-2 items-center">
                {update && (
                  <Button
                    className="px-3 rounded-md"
                    onClick={() => {
                      saveColor()
                      setUpdate(false)
                    }}
                  >
                    保存
                  </Button>
                )}
                <Switch value={isDark} onChange={onChangeDesktop} />
              </div>
            </div>
            <div className="flex flex-col gap-4">
            {isDark
              ? data
                  .filter(item => /dark/.test(item.name))
                  .map(item => (
                    <div key={item.name} className="flex gap-2 justify-between">
                      <div className="">{item.name}</div>

                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                          value={item.color}
                          className="rounded px-1"
                          onChange={value => {
                            const color = value.target.value
                            // #开头。且只能是数字和字母。最多6位
                            const reg = /^#[0-9a-fA-F]{0,8}$/
                            if (!reg.test(color)) return
                            onChangeColor(item.name, color)
                            setColor(item.name, color)
                          }}
                        />
                        <Input
                          type="color"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                          value={item.color}
                          onChange={value => {
                            const color = value.target.value
                            onChangeColor(item.name, color)
                            setColor(item.name, color)
                          }}
                          className="border-2  rounded"
                        />
                      </div>
                    </div>
                  ))
              : data
                  .filter(item => !/dark/.test(item.name))
                  .map(item => (
                    <div key={item.name} className="flex gap-2 justify-between">
                      <div className="">{item.name}</div>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          value={item.color}
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                          className="rounded px-1"
                          onChange={value => {
                            const color = value.target.value
                            // #开头。且只能是数字和字母。最多12位
                            const reg = /^(#[0-9a-zA-Z]{1,12}|#)$/
                            if (!reg.test(color)) return
                            onChangeColor(item.name, color)
                            setColor(item.name, color)
                          }}
                        />
                        <Input
                          type="color"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                          value={item.color}
                          onChange={value => {
                            const color = value.target.value
                            onChangeColor(item.name, color)
                            setColor(item.name, color)
                          }}
                          className="border-2  rounded"
                        />
                      </div>
                    </div>
                  ))}
            </div>
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
    </section>
  )
}
export default Theme
