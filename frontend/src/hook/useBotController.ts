import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'
import _ from 'lodash'
import { useState } from 'react'
import { useNotification } from '@/context/Notification'
import { BotClose, BotRun } from '@wailsjs/go/windowbot/App'

const getPlatform = (packages: any[]) => {
  const data: {
    name: string
    value: string
  }[] = []
  for (const item of packages) {
    let platforms = []
    const p = item?.alemonjs?.desktop?.platform
    if (Array.isArray(p)) {
      platforms = p
    }
    for (const platform of platforms) {
      data.push({
        name: platform.name,
        value: platform?.value ?? item.name
      })
    }
  }
  return data
}

export const useBotController = () => {
  const bot = useSelector((state: RootState) => state.bot)
  const modules = useSelector((state: RootState) => state.modules)
  const notification = useNotification()
  const expansions = useSelector((state: RootState) => state.expansions)
  const platforms = getPlatform(expansions.package)

  const state = useState<{
    name: string
    value: string
  }>({
    name: 'dev',
    value: 'dev'
  })

  /**
   * @returns
   */
  const onClickStart = _.throttle(() => {
    const [platform] = state
    if (!platform?.value || platform?.value === 'dev') {
      BotRun([])
      return
    }
    // 如果是 @alemonjs/ 开头的，就当做登录名处理
    if (/@alemonjs\//.test(platform.value)) {
      const login = platform.value.replace('@alemonjs/', '')
      BotRun(['--login', login])
    } else {
      BotRun(['--platform', platform.value])
    }
  }, 500)
  /**
   * @returns
   */
  const onClickClose = _.throttle(() => {
    BotClose()
  }, 500)

  return { onClickStart, onClickClose, bot, modules, state, platforms }
}
