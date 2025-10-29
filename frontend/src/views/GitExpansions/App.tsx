import { useEffect, useState } from 'react'
import Init from './Init'
import { Button, SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import CodeDiff from './CodeDiff'
import { useNotification } from '@/context/Notification'
import Markdown from '@/common/Markdown'
import { Select } from '@alemonjs/react-ui'
import { GitDelete, GitReposList } from '@wailsjs/go/windowgit/App'
import { windowgit } from '@wailsjs/go/models'
import PackageList from './PackageList'
import PackageClone from './PackageClone'

const initialSpace = 'packages'
const spaceOptions = [initialSpace, 'plugins']

const spaceMap: { [key: string]: string } = {
  packages: '扩展包',
  plugins: '插件'
}

const Tabs = ({
  options,
  value,
  onChange
}: {
  options: {
    key: string
    label: string
  }[]
  value: string
  onChange: (key: string) => void
}) => {
  return (
    <div className="flex px-2 py-1 gap-2">
      {options.map((item, index) => (
        <Button className=" rounded-md px-2" onClick={() => onChange(item.key)} key={index}>
          {item.label}
        </Button>
      ))}
    </div>
  )
}

export default function Expansions() {
  const [select, setSelect] = useState('')
  const notification = useNotification()
  const [data, setData] = useState<windowgit.GitRepoInfo[]>([])
  const [sub, setSub] = useState(false)
  const [space, setSpace] = useState(initialSpace)
  const [readme, setReadme] = useState('')
  const [diffedCode, setdiffedCode] = useState('')
  const [tabValue, setTabValue] = useState('1')

  /**
   * @param item
   * @returns
   */
  const onDelete = async (item: string) => {
    if (sub) {
      // 正在提交
      notification('操作锁定中，请稍等', 'warning')
      return
    }
    setSub(true)
    notification('正在删除仓库..')
    const T = await GitDelete(space, item)
    if (T) {
      notification('删除成功')
      // 更新列表
      GitReposList(space).then(res => {
        setData(res || [])
      })
    }
    setSub(false)
  }

  useEffect(() => {
    if (readme == '' && diffedCode == '') {
      setSelect('')
    }
  }, [readme])

  const [selectValue, setSelectValue] = useState('')

  useEffect(() => {
    GitReposList(space).then(res => {
      setData(res || [])
    })
  }, [space])

  return (
    <section className=" flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        {select == '' && <Init />}
        {select === 'readme' && (
          <div className="select-text">
            <div className="overflow-auto scrollbar h-[calc(100vh-3rem)] max-w-[calc(100vw-21.5rem)]">
              <Markdown source={readme} />
            </div>
          </div>
        )}
        {select === 'diffcode' && (
          <div className="select-text">
            <CodeDiff content={diffedCode} />
          </div>
        )}
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col  w-72 xl:w-80 border-l h-full">
        <div className="flex px-2 gap-2">
          <Tabs
            value={tabValue}
            options={[
              {
                key: '1',
                label: '扩展列表'
              },
              {
                key: '2',
                label: '克隆仓库'
              }
            ]}
            onChange={setTabValue}
          />
          <div className="text-[1.05rem] flex gap-2 items-center justify-center ">
            <Select
              className="rounded-md"
              value={space}
              onChange={(e: any) => {
                const value = e.target?.value
                setSpace(value ?? initialSpace)
              }}
            >
              {spaceOptions.map((item, index) => {
                if (item == selectValue) {
                  return (
                    <option key={index} value={item} selected>
                      {item}
                    </option>
                  )
                }
                return (
                  <option key={index} value={item}>
                    {spaceMap[item]}
                  </option>
                )
              })}
            </Select>
          </div>
        </div>
        <div className="flex-1 ">
          {tabValue === '1' && (
            <PackageList
              data={data}
              space={space}
              onDelete={onDelete}
              setSelect={setSelect}
              setReadme={setReadme}
            />
          )}
          {tabValue === '2' && <PackageClone data={data} setData={setData} space={space} />}
        </div>
      </SidebarDiv>
    </section>
  )
}
