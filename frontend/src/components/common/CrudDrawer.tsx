import { Button, Drawer, Form, Space } from 'antd'
import { useEffect } from 'react'
import type { FormInstance } from 'antd'
import type { ReactNode } from 'react'

interface CrudDrawerProps<T extends object> {
  open: boolean
  title: string
  mode: 'create' | 'edit'
  loading?: boolean
  initialValues?: Partial<T>
  onClose: () => void
  onSubmit: (values: T) => void | Promise<void>
  children: (form: FormInstance<T>) => ReactNode
}

export default function CrudDrawer<T extends object>({
  open,
  title,
  mode,
  loading,
  initialValues,
  onClose,
  onSubmit,
  children,
}: CrudDrawerProps<T>) {
  const [form] = Form.useForm<T>()

  useEffect(() => {
    if (open) {
      form.setFieldsValue((initialValues ?? {}) as Parameters<typeof form.setFieldsValue>[0])
    } else {
      form.resetFields()
    }
  }, [open, initialValues, form])

  return (
    <Drawer
      title={title}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </Space>
      }
    >
      <Form<T> form={form} layout="vertical" onFinish={onSubmit}>
        {children(form)}
      </Form>
    </Drawer>
  )
}
