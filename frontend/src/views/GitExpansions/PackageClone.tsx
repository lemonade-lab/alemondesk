import { extractRepoInfo, isGitRepositoryFormat } from '@/api'
import { useNotification } from '@/context/Notification'
import { Button, Input } from '@alemonjs/react-ui'
import { GitClone, GitReposList } from '@wailsjs/go/windowgit/App'
import { useState } from 'react'

const PackageClone = ({
  space,
  data,
  setData
}: {
  space: string
  data: any[]
  setData: (data: any[]) => void
}) => {
  const notification = useNotification()
  const [sub, setSub] = useState(false)
  const [values, setValues] = useState({
    // 仓库地址
    repoUrl: '',
    // 分支
    branch: 'main',
    // 深度
    depth: 1
  })
  /**
   *
   * @returns
   */
  const onAdd = async () => {
    const value = values.repoUrl.trim()
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

  return (
    <form className="px-4 py-2 flex flex-col gap-4" onSubmit={onAdd}>
      <div className="flex gap-2 justify-center items-center">
        <div className="w-28">仓库地址:</div>
        <Input
          type="text"
          value={values.repoUrl}
          className="px-2 rounded-md w-full"
          onChange={e => setValues({ ...values, repoUrl: e.target.value })}
          placeholder="请输入仓库地址"
        />
      </div>
      <div className="flex gap-2 justify-center items-center">
        <div className="w-28">分支:</div>
        <Input
          className="px-2 rounded-md w-full"
          type="text"
          value={values.branch}
          onChange={e => setValues({ ...values, branch: e.target.value })}
          placeholder="请输入分支名称"
        />
      </div>
      <div className="flex gap-2 justify-center items-center">
        <div className="w-28">深度:</div>
        <Input
          type="number"
          className="px-2 rounded-md w-full"
          value={values.depth}
          onChange={e => setValues({ ...values, depth: Number(e.target.value) })}
          placeholder="请输入克隆深度"
        />
      </div>
      <Button className="px-2 rounded-md" type="submit">
        Clone
      </Button>
    </form>
  )
}

export default PackageClone
