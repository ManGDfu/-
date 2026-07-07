import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import { createStore, deleteStore, listStores, updateStore } from '../../api/sales'
import CrudPage from '../../components/common/CrudPage'
import type { Store, StoreCreate, StoreUpdate } from '../../types/sales'

const storeApi = {
  list: listStores,
  create: createStore,
  update: updateStore,
  delete: deleteStore,
}

export default function Stores() {
  const columns: ColumnsType<Store> = [
    { title: '门店ID', dataIndex: 'store_id', width: 100 },
    { title: '名称', dataIndex: 'store_name' },
    { title: '地址', dataIndex: 'store_address', ellipsis: true },
    { title: '负责人', dataIndex: 'store_manager', width: 120 },
    { title: '电话', dataIndex: 'contact_phone', width: 140 },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="store_name"
        label="门店名称"
        rules={[{ required: true, message: '请输入门店名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="store_address"
        label="地址"
        rules={[{ required: true, message: '请输入地址' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="store_manager"
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
    <CrudPage<Store, StoreCreate, StoreUpdate>
      title="门店"
      subtitle="维护终端门店档案"
      rowKey="store_id"
      queryKey="stores"
      api={storeApi}
      columns={columns}
      searchPlaceholder="搜索名称、负责人、地址"
      getRecordId={(r) => r.store_id}
      getEditInitialValues={(r) => ({
        store_name: r.store_name,
        store_address: r.store_address,
        store_manager: r.store_manager,
        contact_phone: r.contact_phone,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
