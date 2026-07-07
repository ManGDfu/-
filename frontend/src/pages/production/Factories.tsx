import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createFactory,
  deleteFactory,
  listFactories,
  updateFactory,
} from '../../api/production'
import CrudPage from '../../components/common/CrudPage'
import type { Factory, FactoryCreate, FactoryUpdate } from '../../types/production'

const factoryApi = {
  list: listFactories,
  create: createFactory,
  update: updateFactory,
  delete: deleteFactory,
}

export default function Factories() {
  const columns: ColumnsType<Factory> = [
    { title: '工厂ID', dataIndex: 'factory_id', width: 100 },
    { title: '名称', dataIndex: 'factory_name' },
    { title: '位置', dataIndex: 'factory_location', ellipsis: true },
    { title: '负责人', dataIndex: 'manager_name', width: 120 },
    { title: '电话', dataIndex: 'contact_phone', width: 140 },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="factory_name"
        label="工厂名称"
        rules={[{ required: true, message: '请输入工厂名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="factory_location"
        label="位置"
        rules={[{ required: true, message: '请输入位置' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="manager_name"
        label="负责人"
        rules={[{ required: true, message: '请输入负责人' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="contact_phone"
        label="联系电话"
        rules={[{ required: true, message: '请输入联系电话' }]}
      >
        <Input />
      </Form.Item>
    </>
  )

  return (
    <CrudPage<Factory, FactoryCreate, FactoryUpdate>
      title="工厂"
      subtitle="维护生产工厂档案"
      rowKey="factory_id"
      queryKey="factories"
      api={factoryApi}
      columns={columns}
      searchPlaceholder="搜索名称、负责人"
      getRecordId={(r) => r.factory_id}
      getEditInitialValues={(r) => ({
        factory_name: r.factory_name,
        factory_location: r.factory_location,
        manager_name: r.manager_name,
        contact_phone: r.contact_phone,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
