import { extractRepoInfo, isGitRepositoryFormat } from '@/api'
import { useNotification } from '@/context/Notification'
import { RootState } from '@/store'
import { Button, Input, Switch } from '@alemonjs/react-ui'
import { Select } from '@alemonjs/react-ui'
import { Spin } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { GitClone, GitReposList } from '@wailsjs/window/git/app'
import { YarnCommands } from '@wailsjs/window/yarn/app'
import { setAddLoading, setAddValues, setExpData, setProxy } from '@/store/gitExp'

const PROXY_OPTIONS = [
  { label: 'ghfast.top', value: 'https://ghfast.top/' },
  { label: 'ghgo.xyz', value: 'https://ghgo.xyz/' },
  { label: 'gh-proxy.com', value: 'https://gh-proxy.com/' },
  { label: '不使用代理', value: '' }
]

export default function CloneForm() {
  const notification = useNotification()
  const gitExp = useSelector((state: RootState) => state.gitExp)
  const dispatch = useDispatch()

  const setValues = (values: typeof gitExp.addValues) => {
    dispatch(setAddValues(values))
  }

  const updateReposList = () => {
    GitReposList(gitExp.space).then(res => {
      const d = res.map(item => ({
        Branch: item.Branch,
        Depth: item.Depth,
        IsFullRepo: item.IsFullRepo,
        Name: item.Name,
        RemoteURL: item.RemoteURL
      }))
      dispatch(setExpData(d || []))
    })
  }

  const onClone = async () => {
    const value = gitExp.addValues?.repoUrl.trim()
    if (value === '') {
      notification('请输入仓库地址', 'warning')
      return
    }
    if (gitExp.isAddLoading) return

    dispatch(setAddLoading(true))
    try {
      if (!isGitRepositoryFormat(value)) {
        notification('格式错误', 'warning')
        dispatch(setAddLoading(false))
        return
      }
      const { repository } = extractRepoInfo(value)
      if (gitExp.data.find(item => item.Name === repository)) {
        notification('该仓库已存在', 'warning')
        dispatch(setAddLoading(false))
        return
      }
      notification('正在克隆仓库...')
      const cloneUrl = gitExp.proxy ? gitExp.proxy + value : value
      await GitClone({
        repo_url: cloneUrl,
        branch: gitExp.addValues.branch?.trim() || '',
        depth: gitExp.addValues.depth,
        space: gitExp.space?.trim() || '',
        force: gitExp.addValues.force
      })
      notification('克隆成功，正在安装依赖...')
      updateReposList()
      // 自动执行 yarn install
      YarnCommands({ type: 'install', args: ['--ignore-warnings'] })
    } catch (error: any) {
      notification('克隆失败: ' + error.message, 'error')
      dispatch(setAddLoading(false))
    }
  }

  return (
    <div className="p-2">
      <Spin spinning={gitExp.isAddLoading} tip="克隆中...">
        <div className="text-xs opacity-50 px-4 pb-2">输入 Git 仓库地址克隆扩展源码到本地，支持 GitHub 代理加速。克隆完成后自动安装依赖</div>
        <form
          className="px-4 py-2 flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28 text-sm">代理地址:</div>
            <Select
              className="px-2 rounded-md w-full"
              value={gitExp.proxy}
              onChange={e => dispatch(setProxy((e.target as HTMLSelectElement).value))}
            >
              {PROXY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28 text-sm">仓库地址:</div>
            <Input
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              value={gitExp.addValues.repoUrl}
              className="px-2 rounded-md w-full"
              onChange={e => setValues({ ...gitExp.addValues, repoUrl: e.target.value })}
              placeholder="请输入仓库地址"
            />
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28 text-sm">分支:</div>
            <Input
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className="px-2 rounded-md w-full"
              type="text"
              value={gitExp.addValues.branch}
              onChange={e => setValues({ ...gitExp.addValues, branch: e.target.value })}
              placeholder="请输入分支名称"
            />
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28 text-sm">深度:</div>
            <Input
              type="number"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className="px-2 rounded-md w-full"
              value={gitExp.addValues.depth}
              onChange={e => {
                if (Number(e.target.value) < 0) {
                  setValues({ ...gitExp.addValues, depth: 0 })
                  return
                }
                setValues({ ...gitExp.addValues, depth: Number(e.target.value) })
              }}
            />
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28 text-sm">强制覆盖:</div>
            <Switch
              value={gitExp.addValues.force}
              onChange={checked => setValues({ ...gitExp.addValues, force: checked })}
            />
          </div>
          <Button className="px-2 rounded-md" onClick={onClone}>
            Clone
          </Button>
        </form>
      </Spin>
    </div>
  )
}
