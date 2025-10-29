import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { delMessate } from '@/store/log'
import { useNotification } from '@/context/Notification'
import { Button, SecondaryDiv } from '@alemonjs/react-ui'
import Box from './layout/Box'

// 解析字符串。如果发现是error字样要进行高亮
const parseLogMessage = (message: string) => {
  const errorRegex = /error/i
  if (errorRegex.test(message)) {
    return <span className="text-red-500 ">{message}</span>
  }
  return <span>{message}</span>
}

function BotLogList({
  headerRight,
  headerLeft
}: {
  headerRight?: React.ReactNode
  headerLeft?: React.ReactNode
}) {
  const log = useSelector((state: RootState) => state.log)
  const dispatch = useDispatch()
  const notification = useNotification()

  // 删除日志
  const onClickDeleteLog = (size = 10) => {
    if (log.message.length > 0) {
      const count = log.message.length > size || size == 99 ? size : log.message.length
      dispatch(delMessate(count))
    } else {
      notification('没有日志可删除', 'warning')
    }
  }

  return (
    <div className="flex-1 flex flex-col shadow-md w-[calc(100vw-4rem)]">
      <div className="z-50 flex flex-col border-b">
        <div className="flex gap-4 justify-between items-center px-2 py-1">
          <div className="flex gap-2 items-center">{headerLeft}</div>
          <div className="flex gap-4">
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
          <div className="flex items-center gap-2">{headerRight}</div>
        </div>
      </div>
      <Box className='scrollbar h-[calc(100vh-6rem)]'>
        {log.message.length === 0 ? (
          <div className="text-gray-400">暂无日志</div>
        ) : (
          log.message.map((msg, idx) => (
              <SecondaryDiv className="select-all rounded-md break-words" key={idx}>
                {parseLogMessage(msg)}
              </SecondaryDiv>
            ))
        )}
      </Box>
    </div>
  )
}

export default BotLogList
