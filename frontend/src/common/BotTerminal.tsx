import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { delMessate } from '@/store/log'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import Box from './layout/Box'
import ParseLogMessage from './BotTerminalText'
import { useEffect } from 'react'

function BotLogList({
  headerRight,
  headerLeft
}: {
  headerRight?: React.ReactNode
  headerLeft?: React.ReactNode
}) {
  const log = useSelector((state: RootState) => state.log)
  const dispatch = useDispatch()
  // 删除日志
  const onClickDeleteLog = (size = 10) => {
    if (log.message.length > 0) {
      const count = log.message.length > size ? size + 1 : log.message.length + 1
      dispatch(delMessate(count))
    }
  }
  useEffect(()=>{
    console.log('log.message',log.message)
  },[log.message])
  return (
    <div className="flex-1 flex flex-col shadow-md w-[calc(100vw-6rem)]">
      <PrimaryDiv className="border-b ">
        <div className="flex gap-4 justify-between items-center px-2 py-1">
          <div className="flex-1 gap-2 items-center">{headerLeft}</div>
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
          <div className="flex-1 items-center gap-2">{headerRight}</div>
        </div>
      </PrimaryDiv>
      <Box rootClassName="py-2" className="scrollbar h-[calc(100vh-7rem)]">
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
  )
}

export default BotLogList
