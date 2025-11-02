import { extractRepoInfo, isGitRepositoryFormat } from '@/api'
import { useNotification } from '@/context/Notification'
import { Button, Input, SecondaryDiv, Switch } from '@alemonjs/react-ui'
import { Spin } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'

export type PackageCloneProps = {
  space: string
  show: boolean
  onSubmit: (
    params: {
      url: string
      branch: string
      depth: number
      space: string
      force: boolean
      repository: string
    },
    options: {
      finished: () => void
    }
  ) => Promise<void>
}

const PackageClone = ({ space, show, onSubmit }: PackageCloneProps) => {
  const notification = useNotification()
  const [sub, setSub] = useState(false)
  const [values, setValues] = useState({
    // 仓库地址
    repoUrl: '',
    // 分支
    branch: '',
    // 深度
    depth: 1,
    // 是否强制覆盖
    force: true
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
      const { repository } = extractRepoInfo(value)

      onSubmit(
        {
          url: value,
          branch: values.branch,
          depth: values.depth,
          space: space,
          force: values.force,
          repository
        },
        {
          finished: () => {
            setSub(false)
          }
        }
      )
    } catch (error: any) {
      notification('操作失败:' + error.message, 'error')
    } finally {
      setSub(false)
    }
  }

  return (
    <SecondaryDiv className={classNames('p-4', !show && 'hidden')}>
      <Spin spinning={sub} tip="操作中...">
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
              value={values.repoUrl}
              className="px-2 rounded-md w-full"
              onChange={e => setValues({ ...values, repoUrl: e.target.value })}
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
              value={values.branch}
              onChange={e => setValues({ ...values, branch: e.target.value })}
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
              value={values.depth}
              onChange={e => {
                // min 0
                if (Number(e.target.value) < 0) {
                  setValues({ ...values, depth: 0 })
                  return
                }
                setValues({ ...values, depth: Number(e.target.value) })
              }}
            />
          </div>
          <div className="flex gap-2 justify-center items-center">
            <div className="w-28">是否强制覆盖:</div>
            <Switch
              value={values.force}
              onChange={checked => setValues({ ...values, force: checked })}
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
