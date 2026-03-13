import { RootState } from '@/store'
import classNames from 'classnames'
import { useMemo, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCommand } from '@/store/command'
import ExpansionIcon from '@/common/ExpansionIcon'
import { ControllerItem } from './types'

const isMac = 'darwin'

export default function CommandInput() {
  const dispatch = useDispatch()

  const expansions = useSelector((state: RootState) => state.expansions)
  const version = useSelector((state: RootState) => state.about.version)

  const viewControllers = useMemo(() => {
    const controllers =
      expansions.package?.flatMap(item => {
        return (
          item.alemonjs?.desktop?.controls?.map((menu: ControllerItem) => ({
            ...menu,
            command: menu.command ?? menu.commond ?? '',
            expansions_name: item.name
          })) || []
        )
      }) || []
    if (version === isMac) {
      const left = controllers.filter(item => item.position === 'left')
      const right = controllers.filter(item => item.position !== 'left')
      return [left, right]
    }
    const right = controllers.filter(item => item.position === 'right')
    const left = controllers.filter(item => item.position !== 'right')
    return [left, right]
  }, [expansions.package, version])

  const viewControllersLeft = viewControllers[0]
  const viewControllersRight = viewControllers[1]

  return (
    <div className="flex-[6] flex gap-2 justify-center items-center">
      <Fragment>
        <div className="flex-1 flex gap-2 items-center justify-end drag-area">
          {viewControllersLeft.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer"
              onClick={() => {
                if (item.command) {
                  dispatch(setCommand(item.command))
                }
              }}
            >
              <ExpansionIcon
                name={item?.name ?? item?.icon}
                icon={item?.icon}
                expansions_name={item?.expansions_name ?? item?.icon}
              />
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center drag-area" />
        <div className={classNames('flex-1 flex items-center')}>
          <div className="flex flex-1">
            <div className="steps-1 flex gap-2 justify-center items-center">
              {viewControllersRight.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer"
                  onClick={() => {
                    if (item.command) {
                      dispatch(setCommand(item.command))
                    }
                  }}
                >
                  <ExpansionIcon
                    name={item?.name ?? item?.icon}
                    icon={item?.icon}
                    expansions_name={item?.expansions_name ?? item?.icon}
                  />
                </div>
              ))}
            </div>
            <div className="drag-area flex-1 "></div>
          </div>
        </div>
      </Fragment>
    </div>
  )
}
