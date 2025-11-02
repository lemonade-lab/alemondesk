import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'
import _ from 'lodash'
import { BotClose, BotRun } from '@wailsjs/window/bot/app'

export const useBotController = () => {
  const bot = useSelector((state: RootState) => state.bot)
  const modules = useSelector((state: RootState) => state.modules)
  /**
   * @returns
   */
  const onClickStart = _.throttle((config) => {
    // 对 config 进行参数化处理。比如 key:value 变成 --key value 形式
    console.log('启动配置：', config)
    const args = Object.entries(config).flatMap(([key, value]: [string, any]) => {
      if (key === 'login') {
        value = String(value).trim()
        if (/@alemonjs\//.test(value)) {
          value = value.replace('@alemonjs/', '')
        } else {
          value = ''
        }
        if (value) {
          return ['--login', value]
        }
        return []
      }
      else if (key === 'platform') {
        return []
      }
      if (value === true) {
        return [`--${key}`]
      }
      if (!value) {
        return []
      }
      return [`--${key}`, String(value)]
    })
    console.log('启动参数：', args)
    BotRun(args)
  }, 500)
  /**
   * @returns
   */
  const onClickClose = _.throttle(() => {
    BotClose()
  }, 500)

  return { onClickStart, onClickClose, bot, modules }
}