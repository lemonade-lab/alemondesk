import { useEffect, useState } from 'react'
import Init from './Init'
import { Button, SecondaryDiv } from '@alemonjs/react-ui'
import { useNotification } from '@/context/Notification'
import Markdown from '@/common/Markdown'
import Tabs from '@/common/ui/Tabs'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { AppExists, AppReadFiles, AppWriteFiles } from '@wailsjs/window/app/app'
import MonacoEditor from '@/common/MonacoEditor'
import YAML from 'js-yaml'
import { setCurrentRepo } from '@/store/gitExp'
import Box from '@/common/layout/Box'

export default function GitWarehouse() {
  const notification = useNotification()
  const gitExp = useSelector((state: RootState) => state.gitExp)
  const currentRepo = gitExp.currentRepo
  const app = useSelector((state: RootState) => state.app)

  const dispatch = useDispatch()

  const [messageValue, setMessageValue] = useState('readme')
  const [appsMap, setAppsMap] = useState<{ [key: string]: boolean }>({})

  const updatePackageData = async () => {
    const dir = `${app.userDataTemplatePath}/${gitExp.space}/${currentRepo?.item?.Name}/package.json`
    // 如果没有 package.json 则不切换
    const T = await AppExists(dir)
    if (!T) {
      return
    }
    const data = await AppReadFiles(dir)
    const pkg = JSON.parse(data)
    dispatch(
      setCurrentRepo({
        ...currentRepo,
        packageString: data,
        package: pkg
      })
    )
    return pkg
  }

  const onChangeTag = async (tag: string) => {
    if (!currentRepo.show) {
      return
    }
    if (tag === messageValue) {
      return
    } else if (tag === 'readme' && !currentRepo.readme) {
      const dir = `${app.userDataTemplatePath}/${gitExp.space}/${currentRepo?.item?.Name}/README.md`
      // 如果没有 readme 则不切换
      const T = await AppExists(dir)
      if (!T) {
        return
      }
      const data = await AppReadFiles(dir)
      dispatch(
        setCurrentRepo({
          ...currentRepo,
          readme: data
        })
      )
    } else if (tag === 'branches') {
      // TODO 获取分支列表
    } else if (tag === 'commits') {
      // TODO 获取提交记录
    } else if (tag === 'package' && !currentRepo.package) {
      updatePackageData()
    }
    setMessageValue(tag)
  }

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
    <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 size-full">
      {currentRepo.show ? (
        <div className="flex flex-col flex-1 size-full">
          <SecondaryDiv className="py-2 px-2 border-b flex items-center justify-between">
            <Tabs
              value={messageValue}
              onChange={onChangeTag}
              options={[
                {
                  label: 'README',
                  key: 'readme'
                },
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
          <Box >
            {messageValue === 'readme' && <Markdown className="" source={currentRepo.readme} />}
            {messageValue === 'package' && (
              <div className="size-full">
                <MonacoEditor value={currentRepo.packageString} language="json" onSave={() => {}} />
              </div>
            )}
          </Box>
        </div>
      ) : (
        <Init />
      )}
    </SecondaryDiv>
  )
}
