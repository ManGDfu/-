import { Form, Input, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../../api/production'
import CrudPage from '../../components/common/CrudPage'
import { formatMoney } from '../../utils/format'
import type { Product, ProductCreate, ProductUpdate } from '../../types/production'

const productApi = {
  list: listProducts,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct,
}

export default function Products() {
  const columns: ColumnsType<Product> = [
    { title: '产品ID', dataIndex: 'product_id', width: 100 },
    { title: '名称', dataIndex: 'product_name' },
    { title: '类别', dataIndex: 'product_category', width: 120 },
    {
      title: '售价',
      dataIndex: 'sales_price',
      width: 110,
      render: (v) => formatMoney(v),
    },
    { title: '保质期(天)', dataIndex: 'shelf_life_days', width: 110 },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="product_name"
        label="产品名称"
        rules={[{ required: true, message: '请输入产品名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="product_category"
        label="类别"
        rules={[{ required: true, message: '请输入类别' }]}
      >
        <Input placeholder="如 主菜、汤品、小食" />
      </Form.Item>
      <Form.Item
        name="sales_price"
        label="售价"
        rules={[{ required: true, message: '请输入售价' }]}
      >
        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="shelf_life_days"
        label="保质期(天)"
        rules={[{ required: true, message: '请输入保质期' }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
    </>
  )

  return (
    <CrudPage<Product, ProductCreate, ProductUpdate>
      title="产品"
      subtitle="维护预制菜品主数据"
      rowKey="product_id"
      queryKey="products"
      api={productApi}
      columns={columns}
      searchPlaceholder="搜索名称、类别"
      getRecordId={(r) => r.product_id}
      getEditInitialValues={(r) => ({
        product_name: r.product_name,
        product_category: r.product_category,
        sales_price: Number(r.sales_price),
        shelf_life_days: r.shelf_life_days,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
