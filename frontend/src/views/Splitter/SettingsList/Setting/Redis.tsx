import { useNotification } from '@/context/Notification'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { useCallback, useEffect, useState } from 'react'
import {
  RedisGetStatus,
  RedisStart,
  RedisStop,
  RedisRestart
} from '@wailsjs/window/service/app'

interface RedisStatus {
  running: boolean
  addr: string
  builtin: boolean
}

const Redis = () => {
  const notification = useNotification()
  const [status, setStatus] = useState<RedisStatus>({
    running: false,
    addr: '',
    builtin: false
  })
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    const res = await RedisGetStatus()
    setStatus(res)
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleStart = async () => {
    setLoading(true)
    const err = await RedisStart()
    if (err) {
      notification(`启动失败: ${err}`)
    } else {
      notification('Redis 已启动')
    }
    await fetchStatus()
    setLoading(false)
  }

  const handleStop = async () => {
    setLoading(true)
    const err = await RedisStop()
    if (err) {
      notification(`停止失败: ${err}`)
    } else {
      notification('Redis 已停止')
    }
    await fetchStatus()
    setLoading(false)
  }

  const handleRestart = async () => {
    setLoading(true)
    const err = await RedisRestart()
    if (err) {
      notification(`重启失败: ${err}`)
    } else {
      notification('Redis 已重启')
    }
    await fetchStatus()
    setLoading(false)
  }

  return (
    <section className="flex flex-row h-[calc(100vh-29.8px)] w-full shadow-md overflow-hidden">
      <SecondaryDiv className="animate__animated animate__fadeIn flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
          <PrimaryDiv className="flex flex-col p-6 rounded-lg shadow-inner gap-5">
            <div className="flex items-center justify-between border-b border-secondary-border dark:border-dark-secondary-border pb-2">
              <div className="text-xl font-semibold">Redis</div>
            </div>

            <div className="flex flex-col gap-4">
              {/* 状态信息 */}
              <div className="flex items-center gap-2">
                <div className="w-40 text-sm shrink-0">运行状态</div>
                <div className="flex-1 text-xs text-secondary-text">
                  {status.running ? (
                    <span className="text-green-500 font-medium">运行中</span>
                  ) : (
                    <span className="text-red-500 font-medium">已停止</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-40 text-sm shrink-0">监听地址</div>
                <div className="flex-1 text-xs text-secondary-text font-mono">
                  {status.addr || '-'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-40 text-sm shrink-0">类型</div>
                <div className="flex-1 text-xs text-secondary-text">
                  {status.builtin ? '内置 Redis' : status.running ? '系统 Redis' : '-'}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 pt-2 border-t border-secondary-border dark:border-dark-secondary-border">
                <div className="w-40 text-sm shrink-0">操作</div>
                <div className="flex gap-2">
                  {!status.running ? (
                    <Button
                      className="px-3 py-1 rounded-md border"
                      onClick={handleStart}
                      disabled={loading}
                    >
                      启动
                    </Button>
                  ) : status.builtin ? (
                    <>
                      <Button
                        className="px-3 py-1 rounded-md border"
                        onClick={handleRestart}
                        disabled={loading}
                      >
                        重启
                      </Button>
                      <Button
                        className="px-3 py-1 rounded-md border"
                        onClick={handleStop}
                        disabled={loading}
                      >
                        停止
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-secondary-text">
                      使用系统 Redis，无需管理
                    </span>
                  )}
                </div>
              </div>
            </div>
          </PrimaryDiv>
        </div>
      </SecondaryDiv>
    </section>
  )
}

export default Redis
