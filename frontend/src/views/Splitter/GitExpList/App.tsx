import { useEffect } from 'react'
import { SidebarDiv } from '@alemonjs/react-ui'
import { useNotification } from '@/context/Notification'
import { Select } from '@alemonjs/react-ui'
import { GitDelete, GitReposList } from '@wailsjs/window/git/app'
import { GitRepoInfo } from '@wailsjs/window/git/models'
import PackageList from './PackageList'
import PackageClone from './PackageClone'
import Tabs from '@/common/ui/Tabs'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { AppExists, AppReadFiles } from '@wailsjs/window/app/app'
import { setCurrentRepo, setData, setLoading, setSpace, setTabValue } from '@/store/gitExp'
import { setViews } from '@/store/views'

const initialSpace = 'packages'
const spaceOptions = [initialSpace, 'plugins']

const spaceMap: { [key: string]: string } = {
  packages: '扩展包',
  plugins: '插件'
}

export default function GitExpList() {
  const notification = useNotification()
  const app = useSelector((state: RootState) => state.app)
  const gitExp = useSelector((state: RootState) => state.gitExp)
  const dispatch = useDispatch()

  /**
   * @param item
   * @returns
   */
  const onDelete = async (item: string) => {
    if (gitExp.loading) {
      // 正在提交
      notification('操作锁定中，请稍等', 'warning')
      return
    }
    dispatch(setLoading(true))
    notification('正在删除仓库..')
    GitDelete(gitExp.space, item)
  }

  const loadRepositoryInfo = async (item: GitRepoInfo) => {
    // 构建文件路径
    const basePath = `${app.userDataTemplatePath}/${gitExp.space}/${item.Name}`
    const readmePath = `${basePath}/README.md`
    const packageJsonPath = `${basePath}/package.json`

    // 检查是否是当前正在显示的仓库
    const isSameRepo =
      gitExp.currentRepo.item &&
      gitExp.currentRepo.item.Name === item.Name &&
      gitExp.currentRepo.show

    // 并行检查文件存在性
    const [readmeExists, packageExists] = await Promise.all([
      AppExists(readmePath),
      AppExists(packageJsonPath)
    ])

    // 并行读取文件内容
    let readmeContent = '未找到 README.md 文件(若刚克隆请稍等片刻再回来)...'
    let packageContent = null
    let packageString = ''

    if (readmeExists) {
      readmeContent = await AppReadFiles(readmePath)
    }

    if (packageExists) {
      try {
        const packageFileContent = await AppReadFiles(packageJsonPath)
        packageString = packageFileContent
        packageContent = JSON.parse(packageFileContent)
      } catch (error) {
        console.error('解析 package.json 失败:', error)
        packageString = '解析 package.json 失败'
        packageContent = null
      }
    }

    // 如果是同一个仓库且正在显示，更新内容
    if (isSameRepo) {
      dispatch(
        setCurrentRepo({
          ...gitExp.currentRepo,
          readme: readmeContent,
          package: packageContent,
          packageString: packageString
        })
      )
      // 切换视图到当前仓库
      dispatch(
        setViews({
          key: 'git-warehouse'
        })
      )
      return
    }

    // 设置新的仓库信息
    dispatch(
      setCurrentRepo({
        item,
        package: packageContent,
        packageString: packageString,
        show: true,
        readme: readmeContent,
        branches: [],
        commits: []
      })
    )
  }

  const updateReposList = () => {
    GitReposList(gitExp.space).then(res => {
      dispatch(setData(res || []))
    })
  }

  useEffect(() => {
    updateReposList()
  }, [gitExp.space])

  return (
    <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col border-l size-full">
      <div className="flex px-2 py-1 gap-2">
        <Tabs
          value={gitExp.tabValue}
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
          onChange={value => {
            dispatch(setTabValue(value))
          }}
        />
        <div className="text-sm flex gap-2 items-center justify-center">
          <Select
            className="rounded-md"
            value={gitExp.space}
            onChange={(e: any) => {
              const value = e.target?.value
              dispatch(setSpace(value ?? initialSpace))
            }}
          >
            {spaceOptions.map((item, index) => {
              return (
                <option key={index} value={item}>
                  {spaceMap[item]}
                </option>
              )
            })}
          </Select>
        </div>
      </div>
      <PackageList
        show={gitExp.tabValue === '1'}
        data={gitExp.data}
        onDelete={onDelete}
        onSelect={loadRepositoryInfo}
      />
      <PackageClone show={gitExp.tabValue === '2'} space={gitExp.space} />
    </SidebarDiv>
  )
}
