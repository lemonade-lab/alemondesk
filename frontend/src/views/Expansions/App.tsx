import { useEffect, useRef, useState } from 'react'
import { debounce } from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useNotification } from '@/context/Notification'
import { Button, SecondaryDiv, Select } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import PackageInfo, { PackageInfoType } from './PackageInfo'
import ExpansionsCard from './ExpansionsCard'
import Init from './Init'
import { EnterOutlined } from '@ant-design/icons'
import { AppReadFiles } from '@wailsjs/go/windowapp/App'
import { ExpansionsPostMessage } from '@wailsjs/go/windowexpansions/App'
import { YarnCommands } from '@wailsjs/go/windowyarn/App'
import { EventsOn } from '@wailsjs/runtime/runtime'
import classNames from 'classnames'

export default function Expansions() {
  const app = useSelector((state: RootState) => state.app)
  const [packageInfo, setPackageInfo] = useState<PackageInfoType | null>(null)
  const packageInfoRef = useRef<PackageInfoType | null>(null)
  const notification = useNotification()
  const [select, setSelect] = useState('')
  const expansions = useSelector((state: RootState) => state.expansions)
  const [inputValue, setIputValue] = useState('')
  const [submit, setSubmit] = useState(false)
  const fromNameRef = useRef('')
  const noValueSelect = ['install', 'list']
  const selects = ['add', 'remove', 'link', 'unlink', ...noValueSelect]
  const [value, setValue] = useState(selects[0])

  // 查看扩展信息
  const handlePackageClick = debounce(async (packageName: string) => {
    const info = expansions.package.find(v => v.name === packageName)
    if (!info) {
      notification(`本地没有找到 ${packageName} 的数据。`, 'error')
      return
    }
    const dir = app.userDataNodeModulesPath + '/' + packageName + '/README.md'
    let __logo = null
    let __icon = null
    if (info?.alemonjs?.desktop?.logo) {
      if (info.alemonjs.desktop.logo.startsWith('antd.')) {
        __icon = info.alemonjs.desktop.logo
      } else {
        const __dir = info.alemonjs.desktop.logo.replace(/^\./, '').replace(/^\//, '')
        __logo = app.userDataNodeModulesPath + '/' + packageName + '/' + __dir
      }
    }
    const data = {
      'name': info?.name || '',
      'description': info?.description || '',
      'author': info?.author || null,
      'dist-tags': { latest: info?.version || '' },
      'version': info?.version || '',
      'readme': '',
      'isLink': info?.isLink || false,
      'isGit': info?.isGit || false,
      '__logo': __logo,
      '__icon': __icon
    }
    try {
      const readme = await AppReadFiles(dir)
      data.readme = readme
    } catch (err) {
      console.error(err)
    }
    setPackageInfo(data)
  }, 500)

  useEffect(() => {
    if (packageInfo) packageInfoRef.current = packageInfo
    if (packageInfo) setSelect('shoping')
  }, [packageInfo])

  /**
   * @param e
   * @returns
   */
  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 选择版本,立即切换到该版本
    const value = e.target.value
    setValue(value)
  }

  /**
   *
   * @param e
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIputValue(e.target.value)
  }

  /**
   *
   * @param e
   * @returns
   */
  const onClickSync = () => {
    //
    if (submit) {
      notification('正在执行中，请稍后', 'warning')
      return
    }

    if (!value) return

    if (noValueSelect.includes(value)) {
      setSubmit(true)
      YarnCommands({
        type: `cmd`,
        args: [value]
      })
      return
    }

    if (!inputValue || inputValue == '') return

    const inputValues = inputValue.split(' ')

    setSubmit(true)

    if (value == 'add') {
      // 没有参数的时候，自动添加 -W
      if (!inputValues.includes('-W')) {
        inputValues.push('-W')
      }
    }

    const cmd = [value].concat(inputValues)

    YarnCommands({
      type: `cmd`,
      args: cmd
    })
  }

  useEffect(() => {
    fromNameRef.current = `${value} ${inputValue}`
  }, [value, inputValue])

  useEffect(() => {
    // 监听 yarn 命令
    EventsOn('yarn', data => {
      if (!data || !data.type || data.type != 'cmd') return

      //  结束加载状态
      setSubmit(false)

      const value = data.value
      if (value == 0) {
        notification(`yarn ${fromNameRef.current} 失败`, 'warning')
        return
      }

      // 成功
      notification(`yarn ${fromNameRef.current} 完成`)

      // 匹配到有关更改包的都重新获取扩展列表。
      if (!fromNameRef.current.match(/(add|remove|link|unlink)/)) {
        return
      }

      // 重新获取扩展列表
      ExpansionsPostMessage({
        type: 'get-expansions'
      })
    })
  }, [])

  const selectsMap: {
    [key: string]: string
  } = {
    add: '添加',
    remove: '移除',
    link: '链接',
    unlink: '取消链接',
    install: '安装',
    list: '列表'
  }

  return (
    <section className=" flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        {select == '' && <Init />}
        {select == 'shoping' && packageInfo && (
          <div
            className={classNames(
              'select-text overflow-auto scrollbar h-[calc(100vh-5rem)] max-w-[calc(100vw-21.5rem)]'
            )}
          >
            <PackageInfo packageInfo={packageInfo} />
          </div>
        )}
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col  w-72 xl:w-80 border-l h-full">
        <div className="flex px-2 py-1 gap-2">
          <div className="text-[1rem] flex gap-2 items-center justify-center ">
            <Select onChange={onSelect} className="rounded-md px-2">
              {selects.map((v, i) => (
                <option key={i} value={v}>
                  {selectsMap[v]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-1 items-center">
            <Input
              type="text"
              name="name"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              placeholder="输入扩展名(可选)"
              value={inputValue}
              onChange={handleChange}
              className="w-full px-2 py-1 rounded-sm"
            />
            <Button className="px-2 rounded-full" onClick={onClickSync}>
              <EnterOutlined />
            </Button>
          </div>
        </div>
        <div className="flex-1 ">
          <SecondaryDiv className="flex flex-col gap-1  border-t py-2 overflow-auto  h-[calc(100vh-5.9rem)]">
            {expansions.package.map(item => (
              <ExpansionsCard
                item={item}
                key={item.name}
                handlePackageClick={name => handlePackageClick(name)}
              />
            ))}
          </SecondaryDiv>
        </div>
      </SidebarDiv>
    </section>
  )
}
