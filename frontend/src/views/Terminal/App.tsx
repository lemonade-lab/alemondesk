import _ from 'lodash'
import { RootState } from '@/store'
import { useDispatch, useSelector } from 'react-redux'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { Fragment, useEffect, useState, useRef } from 'react'
import RunForm, { Config, getRunConfig, initialRunConfig, setRunConfig } from './RunForm'
import { BotClose, BotRun } from '@wailsjs/window/bot/app'
import { FeatModal } from '@/context/Pop'
import { delMessage } from '@/store/log'
import ParseLogMessage from '@/common/BotTerminalText'
import Box from '@/common/layout/Box'

function Terminal() {
  const dispatch = useDispatch()
  const log = useSelector((state: RootState) => state.log)
  const bot = useSelector((state: RootState) => state.bot)
  const modules = useSelector((state: RootState) => state.modules)
  const [fromValue, setFromValue] = useState<Config>(initialRunConfig)
  const [open, setOpen] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)
  /**
   * @returns
   */
  const onClickStart = _.throttle(config => {
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
      } else if (key === 'platform') {
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
  const onClose = _.throttle(() => {
    BotClose()
  }, 500)

  const onStart = () => {
    setOpen(true)
  }

  // 删除日志
  const onClickDeleteLog = (size = 10) => {
    if (log.message.length > 0) {
      const count = log.message.length > size ? size + 1 : log.message.length + 1
      dispatch(delMessage(count))
    }
  }

  // 滚动到底部
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  // 检查是否在底部
  const checkIfAtBottom = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
      const threshold = 5 // 5px的容差
      const isBottom = scrollTop + clientHeight >= scrollHeight - threshold
      setIsAtBottom(isBottom)
    }
  }

  // 监听滚动事件
  const handleScroll = _.throttle(() => {
    checkIfAtBottom()
  }, 100)

  useEffect(() => {
    const values = getRunConfig()
    setFromValue(values)
  }, [])

  // 监听日志变化，自动滚动到底部
  useEffect(() => {
    if (isAtBottom && log.message.length > 0) {
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    }
  }, [log.message, isAtBottom])

  // 添加滚动事件监听
  useEffect(() => {
    const container = logContainerRef.current
    if (container) {
      // 初始检查
      checkIfAtBottom()
    }
  }, [log.message.length])

  return (
    <Fragment>
      <div className="animate__animated animate__fadeIn duration-500 flex-1 size-full flex flex-col shadow-md">
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
        <div className="relative flex-1 size-full overflow-hidden">
          <Box 
            boxRef={logContainerRef}
            className="p-1 h-full overflow-y-auto"
            onBoxScroll={handleScroll}
          >
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
          {/* 滚动到底部按钮 */}
          {!isAtBottom && log.message.length > 0 && (
            <div className="absolute bottom-4 left-4">
              <Button
                type="button"
                className="px-2 py-1 text-sm rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
                onClick={scrollToBottom}
              >
                ↓ 滚动到底部
              </Button>
            </div>
          )}
        </div>
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
