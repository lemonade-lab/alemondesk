import { extractRepoInfo, isGitRepositoryFormat } from '@/api'
import { useNotification } from '@/context/Notification'
import { RootState } from '@/store'
import { Button, Input, SecondaryDiv, Switch } from '@alemonjs/react-ui'
import { Spin } from 'antd'
import classNames from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { GitClone, GitReposList } from '@wailsjs/window/git/app'
import { setAddLoading, setAddValues, setExpData } from '@/store/gitExp'

export type PackageCloneProps = {
  space: string
  show: boolean
}

const PackageClone = ({ space, show }: PackageCloneProps) => {
  const notification = useNotification()
  const gitExp = useSelector((state: RootState) => state.gitExp)
  const dispatch = useDispatch()

  const setValues = (values: typeof gitExp.addValues) => {
    dispatch(setAddValues(values))
  }

  const updateReposList = () => {
    GitReposList(gitExp.space).then(res => {
      const d = res.map(item => {
        return {
          Branch: item.Branch,
          Depth: item.Depth,
          IsFullRepo: item.IsFullRepo,
          Name: item.Name,
          RemoteURL: item.RemoteURL
        }
      })
      dispatch(setExpData(d || []))
    })
  }

  /**
   * @returns
   */
  const onAdd = async () => {
    const value = gitExp.addValues?.repoUrl.trim()
    if (value === '') {
      notification('请输入仓库地址', 'warning')
      return
    }
    if (gitExp.isAddLoading) {
      return
    }
    dispatch(setAddLoading(true))
    try {
      if (!isGitRepositoryFormat(value)) {
        notification('格式错误', 'warning')
        dispatch(setAddLoading(false))
        return
      }
      // 根据 url 解析成仓库地址
      const { repository } = extractRepoInfo(value)
      const params = {
        url: value,
        branch: gitExp.addValues.branch,
        depth: gitExp.addValues.depth,
        space: space,
        force: gitExp.addValues.force,
        repository
      }
      if (gitExp.data.find(item => item.Name === params.repository)) {
        notification('该仓库已存在', 'warning')
        dispatch(setAddLoading(false))
        return
      }
      notification('正在添加仓库..')
      // 开始克隆
      await GitClone({
        repo_url: params.url?.trim() || '',
        branch: params.branch?.trim() || '',
        depth: params.depth,
        space: gitExp.space?.trim() || '',
        force: params.force
      })
      notification('仓库添加成功')
      // 更新仓库列表
      updateReposList()
    } catch (error: any) {
      notification('操作失败:' + error.message, 'error')
    } finally {
      dispatch(setAddLoading(false))
    }
  }

  return (
    <SecondaryDiv className={classNames('p-4', !show && 'hidden')}>
      <Spin spinning={gitExp.isAddLoading} tip="操作中...">
        <form
          className="px-4 py-2 flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28">仓库地址:</div>
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
            <div className="w-28">分支:</div>
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
            <div className="w-28">深度:</div>
            <Input
              type="number"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className="px-2 rounded-md w-full"
              value={gitExp.addValues.depth}
              onChange={e => {
                // min 0
                if (Number(e.target.value) < 0) {
                  setValues({ ...gitExp.addValues, depth: 0 })
                  return
                }
                setValues({ ...gitExp.addValues, depth: Number(e.target.value) })
              }}
            />
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28">是否强制覆盖:</div>
            <Switch
              value={gitExp.addValues.force}
              onChange={checked => setValues({ ...gitExp.addValues, force: checked })}
            />
          </div>
          <Button className="px-2 rounded-md" onClick={onAdd}>
            Clone
          </Button>
        </form>
      </Spin>
    </SecondaryDiv>
  )
}

export default PackageClone
