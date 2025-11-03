import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import { DeleteFilled } from '@ant-design/icons'
import { useNotification } from '@/context/Notification'
import classNames from 'classnames'
import { GitRepoInfo } from '@wailsjs/window/git'

export default function PackageList({
  data,
  show,
  onDelete,
  onSelect
}: {
  data: GitRepoInfo[]
  show: boolean
  onSelect: (item: GitRepoInfo) => void
  onDelete: (name: string) => void
}) {
  const notification = useNotification()
  return (
    <SecondaryDiv
      className={classNames({
        'hidden': !show,
        'flex flex-col gap-1 px-2 border-t py-2 overflow-y-auto scrollbar size-full': show
      })}
    >
      {data.map((item, index) => (
        <PrimaryDiv
          className="px-2 py-1 flex justify-between items-center rounded-md cursor-pointer"
          hover
          key={index}
          onClick={async () => {
            if (!item.IsFullRepo) {
              notification('该仓库损坏，无法查看', 'warning')
              return
            }
            onSelect(item)
          }}
        >
          <div>
            {item.Name}
            {!item.IsFullRepo && '(损坏)'}
          </div>
          <div className="flex gap-2">
            <Button
              className="px-2 rounded-md"
              onClick={e => {
                e.stopPropagation()
                onDelete(item.Name)
              }}
            >
              <DeleteFilled />
            </Button>
          </div>
        </PrimaryDiv>
      ))}
    </SecondaryDiv>
  )
}
