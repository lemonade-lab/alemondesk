import { useEffect, useRef, useState } from 'react'
import Init from './Init'
import { SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import { Input } from '@alemonjs/react-ui'
import { DeleteFilled, FolderAddOutlined } from '@ant-design/icons'
import CodeDiff from './CodeDiff'
import { useNotification } from '@/context/Notification'
import { extractRepoInfo, isGitRepositoryFormat } from '@/api'
import Markdown from '@/common/Markdown'
import { Tooltip } from '@alemonjs/react-ui'
import { Select } from '@alemonjs/react-ui'
import { GitClone, GitDelete, GitReposList } from '@wailsjs/go/windowgit/App'
import { windowgit } from '@wailsjs/go/models'
import { AppExists, AppReadFiles } from '@wailsjs/go/windowapp/App'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'

const initialSpace = 'packages'
const spaceOptions = [initialSpace, 'plugins']

const spaceMap: { [key: string]: string } = {
  packages: '扩展包',
  plugins: '插件'
}

export default function Expansions() {
  const [select, setSelect] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const notification = useNotification()
  const [data, setData] = useState<windowgit.GitRepoInfo[]>([])
  const [sub, setSub] = useState(false)
  const [space, setSpace] = useState(initialSpace)
  const [readme, setReadme] = useState('')
  const [diffedCode, setdiffedCode] = useState('')
  const app = useSelector((state: RootState) => state.app)

  /**
   *
   * @returns
   */
  const onAdd = async () => {
    const value = searchValue.trim()
    if (value === '') {
      notification('请输入仓库地址', 'warning')
      return
    }
    if (sub) {
      // 正在提交
      return
    }
    try {
      setSub(true)

      if (!isGitRepositoryFormat(value)) {
        notification('格式错误', 'warning')
        setSub(false)
        return
      }

      // 根据 url 解析成仓库地址
      const { username, repository, platform } = extractRepoInfo(value)

      if (data.find(item => item.Name === repository)) {
        notification('该仓库已存在', 'warning')
        setSub(false)
        return
      }

      notification('正在添加仓库..')

      await GitClone(space, value).then(res => {
        notification('添加成功')
        // 更新列表
        GitReposList(space).then(res => {
          setData(res || [])
        })
      })
    } catch (error: any) {
      notification('操作失败:' + error.message, 'error')
    } finally {
      setSub(false)
    }
  }

  /**
   *
   */
  const onFetch = async (item: string) => {
    if (sub) {
      // 正在提交
      notification('操作锁定中，请稍等', 'warning')
      return
    }
    setSub(true)

    notification('开始同步所有分支..')

    setSub(false)
  }

  /**
   *
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
        <div className="flex justify-between px-2 py-1">
          <div className=" cursor-pointer" onClick={() => setSelect('')}>
            仓库列表
          </div>
          <div className="text-[0.7rem] flex gap-2 items-center justify-center ">
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
        <div className="flex items-center">
          <Input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="https://xxx.git或git@xxx.git"
            className="w-full px-2 py-1 rounded-sm"
          />
          <Tooltip text="安装仓库">
            <div className="px-2" onClick={onAdd}>
              <FolderAddOutlined />
            </div>
          </Tooltip>
        </div>
        <div className="flex-1 ">
          <SecondaryDiv className="flex flex-col gap-1  border-t py-2  overflow-auto  h-[calc(100vh-5.9rem)]">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer"
              >
                <div
                  onClick={async () => {
                    if (!item.IsFullRepo) {
                      notification('该仓库损坏，无法查看', 'warning')
                      return
                    }
                    const dir = `${app.userDataTemplatePath}/${space}/${item.Name}/README.md`
                    const T = await AppExists(dir)
                    if (!T) {
                      notification('该仓库没有README.md文件', 'warning')
                      return
                    }
                    const data = await AppReadFiles(dir)
                    setSelect('readme')
                    setReadme(data)
                  }}
                >
                  {item.Name}
                  {!item.IsFullRepo && '(损坏)'}
                </div>
                <div className="flex gap-2">
                  <div
                    className="text-red-500"
                    onClick={e => {
                      e.stopPropagation()
                      onDelete(item.Name)
                    }}
                  >
                   <DeleteFilled />
                  </div>
                </div>
              </div>
            ))}
          </SecondaryDiv>
        </div>
      </SidebarDiv>
    </section>
  )
}
