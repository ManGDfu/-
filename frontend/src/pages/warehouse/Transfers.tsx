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
  createTransferOrder,
  deleteTransferOrder,
  listTransferOrders,
  listWarehouses,
  updateTransferOrder,
} from '../../api/warehouse'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDate } from '../../utils/format'
import type {
  TransferDetailCreate,
  TransferOrder,
  TransferOrderCreate,
  TransferOrderUpdate,
} from '../../types/warehouse'

const TRANSFER_TYPE_OPTIONS = [
  { value: 'BALANCE', label: '均衡 (BALANCE)' },
  { value: 'EMERGENCY', label: '紧急 (EMERGENCY)' },
  { value: 'REPLENISH', label: '补货 (REPLENISH)' },
]

interface TransferFormValues {
  source_warehouse_id: string
  target_warehouse_id: string
  transfer_date: dayjs.Dayjs
  transfer_type: string
  details: TransferDetailCreate[]
}

export default function Transfers() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<TransferFormValues>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<TransferOrder | undefined>()

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword }),
    [page, pageSize, keyword],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['transfer-orders', listParams],
    queryFn: () => listTransferOrders(listParams),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => listWarehouses({ page: 1, page_size: 100 }),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', 'all'],
    queryFn: () => listIngredients({ page: 1, page_size: 100 }),
  })

  const warehouseOptions =
    warehousesData?.items.map((w) => ({
      value: w.warehouse_id,
      label: `${w.warehouse_name} (${w.warehouse_id})`,
    })) ?? []

  const ingredientOptions =
    ingredientsData?.items.map((i) => ({
      value: i.ingredient_id,
      label: `${i.ingredient_name} (${i.ingredient_id})`,
    })) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transfer-orders'] })

  const createMutation = useMutation({
    mutationFn: createTransferOrder,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransferOrderUpdate }) =>
      updateTransferOrder(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteTransferOrder, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    form.resetFields()
    form.setFieldsValue({ details: [{} as TransferDetailCreate] })
    setDrawerOpen(true)
  }

  const openEdit = (record: TransferOrder) => {
    setMode('edit')
    setEditing(record)
    form.setFieldsValue({
      source_warehouse_id: record.source_warehouse_id,
      target_warehouse_id: record.target_warehouse_id,
      transfer_date: dayjs(record.transfer_date),
      transfer_type: record.transfer_type,
      details: record.details.map((d) => ({
        ingredient_id: d.ingredient_id,
        transfer_qty: Number(d.transfer_qty),
      })),
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: TransferFormValues) => {
    const payload = {
      source_warehouse_id: values.source_warehouse_id,
      target_warehouse_id: values.target_warehouse_id,
      transfer_date: values.transfer_date.format('YYYY-MM-DD'),
      transfer_type: values.transfer_type,
      details: values.details,
    }
    if (mode === 'create') {
      await createMutation.mutateAsync(payload as TransferOrderCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.transfer_order_id,
        payload: payload as TransferOrderUpdate,
      })
    }
  }

  const columns: ColumnsType<TransferOrder> = [
    { title: '调拨单ID', dataIndex: 'transfer_order_id', width: 120 },
    { title: '源仓库', dataIndex: 'source_warehouse_id', width: 100 },
    { title: '目标仓库', dataIndex: 'target_warehouse_id', width: 100 },
    {
      title: '调拨日期',
      dataIndex: 'transfer_date',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '类型',
      dataIndex: 'transfer_type',
      width: 120,
      render: (v) => <StatusTag status={v} />,
    },
    { title: '明细数', width: 80, render: (_, r) => r.details?.length ?? 0 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() =>
              confirmDelete({
                onOk: () => deleteMutation.mutateAsync(record.transfer_order_id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-content">
      <PageHeader
        title="调拨单"
        subtitle="仓间原料调拨及明细维护"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增调拨单
          </Button>
        }
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索调拨单ID"
          onSearch={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          style={{ maxWidth: 280 }}
        />
      </div>

      <DataTable<TransferOrder>
        rowKey="transfer_order_id"
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
        title={mode === 'create' ? '新增调拨单' : '编辑调拨单'}
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
            name="source_warehouse_id"
            label="源仓库"
            rules={[{ required: true, message: '请选择源仓库' }]}
          >
            <Select options={warehouseOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="target_warehouse_id"
            label="目标仓库"
            rules={[{ required: true, message: '请选择目标仓库' }]}
          >
            <Select options={warehouseOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="transfer_date"
            label="调拨日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="transfer_type"
            label="调拨类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select options={TRANSFER_TYPE_OPTIONS} />
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
                <div style={{ marginBottom: 8, fontWeight: 500 }}>调拨明细</div>
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
                      width: 140,
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'transfer_qty']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.01} style={{ width: '100%' }} />
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
