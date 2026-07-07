import { useQuery } from '@tanstack/react-query'
import { Form, Input, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  updateUser,
} from '../../api/auth'
import CrudPage from '../../components/common/CrudPage'
import type { User, UserCreate, UserUpdate } from '../../types/auth'

const userApi = {
  list: listUsers,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
}

export default function Users() {
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })

  const columns: ColumnsType<User> = [
    { title: '用户ID', dataIndex: 'user_id', width: 100 },
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'real_name' },
    { title: '电话', dataIndex: 'contact_phone' },
    {
      title: '角色',
      dataIndex: ['role', 'role_name'],
      render: (_, record) => record.role?.role_name ?? record.role_id,
    },
  ]

  const renderForm = (_form: FormInstance, mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="role_id"
        label="角色"
        rules={[{ required: true, message: '请选择角色' }]}
      >
        <Select
          options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
          placeholder="选择角色"
        />
      </Form.Item>
      <Form.Item
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="login_password"
        label={mode === 'create' ? '登录密码' : '新密码（留空不修改）'}
        rules={mode === 'create' ? [{ required: true, message: '请输入密码' }] : []}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="real_name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="contact_phone"
        label="联系电话"
        rules={[{ required: true, message: '请输入电话' }]}
      >
        <Input />
      </Form.Item>
    </>
  )

  return (
    <CrudPage<User, UserCreate, UserUpdate>
      title="用户"
      rowKey="user_id"
      queryKey="users"
      api={userApi}
      columns={columns}
      searchPlaceholder="搜索用户名、姓名、电话"
      getRecordId={(r) => r.user_id}
      getEditInitialValues={(r) => ({
        role_id: r.role_id,
        username: r.username,
        real_name: r.real_name,
        contact_phone: r.contact_phone,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => {
        const payload: UserUpdate = { ...v }
        if (!payload.login_password) {
          delete payload.login_password
        }
        return payload
      }}
      renderForm={(form, mode) => renderForm(form, mode)}
    />
  )
}
