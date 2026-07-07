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
import { listIngredients } from '../../api/purchase'
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  completePurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  listPurchaseOrders,
  listSuppliers,
  updatePurchaseOrder,
} from '../../api/purchase'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDate, formatMoney } from '../../utils/format'
import type {
  PurchaseDetailCreate,
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from '../../types/purchase'

interface OrderFormValues {
  supplier_id: string
  order_date: dayjs.Dayjs
  details: PurchaseDetailCreate[]
}

export default function PurchaseOrders() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<OrderFormValues>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<PurchaseOrder | undefined>()

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword, order_status: statusFilter }),
    [page, pageSize, keyword, statusFilter],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['purchase-orders', listParams],
    queryFn: () => listPurchaseOrders(listParams),
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => listSuppliers({ page: 1, page_size: 100 }),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', 'all'],
    queryFn: () => listIngredients({ page: 1, page_size: 100 }),
  })

  const supplierOptions =
    suppliersData?.items.map((s) => ({
      value: s.supplier_id,
      label: `${s.supplier_name} (${s.supplier_id})`,
    })) ?? []

  const ingredientOptions =
    ingredientsData?.items.map((i) => ({
      value: i.ingredient_id,
      label: `${i.ingredient_name} (${i.ingredient_id})`,
    })) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PurchaseOrderUpdate }) =>
      updatePurchaseOrder(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deletePurchaseOrder, onSuccess: invalidate })
  const approveMutation = useMutation({ mutationFn: approvePurchaseOrder, onSuccess: invalidate })
  const completeMutation = useMutation({
    mutationFn: completePurchaseOrder,
    onSuccess: invalidate,
  })
  const cancelMutation = useMutation({ mutationFn: cancelPurchaseOrder, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    form.resetFields()
    form.setFieldsValue({ details: [{} as PurchaseDetailCreate] })
    setDrawerOpen(true)
  }

  const openEdit = (record: PurchaseOrder) => {
    setMode('edit')
    setEditing(record)
    form.setFieldsValue({
      supplier_id: record.supplier_id,
      order_date: dayjs(record.order_date),
      details: record.details.map((d) => ({
        ingredient_id: d.ingredient_id,
        purchase_qty: Number(d.purchase_qty),
        purchase_unit_price: Number(d.purchase_unit_price),
      })),
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: OrderFormValues) => {
    const payload = {
      supplier_id: values.supplier_id,
      order_date: values.order_date.format('YYYY-MM-DD'),
      details: values.details,
    }
    if (mode === 'create') {
      await createMutation.mutateAsync(payload as PurchaseOrderCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.purchase_order_id,
        payload: payload as PurchaseOrderUpdate,
      })
    }
  }

  const columns: ColumnsType<PurchaseOrder> = [
    { title: '订单ID', dataIndex: 'purchase_order_id', width: 110 },
    { title: '供应商', dataIndex: 'supplier_id', width: 100 },
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
      width: 280,
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
                onClick={() => approveMutation.mutate(record.purchase_order_id)}
              >
                审批
              </Button>
            </>
          )}
          {record.order_status === 'APPROVED' && (
            <Button
              type="link"
              size="small"
              onClick={() => completeMutation.mutate(record.purchase_order_id)}
            >
              完成
            </Button>
          )}
          {['PENDING', 'APPROVED'].includes(record.order_status) && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => cancelMutation.mutate(record.purchase_order_id)}
            >
              取消
            </Button>
          )}
          {['PENDING', 'CANCELLED'].includes(record.order_status) && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() =>
                confirmDelete({
                  onOk: () => deleteMutation.mutateAsync(record.purchase_order_id),
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
        title="采购订单"
        subtitle="创建采购单、维护明细并流转订单状态"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增订单
          </Button>
        }
      />

      <div className="toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索订单ID、供应商"
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
            { value: 'APPROVED', label: 'APPROVED' },
            { value: 'COMPLETED', label: 'COMPLETED' },
            { value: 'CANCELLED', label: 'CANCELLED' },
          ]}
        />
      </div>

      <DataTable<PurchaseOrder>
        rowKey="purchase_order_id"
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
        title={mode === 'create' ? '新增采购订单' : '编辑采购订单'}
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
            name="supplier_id"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select options={supplierOptions} showSearch optionFilterProp="label" />
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
                <div style={{ marginBottom: 8, fontWeight: 500 }}>采购明细</div>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={fields}
                  rowKey="key"
                  columns={[
                    {
                      title: '原料',
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'ingredient_id']}
                          rules={[{ required: true, message: '必选' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select options={ingredientOptions} showSearch optionFilterProp="label" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '数量',
                      width: 120,
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'purchase_qty']}
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
                          name={[field.name, 'purchase_unit_price']}
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
