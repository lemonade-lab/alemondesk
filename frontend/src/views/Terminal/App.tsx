import _ from 'lodash'
import { useBotController } from '@/hook/useBotController'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { Fragment, useEffect, useState } from 'react'
import RunForm, { Config, getRunConfig, initialRunConfig, setRunConfig } from './RunForm'
import { FeatModal } from '@/context/Pop'
import Box from '@/common/layout/Box'
import { delMessage } from '@/store/log'
import ParseLogMessage from '@/common/BotTerminalText'

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

  const log = useSelector((state: RootState) => state.log)
  const dispatch = useDispatch()
  // 删除日志
  const onClickDeleteLog = (size = 10) => {
    if (log.message.length > 0) {
      const count = log.message.length > size ? size + 1 : log.message.length + 1
      dispatch(delMessage(count))
    }
  }

  useEffect(() => {
    const values = getRunConfig()
    setFromValue(values)
  }, [])

  return (
    <Fragment>
      <div className="flex-1 size-full flex flex-col shadow-md">
        <PrimaryDiv className="border-b px-2 py-1 flex gap-4 justify-center items-center">
          <div className="flex gap-2">
            {/* 删除按钮示例 */}
            {[20, 50, 99].map((item, index) => (
              <Button
                key={index}
                className="px-2 text-sm rounded-md"
                onClick={() => onClickDeleteLog(item)}
              >
                删除{item}条
              </Button>
            ))}
          </div>
          <div className="flex-1 items-center gap-2">
            <div className="flex justify-end">
              {modules.nodeModulesStatus &&
                (bot.runStatus ? (
                  <Button
                    type="button"
                    className="  px-2 rounded-md  duration-700 transition-all  "
                    onClick={onClose}
                  >
                    <span>关闭</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="  px-2 rounded-md  duration-700 transition-all  "
                    onClick={onStart}
                  >
                    <span>启动</span>
                  </Button>
                ))}
            </div>
          </div>
        </PrimaryDiv>
        <SecondaryDiv className="border-t" />
        <Box rootClassName="p-1" className="p-1 ">
          {log.message.length === 0 ? (
            <div className="text-gray-400">暂无日志</div>
          ) : (
            log.message.map((msg, idx) => (
              <SecondaryDiv className="px-2 select-all rounded-md break-words" key={idx}>
                <ParseLogMessage message={msg} />
              </SecondaryDiv>
            ))
          )}
        </Box>
      </div>
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
