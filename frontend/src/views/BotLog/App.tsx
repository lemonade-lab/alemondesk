import _ from 'lodash'
import { useBotController } from '@/hook/useBotController'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'
import { Button, PrimaryDiv } from '@alemonjs/react-ui'
import BotTerminal from '../../common/BotTerminal'
import { FeatModal } from '@/context/Pop'
import DatePicker from '@/common/ui/DatePicker'
import { Fragment, useEffect, useState } from 'react'
import RunForm, { Config, getRunConfig, initialRunConfig, setRunConfig } from './RunForm'

function Terminal() {
  const modules = useSelector((state: RootState) => state.modules)
  const { onClickStart, onClickClose, bot } = useBotController()
  const [open, setOpen] = useState(false)
  const [fromValue, setFromValue] = useState<Config>(initialRunConfig)

  const onStart = () => {
    setOpen(true)
  }

  const onClose = () => {
    onClickClose()
  }

  useEffect(() => {
    const values = getRunConfig()
    setFromValue(values)
  }, [])

  return (
    <Fragment>
      <BotTerminal
        headerLeft={<DatePicker hover />}
        headerRight={
          <div className="flex justify-end">
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
          </div>
        }
      />
      {
        // 浮动窗口
      }
      <FeatModal
        open={open}
        title="启动机器人"
        textOk="启动"
        onClose={() => setOpen(false)}
        onOk={() => {
          setOpen(false)
          onClickStart(fromValue)
        }}
      >
        <RunForm
          value={fromValue}
          onChange={value => {
            setRunConfig(value)
            setFromValue(value)
          }}
        />
      </FeatModal>
    </Fragment>
  )
}

export default Terminal
