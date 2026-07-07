import { Form, Input, InputNumber, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
} from '../../api/warehouse'
import CrudPage from '../../components/common/CrudPage'
import StatusTag from '../../components/common/StatusTag'
import type { Warehouse, WarehouseCreate, WarehouseUpdate } from '../../types/warehouse'

const TEMP_OPTIONS = [
  { value: 'FROZEN', label: '冷冻 (FROZEN)' },
  { value: 'CHILLED', label: '冷藏 (CHILLED)' },
  { value: 'NORMAL', label: '常温 (NORMAL)' },
]

const warehouseApi = {
  list: listWarehouses,
  create: createWarehouse,
  update: updateWarehouse,
  delete: deleteWarehouse,
}

export default function Warehouses() {
  const columns: ColumnsType<Warehouse> = [
    { title: '仓库ID', dataIndex: 'warehouse_id', width: 100 },
    { title: '名称', dataIndex: 'warehouse_name' },
    { title: '位置', dataIndex: 'warehouse_location', ellipsis: true },
    { title: '容量', dataIndex: 'warehouse_capacity', width: 100 },
    {
      title: '温区',
      dataIndex: 'temperature_type',
      width: 120,
      render: (v: string) => <StatusTag status={v} />,
    },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="warehouse_name"
        label="仓库名称"
        rules={[{ required: true, message: '请输入仓库名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="warehouse_location"
        label="位置"
        rules={[{ required: true, message: '请输入位置' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="warehouse_capacity"
        label="容量"
        rules={[{ required: true, message: '请输入容量' }]}
      >
        <InputNumber min={0.01} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="temperature_type"
        label="温区类型"
        rules={[{ required: true, message: '请选择温区' }]}
      >
        <Select options={TEMP_OPTIONS} placeholder="选择温区" />
      </Form.Item>
    </>
  )

  return (
    <CrudPage<Warehouse, WarehouseCreate, WarehouseUpdate>
      title="仓库"
      subtitle="维护冷链仓库档案"
      rowKey="warehouse_id"
      queryKey="warehouses"
      api={warehouseApi}
      columns={columns}
      searchPlaceholder="搜索名称、位置"
      getRecordId={(r) => r.warehouse_id}
      getEditInitialValues={(r) => ({
        warehouse_name: r.warehouse_name,
        warehouse_location: r.warehouse_location,
        warehouse_capacity: Number(r.warehouse_capacity),
        temperature_type: r.temperature_type,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
