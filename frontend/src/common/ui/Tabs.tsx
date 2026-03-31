import { Button } from '@alemonjs/react-ui'
import classNames from 'classnames'

const Tabs = ({
  options,
  value,
  onChange
}: {
  options: {
    key: string
    label: string
    className?: string
  }[]
  value: string
  onChange: (key: string) => void
}) => {
  return (
    <div className="flex gap-2">
      {options.map((item, index) => (
        <Button
          className={classNames('rounded-md px-2', item.className, {
            ['opacity-50']: value !== item.key
          })}
          onClick={() => onChange(item.key)}
          key={index}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

export default Tabs
