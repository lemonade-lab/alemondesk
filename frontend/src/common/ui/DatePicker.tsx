import React from 'react'
import classNames from 'classnames'

import AntdDatePicker, { DatePickerType } from 'antd/es/date-picker'

function PrimaryDiv(props) {
  const { className, hover, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-primary-bg)] border-[var(--alemonjs-primary-border)] text-[var(--alemonjs-primary-text)]',
        {
          'hover:bg-[var(--alemonjs-primary-bg-hover)] hover:border-[var(--alemonjs-primary-border-hover)] hover:text-[var(--alemonjs-primary-text-hover)]':
            hover
        },
        'dark:bg-[var(--alemonjs-dark-primary-bg)] dark:border-[var(--alemonjs-dark-primary-border)] dark:text-[var(--alemonjs-dark-primary-text)]',
        {
          'dark:hover:bg-[var(--alemonjs-dark-primary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-primary-border-hover)] dark:hover:text-[var(--alemonjs-dark-primary-text-hover)]':
            hover
        }
      )}
      {...prop}
    />
  )
}

const DatePicker = props => {
  const { className, hover, rootClassName, ...rest } = props
  return (
    <AntdDatePicker
      datatype=""
      className={classNames(
        className,
        'bg-[var(--alemonjs-primary-bg)] border-[var(--alemonjs-primary-border)] text-[var(--alemonjs-primary-text)]',
        {
          'hover:bg-[var(--alemonjs-primary-bg-hover)] hover:border-[var(--alemonjs-primary-border-hover)] hover:text-[var(--alemonjs-primary-text-hover)]':
            hover
        },
        'dark:bg-[var(--alemonjs-dark-primary-bg)] dark:border-[var(--alemonjs-dark-primary-border)] dark:text-[var(--alemonjs-dark-primary-text)]',
        {
          'dark:hover:bg-[var(--alemonjs-dark-primary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-primary-border-hover)] dark:hover:text-[var(--alemonjs-dark-primary-text-hover)]':
            hover
        },
        'active:bg-[var(--alemonjs-primary-bg-active)] active:border-[var(--alemonjs-primary-border-active)] active:text-[var(--alemonjs-primary-text-active)]',
        'focus:bg-[var(--alemonjs-primary-bg-focus)] focus:border-[var(--alemonjs-primary-border-focus)] focus:text-[var(--alemonjs-primary-text-focus)]',
        'focus:not(:hover):bg-[var(--alemonjs-primary-bg-focus)] focus:not(:hover):border-[var(--alemonjs-primary-border-focus)] focus:not(:hover):text-[var(--alemonjs-primary-text-focus)]'
      )}
      rootClassName={classNames(rootClassName)}
      {...rest}
    />
  )
}

export default DatePicker
