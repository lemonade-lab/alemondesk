import { Button } from '@alemonjs/react-ui'
import { Modal } from '@alemonjs/react-ui'
import { createContext, useState, ReactNode, useContext, PropsWithChildren } from 'react'
import { ControllerOnClick } from '@wailsjs/go/windowcontroller/App'
import classNames from 'classnames'

type ModalProps = PropsWithChildren & {
  open: boolean
  onClose: () => void
  title: string
  onOk: () => void
  textOk?: string
  textCancel?: string
}

export const BaseModal = ({
  open,
  onClose,
  title,
  children,
  onOk,
  textOk,
  textCancel
}: ModalProps) => {
  return (
    <Modal isOpen={open} onClose={onClose}>
      <h2 className="text-xl mb-4">{title}</h2>
      <div>{children}</div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} className="mt-4 px-4 py-2   rounded ">
          {textCancel || '取消'}
        </Button>
        <Button onClick={onOk} className="mt-4 px-4 py-2   rounded ">
          {textOk || '确定'}
        </Button>
      </div>
    </Modal>
  )
}

const positionClass: {
  [key: string]: string
} = {
  'center': 'fixed inset-0 flex items-center justify-center',
  'bottom-end': 'fixed bottom-4 right-4',
  'bottom-start': 'fixed bottom-4 left-4',
  'top-end': 'fixed top-4 right-4',
  'top-start': 'fixed top-4 left-4'
}

export function FeatModal(props: ModalProps & { position?: keyof typeof positionClass }) {
  const { open, position = 'center', ...reset } = props
  if (!open) return null
  return (
    <div className={classNames('z-50', positionClass[position])}>
      <BaseModal open={open} {...reset} />
    </div>
  )
}

type DataType = {
  open: boolean
  title: string
  description: null | string | ReactNode
  buttonText: string
  buttonCancelText?: string
  data: any
  code?: number
  // 取消
  onCancel?: (() => void) | null
  onConfirm?: (() => void) | null
}

// 创建上下文类型
type PopContextType = {
  setPopValue: (val: DataType) => void
  closePop: () => void
}
// 创建上下文并提供默认值
const PopContext = createContext<PopContextType | undefined>(undefined)
export { PopContext }
export default function PopProvider({ children }: { children: ReactNode }) {
  const [modalData, setModalData] = useState<DataType>({
    open: false,
    title: '',
    description: null,
    buttonText: '',
    buttonCancelText: '',
    data: {},
    code: 0,
    onCancel: null,
    onConfirm: null
  })

  // 关闭 modal
  const closePop = async () => {
    if (modalData.onCancel) {
      await modalData.onCancel()
    }
    setModalData({
      open: false,
      title: '',
      description: '',
      buttonText: '',
      buttonCancelText: '',
      data: {},
      code: 0,
      onConfirm: () => {}
    })
  }

  // 设置modal
  const setPopValue = (val: DataType) => {
    setModalData(val)
  }

  //
  const onModal = async () => {
    if (!modalData.code) {
      if (modalData?.onConfirm) {
        await modalData.onConfirm()
        // 关闭modal
        closePop()
      }
      return
    }
    // 点击按钮后的操作
    const T = await ControllerOnClick(modalData.code, modalData.data)
    if (T) {
      // 关闭modal
      closePop()
    }
  }

  return (
    <PopContext.Provider value={{ setPopValue: setPopValue, closePop }}>
      {children}
      <BaseModal
        open={modalData.open}
        onClose={closePop}
        title={modalData.title}
        children={modalData.description}
        onOk={onModal}
        textOk={modalData.buttonText}
        textCancel={modalData.buttonCancelText}
      />
    </PopContext.Provider>
  )
}

export const usePop = () => {
  const context = useContext(PopContext)
  if (!context) {
    throw new Error('usePop must be used within a PopProvider')
  }
  return context
}
