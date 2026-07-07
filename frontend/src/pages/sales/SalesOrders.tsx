import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
} from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { listProducts } from '../../api/production'
import {
  cancelSalesOrder,
  completeSalesOrder,
  createSalesOrder,
  deleteSalesOrder,
  listSalesOrders,
  listStores,
  paySalesOrder,
  shipSalesOrder,
  updateSalesOrder,
} from '../../api/sales'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDate, formatMoney } from '../../utils/format'
import type {
  SalesDetailCreate,
  SalesOrder,
  SalesOrderCreate,
  SalesOrderUpdate,
} from '../../types/sales'

interface SalesFormValues {
  store_id: string
  order_date: dayjs.Dayjs
  details: SalesDetailCreate[]
}

export default function SalesOrders() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<SalesFormValues>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<SalesOrder | undefined>()

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword, order_status: statusFilter }),
    [page, pageSize, keyword, statusFilter],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sales-orders', listParams],
    queryFn: () => listSalesOrders(listParams),
  })

  const { data: storesData } = useQuery({
    queryKey: ['stores', 'all'],
    queryFn: () => listStores({ page: 1, page_size: 100 }),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => listProducts({ page: 1, page_size: 100 }),
  })

  const storeOptions =
    storesData?.items.map((s) => ({
      value: s.store_id,
      label: `${s.store_name} (${s.store_id})`,
    })) ?? []

  const productOptions =
    productsData?.items.map((p) => ({
      value: p.product_id,
      label: `${p.product_name} (${p.product_id})`,
    })) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sales-orders'] })

  const createMutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SalesOrderUpdate }) =>
      updateSalesOrder(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteSalesOrder, onSuccess: invalidate })
  const payMutation = useMutation({ mutationFn: paySalesOrder, onSuccess: invalidate })
  const shipMutation = useMutation({ mutationFn: shipSalesOrder, onSuccess: invalidate })
  const completeMutation = useMutation({ mutationFn: completeSalesOrder, onSuccess: invalidate })
  const cancelMutation = useMutation({ mutationFn: cancelSalesOrder, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    form.resetFields()
    form.setFieldsValue({ details: [{} as SalesDetailCreate] })
    setDrawerOpen(true)
  }

  const openEdit = (record: SalesOrder) => {
    setMode('edit')
    setEditing(record)
    form.setFieldsValue({
      store_id: record.store_id,
      order_date: dayjs(record.order_date),
      details: record.details.map((d) => ({
        product_id: d.product_id,
        sales_qty: Number(d.sales_qty),
        sales_unit_price: Number(d.sales_unit_price),
      })),
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: SalesFormValues) => {
    const payload = {
      store_id: values.store_id,
      order_date: values.order_date.format('YYYY-MM-DD'),
      details: values.details,
    }
    if (mode === 'create') {
      await createMutation.mutateAsync(payload as SalesOrderCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.sales_order_id,
        payload: payload as SalesOrderUpdate,
      })
    }
  }

  const columns: ColumnsType<SalesOrder> = [
    { title: '订单ID', dataIndex: 'sales_order_id', width: 110 },
    { title: '门店', dataIndex: 'store_id', width: 100 },
    {
      title: '订单日期',
      dataIndex: 'order_date',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '总金额',
      dataIndex: 'order_total_amount',
      width: 120,
      render: (v) => formatMoney(v),
    },
    {
      title: '状态',
      dataIndex: 'order_status',
      width: 110,
      render: (v) => <StatusTag status={v} />,
    },
    { title: '明细数', width: 80, render: (_, r) => r.details?.length ?? 0 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.order_status === 'PENDING' && (
            <>
              <Button type="link" size="small" onClick={() => openEdit(record)}>
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => payMutation.mutate(record.sales_order_id)}
              >
                支付
              </Button>
            </>
          )}
          {record.order_status === 'PAID' && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => shipMutation.mutate(record.sales_order_id)}
              >
                发货
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => cancelMutation.mutate(record.sales_order_id)}
              >
                取消
              </Button>
            </>
          )}
          {record.order_status === 'SHIPPED' && (
            <Button
              type="link"
              size="small"
              onClick={() => completeMutation.mutate(record.sales_order_id)}
            >
              完成
            </Button>
          )}
          {['PENDING', 'CANCELLED'].includes(record.order_status) && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() =>
                confirmDelete({
                  onOk: () => deleteMutation.mutateAsync(record.sales_order_id),
                })
              }
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-content">
      <PageHeader
        title="销售订单"
        subtitle="门店销售订单录入与状态流转"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增订单
          </Button>
        }
      />

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索订单ID、门店"
          onSearch={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          style={{ maxWidth: 280 }}
        />
        <Select
          allowClear
          placeholder="订单状态"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
          options={[
            { value: 'PENDING', label: 'PENDING' },
            { value: 'PAID', label: 'PAID' },
            { value: 'SHIPPED', label: 'SHIPPED' },
            { value: 'COMPLETED', label: 'COMPLETED' },
            { value: 'CANCELLED', label: 'CANCELLED' },
          ]}
        />
      </div>

      <DataTable<SalesOrder>
        rowKey="sales_order_id"
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <Drawer
        title={mode === 'create' ? '新增销售订单' : '编辑销售订单'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => form.submit()}
            >
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="store_id"
            label="门店"
            rules={[{ required: true, message: '请选择门店' }]}
          >
            <Select options={storeOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="order_date"
            label="订单日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.List
            name="details"
            rules={[
              {
                validator: async (_, details) => {
                  if (!details || details.length < 1) {
                    return Promise.reject(new Error('至少添加一条明细'))
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>销售明细</div>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={fields}
                  rowKey="key"
                  columns={[
                    {
                      title: '产品',
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'product_id']}
                          rules={[{ required: true, message: '必选' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select options={productOptions} showSearch optionFilterProp="label" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '数量',
                      width: 120,
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'sales_qty']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.01} style={{ width: '100%' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '单价',
                      width: 120,
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'sales_unit_price']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '',
                      width: 40,
                      render: (_, field) =>
                        fields.length > 1 ? (
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        ) : null,
                    },
                  ]}
                />
                <Form.ErrorList errors={errors} />
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  添加明细
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </div>
  )
}
