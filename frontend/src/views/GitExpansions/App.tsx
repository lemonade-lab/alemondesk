import { useEffect, useState } from 'react'
import Init from './Init'
import { Button, SecondaryDiv } from '@alemonjs/react-ui'
import { SidebarDiv } from '@alemonjs/react-ui'
import { useNotification } from '@/context/Notification'
import Markdown from '@/common/Markdown'
import { Select } from '@alemonjs/react-ui'
import { GitClone, GitDelete, GitReposList } from '@wailsjs/go/windowgit/App'
import { windowgit } from '@wailsjs/go/models'
import PackageList from './PackageList'
import PackageClone, { PackageCloneProps } from './PackageClone'
import Tabs from '@/common/ui/Tabs'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/go/windowapp/App'
import classNames from 'classnames'
import MonacoEditor from '@/common/MonacoEditor'
import YAML from 'js-yaml'

const initialSpace = 'packages'
const spaceOptions = [initialSpace, 'plugins']

const spaceMap: { [key: string]: string } = {
  packages: '扩展包',
  plugins: '插件'
}

export default function Expansions() {
  const notification = useNotification()
  const [data, setData] = useState<windowgit.GitRepoInfo[]>([])
  const [sub, setSub] = useState(false)
  const [space, setSpace] = useState(initialSpace)
  const [tabValue, setTabValue] = useState('1')
  const [messageValue, setMessageValue] = useState('readme')
  const app = useSelector((state: RootState) => state.app)

  // 当前选择的仓库
  const [currentRepo, setCurrentRepo] = useState({
    item: null as windowgit.GitRepoInfo | null,
    show: false,
    package: null as null | {
      name: string
    },
    packageString: '',
    // readme 内容
    readme: '',
    // 分支列表
    branches: [] as string[],
    // 提交记录
    commits: [] as Array<{
      hash: string
      message: string
    }>
  })

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

  const onAdd: PackageCloneProps['onSubmit'] = async (value, { finished }) => {
    if (data.find(item => item.Name === value.repository)) {
      notification('该仓库已存在', 'warning')
      finished()
      return
    }
    notification('正在添加仓库..')
    await GitClone({
      RepoURL: value.url,
      Branch: value.branch,
      Depth: value.depth,
      Space: space,
      Force: value.force
    })
    // 更新列表
    const res = await GitReposList(space)
    setData(res || [])
    notification('添加成功')
    finished()
  }

  const updatePackageData = async () => {
    const dir = `${app.userDataTemplatePath}/${space}/${currentRepo?.item?.Name}/package.json`
    // 如果没有 package.json 则不切换
    const T = await AppExists(dir)
    if (!T) {
      return
    }
    const data = await AppReadFiles(dir)
    const pkg = JSON.parse(data)
    setCurrentRepo({
      ...currentRepo,
      packageString: data,
      package: pkg
    })
    return pkg
  }

  const onChangeTag = async (tag: string) => {
    if (!currentRepo.show) {
      return
    }
    if (tag === messageValue) {
      return
    } else if (tag === 'readme' && !currentRepo.readme) {
      const dir = `${app.userDataTemplatePath}/${space}/${currentRepo?.item?.Name}/README.md`
      // 如果没有 readme 则不切换
      const T = await AppExists(dir)
      if (!T) {
        return
      }
      const data = await AppReadFiles(dir)
      setCurrentRepo({
        ...currentRepo,
        readme: data
      })
    } else if (tag === 'branches') {
      // TODO 获取分支列表
    } else if (tag === 'commits') {
      // TODO 获取提交记录
    } else if (tag === 'package' && !currentRepo.package) {
      updatePackageData()
    }
    setMessageValue(tag)
  }

  const [appsMap, setAppsMap] = useState<{
    [s: string]: boolean
  }>({})
  const [configValues, setConfigValues] = useState<any>({})

  const updateConfig = async () => {
    const dir = app.userDataTemplatePath + '/alemon.config.yaml'
    const isDir = await AppExists(dir)
    if (!isDir) {
      return
    }
    const data = await AppReadFiles(dir)
    if (data && data != '') {
      try {
        const config = YAML.load(data) as {
          apps?: string[] | { [s: string]: boolean }
        }
        setConfigValues(config)
        if (config.apps && Array.isArray(config.apps)) {
          const map: { [s: string]: boolean } = {}
          config.apps.forEach(item => {
            map[item] = true
          })
          setAppsMap(map)
        } else if (config.apps && typeof config.apps === 'object') {
          setAppsMap(config.apps)
        }
      } catch (error) {
        console.error('Error parsing YAML:', error)
      }
    }
  }

  const loadRepositoryInfo = async (item: windowgit.GitRepoInfo) => {
  // 构建文件路径
  const basePath = `${app.userDataTemplatePath}/${space}/${item.Name}`;
  const readmePath = `${basePath}/README.md`;
  const packageJsonPath = `${basePath}/package.json`;

  // 检查是否是当前正在显示的仓库
  const isSameRepo = currentRepo.item && currentRepo.item.Name === item.Name && currentRepo.show;
  
  // 并行检查文件存在性
  const [readmeExists, packageExists] = await Promise.all([
    AppExists(readmePath),
    AppExists(packageJsonPath)
  ]);

  // 并行读取文件内容
  let readmeContent = '未找到 README.md 文件';
  let packageContent = null;
  let packageString = '';

  if (readmeExists) {
    readmeContent = await AppReadFiles(readmePath);
  }

  if (packageExists) {
    try {
      const packageFileContent = await AppReadFiles(packageJsonPath);
      packageString = packageFileContent;
      packageContent = JSON.parse(packageFileContent);
    } catch (error) {
      console.error('解析 package.json 失败:', error);
      packageString = '解析 package.json 失败';
      packageContent = null;
    }
  }

  // 如果是同一个仓库且正在显示，更新内容
  if (isSameRepo) {
    setCurrentRepo(prev => ({
      ...prev,
      readme: readmeContent,
      package: packageContent,
      packageString: packageString
    }));
    return;
  }

  // 设置新的仓库信息
  setCurrentRepo({
    item,
    package: packageContent,
    packageString: packageString,
    show: true,
    readme: readmeContent,
    branches: [],
    commits: []
  });
};


  useEffect(() => {
    updateConfig()
  }, [])

  useEffect(() => {
    GitReposList(space).then(res => {
      setData(res || [])
    })
  }, [space])

  return (
    <section className=" flex flex-row flex-1 h-full shadow-md">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1">
        {!currentRepo.show && <Init />}
        {currentRepo.show && (
          <div className="flex flex-col">
            <SecondaryDiv className="py-2 px-2 border-b flex items-center justify-between">
              <Tabs
                value={messageValue}
                onChange={onChangeTag}
                options={[
                  {
                    label: 'README',
                    key: 'readme'
                  },
                  // {
                  //   label: '分支列表',
                  //   key: 'branches'
                  // },
                  // {
                  //   label: '提交记录',
                  //   key: 'commits'
                  // },
                  {
                    label: '包配置',
                    key: 'package'
                  }
                ]}
              />
              <div>
                <Button
                  className="px-2 rounded-md"
                  onClick={async e => {
                    e.stopPropagation()
                    const name = currentRepo.package?.name ?? ''
                    if (!name) {
                      notification('该包配置损坏', 'warning')
                      return
                    }
                    // 其实就是更新配置文件
                    const newMap = { ...appsMap }
                    if (appsMap[name]) {
                      delete newMap[name]
                    } else {
                      newMap[name] = true
                    }
                    const yamlStr = YAML.dump({
                      ...configValues,
                      apps: newMap
                    })
                    const dir = app.userDataTemplatePath + '/alemon.config.yaml'
                    AppWriteFiles(dir, yamlStr).then(() => {
                      setAppsMap(newMap)
                      notification(`${appsMap[name] ? '禁用' : '启用'}成功`)
                    })
                  }}
                >
                  {currentRepo.package?.name && appsMap[currentRepo.package?.name ?? '']
                    ? '禁用'
                    : '启动'}
                </Button>
              </div>
            </SecondaryDiv>
            <div
              className={classNames(
                'select-text overflow-auto scrollbar h-[calc(100vh-5rem)] max-w-[calc(100vw-21.5rem)]',
                {}
              )}
            >
              {messageValue === 'readme' && <Markdown className="" source={currentRepo.readme} />}
              {messageValue === 'package' && (
                <div className="size-full">
                  <MonacoEditor
                    value={currentRepo.packageString}
                    language="json"
                    onSave={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </SecondaryDiv>
      <SidebarDiv className="animate__animated animate__fadeInRight duration-500 flex flex-col  w-72 xl:w-80 border-l h-full">
        <div className="flex px-2 py-1 gap-2">
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
          <PackageList
            show={tabValue === '1'}
            data={data}
            onDelete={onDelete}
            onSelect={loadRepositoryInfo}
          />
          <PackageClone show={tabValue === '2'} onSubmit={onAdd} space={space} />
        </div>
      </SidebarDiv>
    </section>
  )
}
