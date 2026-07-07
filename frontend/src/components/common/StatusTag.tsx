import { Tag } from 'antd'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'default',
  APPROVED: 'processing',
  PAID: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'error',
  IN_PROGRESS: 'processing',
  DRAFT: 'default',
  SHIPPED: 'cyan',
  DELIVERED: 'success',
  FROZEN: 'blue',
  CHILLED: 'cyan',
  NORMAL: 'default',
  BALANCE: 'processing',
  EMERGENCY: 'error',
  REPLENISH: 'success',
}

interface StatusTagProps {
  status: string
}

export default function StatusTag({ status }: StatusTagProps) {
  const color = STATUS_COLORS[status] ?? 'default'
  return <Tag color={color}>{status}</Tag>
}
