import { Modal } from 'antd'
import type { ReactNode } from 'react'

interface ConfirmDeleteOptions {
  title?: string
  content?: ReactNode
  onOk: () => void | Promise<void>
}

export function confirmDelete({
  title = '确认删除',
  content = '删除后不可恢复，是否继续？',
  onOk,
}: ConfirmDeleteOptions) {
  Modal.confirm({
    title,
    content,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk,
  })
}
