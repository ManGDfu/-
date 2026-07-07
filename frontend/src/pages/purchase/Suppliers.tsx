import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from '../../api/purchase'
import CrudPage from '../../components/common/CrudPage'
import type { Supplier, SupplierCreate, SupplierUpdate } from '../../types/purchase'

const supplierApi = {
  list: listSuppliers,
  create: createSupplier,
  update: updateSupplier,
  delete: deleteSupplier,
}

export default function Suppliers() {
  const columns: ColumnsType<Supplier> = [
    { title: '供应商ID', dataIndex: 'supplier_id', width: 110 },
    { title: '名称', dataIndex: 'supplier_name' },
    { title: '联系人', dataIndex: 'contact_person', width: 120 },
    { title: '电话', dataIndex: 'contact_phone', width: 140 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="supplier_name"
        label="供应商名称"
        rules={[{ required: true, message: '请输入供应商名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="contact_person"
        label="联系人"
        rules={[{ required: true, message: '请输入联系人' }]}
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
      <Form.Item
        name="address"
        label="地址"
        rules={[{ required: true, message: '请输入地址' }]}
      >
        <Input.TextArea rows={2} />
      </Form.Item>
    </>
  )

  return (
    <CrudPage<Supplier, SupplierCreate, SupplierUpdate>
      title="供应商"
      subtitle="维护供应商档案"
      rowKey="supplier_id"
      queryKey="suppliers"
      api={supplierApi}
      columns={columns}
      searchPlaceholder="搜索名称、联系人、电话"
      getRecordId={(r) => r.supplier_id}
      getEditInitialValues={(r) => ({
        supplier_name: r.supplier_name,
        contact_person: r.contact_person,
        contact_phone: r.contact_phone,
        address: r.address,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
