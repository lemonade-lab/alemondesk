import { useEffect, useState } from 'react'
import { Button, Dropdown, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { DeleteFilled } from '@ant-design/icons'
import { useNotification } from '@/context/Notification'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/go/windowapp/App'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import YAML from 'js-yaml'

export default function PackageList({
  data,
  space,
  onDelete,
  setSelect,
  setReadme
}: {
  data: any[]
  space: string
  onDelete: (name: string) => void
  setSelect: (select: string) => void
  setReadme: (readme: string) => void
}) {
  const notification = useNotification()
  const app = useSelector((state: RootState) => state.app)

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

  useEffect(() => {
    updateConfig()
  }, [])
  return (
    <SecondaryDiv className="flex flex-col gap-1 px-2 border-t py-2  overflow-auto  h-[calc(100vh-3.7rem)]">
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
          <div>
            {item.Name}
            {!item.IsFullRepo && '(损坏)'}
          </div>
          <div className="flex gap-2">
            <Dropdown
              buttons={[
                {
                  children: appsMap[item.Name] ? '禁用' : '启动',
                  className: 'px-1 py-0',
                  onClick: (e) => {
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
            </Dropdown>
          </div>
        </PrimaryDiv>
      ))}
    </SecondaryDiv>
  )
}
