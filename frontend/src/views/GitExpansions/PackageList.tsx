import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { DeleteFilled } from '@ant-design/icons'
import { useNotification } from '@/context/Notification'
import classNames from 'classnames'
import { GitRepoInfo } from '@wailsjs/window/git'

export default function PackageList({
  data,
  show,
  onDelete,
  onSelect
}: {
  data: GitRepoInfo[]
  show: boolean
  onSelect: (item: GitRepoInfo) => void
  onDelete: (name: string) => void
}) {
  const notification = useNotification()
  return (
    <SecondaryDiv
      className={classNames({
        'hidden': !show,
        'flex flex-col gap-1 px-2 border-t py-2  overflow-auto  h-[calc(100vh-3.7rem)]': show
      })}
    >
      {data.map((item, index) => (
        <PrimaryDiv
          className="px-2 py-1 flex justify-between items-center rounded-md cursor-pointer"
          hover
          key={index}
          onClick={async () => {
            if (!item.IsFullRepo) {
              notification('该仓库损坏，无法查看', 'warning')
              return
            }
            onSelect(item)
          }}
        >
          <div>
            {item.Name}
            {!item.IsFullRepo && '(损坏)'}
          </div>
          <div className="flex gap-2">
            <Button className="px-2 rounded-md" onClick={e => {
                    e.stopPropagation()
                    onDelete(item.Name)
                  }}><DeleteFilled /></Button>
            {/* <Dropdown
              buttons={[
                {
                  children: appsMap[item.Name] ? '禁用' : '启动',
                  className: 'px-1 py-0',
                  onClick: e => {
                    e.stopPropagation()
                    // 其实就是更新配置文件
                    const newMap = { ...appsMap }
                    if (appsMap[item.Name]) {
                      delete newMap[item.Name]
                    } else {
                      newMap[item.Name] = true
                    }
                    const yamlStr = YAML.dump({
                      ...configValues,
                      apps: newMap
                    })
                    const dir = app.userDataTemplatePath + '/alemon.config.yaml'
                    AppWriteFiles(dir, yamlStr).then(() => {
                      setAppsMap(newMap)
                      notification(`${appsMap[item.Name] ? '禁用' : '启用'}成功`)
                    })
                  }
                },
                {
                  children: <DeleteFilled />,
                  className: 'px-1 py-0',
                  onClick: e => {
                    e.stopPropagation()
                    onDelete(item.Name)
                  }
                }
              ]}
            >
              <Button className="px-2 rounded-md">操作</Button>
            </Dropdown> */}
          </div>
        </PrimaryDiv>
      ))}
    </SecondaryDiv>
  )
}
