import { useEffect, useState } from 'react'
import { Button, SecondaryDiv } from '@alemonjs/react-ui'
import { DeleteFilled } from '@ant-design/icons'
import { useNotification } from '@/context/Notification'
import { AppExists, AppReadFiles } from '@wailsjs/go/windowapp/App'
import { RootState } from '@/store'
import { useSelector } from 'react-redux'

export default function PackageList({
  data,
  space,
  onDelete,
  setSelect,
  setReadme
}: {
  data: any[]
  space: string
  onDelete: (name: string) => void
  setSelect: (select: string) => void
  setReadme: (readme: string) => void
}) {
  const notification = useNotification()
  const app = useSelector((state: RootState) => state.app)
  return (
    <SecondaryDiv className="flex flex-col gap-1  border-t py-2  overflow-auto  h-[calc(100vh-3.7rem)]">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer"
        >
          <div
            onClick={async () => {
              if (!item.IsFullRepo) {
                notification('该仓库损坏，无法查看', 'warning')
                return
              }
              const dir = `${app.userDataTemplatePath}/${space}/${item.Name}/README.md`
              const T = await AppExists(dir)
              if (!T) {
                notification('该仓库没有README.md文件', 'warning')
                return
              }
              const data = await AppReadFiles(dir)
              setSelect('readme')
              setReadme(data)
            }}
          >
            {item.Name}
            {!item.IsFullRepo && '(损坏)'}
          </div>
          <div className="flex gap-2">
            <div
              className="text-red-500"
              onClick={e => {
                e.stopPropagation()
                onDelete(item.Name)
              }}
            >
              <DeleteFilled />
            </div>
          </div>
        </div>
      ))}
    </SecondaryDiv>
  )
}
