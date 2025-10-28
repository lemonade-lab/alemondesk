import _ from 'lodash'
import { useBotController } from '@/hook/useBotController'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { Button, Input } from '@alemonjs/react-ui'
import BotTerminal from '../../common/BotTerminal'
import { usePop } from '@/context/Pop'
import { useState } from 'react'

const LEMONADE_PLATFORM = 'LEMONADE_PLATFORM'

const RunForm = () => {
  const [value, setValue] = useState(localStorage.getItem(LEMONADE_PLATFORM) || '')
  const onChange = (value: string) => {
    // 持久化存储
    localStorage.setItem(LEMONADE_PLATFORM, value)
    setValue(value)
  }
  return (
    <form className='flex flex-col gap-4' onSubmit={e => e.preventDefault()}>
      <div className="flex gap-2">
        <div className="text-lg font-medium">
          平台
        </div>
        <Input value={value} onChange={e => onChange(e.target.value)} className='flex-1 px-2 rounded-md' placeholder="启动平台(为空则视为开发模式)" />
      </div>
    </form>
  )
}

function Terminal() {
  const { onClickStart, onClickClose, bot, state } = useBotController()
  const modules = useSelector((state: RootState) => state.modules)
  const [platform, setPlatform] = state

  const { setPopValue } = usePop()

  const onStart = () => {
    setPopValue({
      open: true,
      title: '启动机器人',
      description: <RunForm />,
      buttonText: '启动',
      data: {},
      code: 0,
      onConfirm: () => {
        setPlatform({
          name: platform.name,
          value: localStorage.getItem(LEMONADE_PLATFORM) || 'dev'
        })
        onClickStart()
      }
    })
  }

  const onClose = () => {
   setPopValue({
      open: true,
      title: '关闭机器人',
      description: '确定要关闭机器人吗？',
      buttonText: '确定',
      data: {},
      code: 0,
      onConfirm: () => {
        onClickClose()
      }
    })
  }

  return (
    <BotTerminal
      headerLeft={<></>}
      headerRight={
        <>
          {modules.nodeModulesStatus &&
            (bot.runStatus ? (
              <Button
                type="button"
                className="border  px-2 rounded-md  duration-700 transition-all  "
                onClick={onClose}
              >
                <span>关闭</span>
              </Button>
            ) : (
              <Button
                type="button"
                className="border  px-2 rounded-md  duration-700 transition-all  "
                onClick={onStart}
              >
                <span>启动</span>
              </Button>
            ))}
        </>
      }
    />
  )
}

export default Terminal
