import { updateThemeMode } from '@/core/theme'
import { Button } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import { PrimaryDiv } from '@alemonjs/react-ui'
import { Switch } from '@alemonjs/react-ui'
import {
  ThemeDownloadFiles,
  ThemeLoadVariables,
  ThemeMode,
  ThemeResetTheme,
  ThemeSave
} from '@wailsjs/window/theme/app'
import Upload from 'antd/es/upload/Upload'
import _ from 'lodash'
import { useEffect, useState } from 'react'

import { Events } from '@wailsio/runtime'
import Box from '@/common/layout/Box'
const EventsOn = Events.On

const Theme = () => {
  const [data, setData] = useState<
    {
      name: string
      color: string
    }[]
  >([])
  const [update, setUpdate] = useState(false)
  const [isDark, setIsDark] = useState(false)

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
    // 找到index
    const index = _.findIndex(data, item => item.name === name)
    if (data[index].color != color) {
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
    EventsOn('theme', e => {
      try {
        const args = e.data ?? []
        const data = args[0] ?? null
        const vars = JSON.parse(data)
        const arr = Object.keys(vars).map(key => ({
          name: key.replace(/^alemonjs-/g, ''),
          color: vars[key]
        }))
        setData(arr)
      } catch (e) {
        console.error(e)
      }
    })

    ThemeMode().then(res => {
      if (res === 'dark') {
        setIsDark(true)
      } else {
        setIsDark(false)
      }
    })
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
    setIsDark(status)
    updateThemeMode(status)
  }
  return (
    <div className="animate__animated animate__fadeIn flex-1 flex-col flex size-full">
      <div className="flex-col gap-2 flex-1 flex p-4 size-full">
        <PrimaryDiv className="flex flex-col flex-1 p-2 rounded-lg shadow-inner size-full">
          <div
            className="text-2xl flex items-center justify-between font-semibold mb-4 border-b
            border-secondary-border
            dark:border-dark-secondary-border
          "
          >
            <div className="flex gap-2 items-center">
              <div>主题</div>
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
                // 只能是json文件
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
                  className="text-base px-2 rounded-lg"
                  onClick={() => {
                    saveColor()
                    setUpdate(false)
                  }}
                >
                  <div>保存</div>
                </Button>
              )}
              <Switch value={isDark} onChange={onChangeDesktop} />
            </div>
          </div>
          <Box className="gap-4 p-2">
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
                            const reg = /^#[0-9a-zA-Z]$/
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
          </Box>
        </PrimaryDiv>
      </div>
    </div>
  )
}
export default Theme
