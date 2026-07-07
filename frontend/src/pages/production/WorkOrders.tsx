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
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
  createWorkOrder,
  deleteWorkOrder,
  getMaterialRequirement,
  listFactories,
  listProducts,
  listRecipes,
  listWorkOrders,
  updateWorkOrder,
} from '../../api/production'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import CrudDrawer from '../../components/common/CrudDrawer'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import { formatDate, formatNumber } from '../../utils/format'
import type {
  MaterialRequirement,
  WorkOrder,
  WorkOrderCreate,
  WorkOrderUpdate,
} from '../../types/production'

interface WorkOrderFormValues {
  factory_id: string
  product_id: string
  recipe_id: string
  production_date: dayjs.Dayjs
  production_qty: number
}

export default function WorkOrders() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<WorkOrder | undefined>()
  const [materialDrawerOpen, setMaterialDrawerOpen] = useState(false)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword }),
    [page, pageSize, keyword],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['work-orders', listParams],
    queryFn: () => listWorkOrders(listParams),
  })

  const { data: factoriesData } = useQuery({
    queryKey: ['factories', 'all'],
    queryFn: () => listFactories({ page: 1, page_size: 100 }),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => listProducts({ page: 1, page_size: 100 }),
  })

  const { data: recipesData } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => listRecipes({ page: 1, page_size: 100 }),
  })

  const { data: materialReq, isLoading: materialLoading } = useQuery({
    queryKey: ['material-requirement', selectedWorkOrderId],
    queryFn: () => getMaterialRequirement(selectedWorkOrderId!),
    enabled: !!selectedWorkOrderId && materialDrawerOpen,
  })

  const factoryOptions =
    factoriesData?.items.map((f) => ({
      value: f.factory_id,
      label: `${f.factory_name} (${f.factory_id})`,
    })) ?? []

  const productOptions =
    productsData?.items.map((p) => ({
      value: p.product_id,
      label: `${p.product_name} (${p.product_id})`,
    })) ?? []

  const recipeOptions =
    recipesData?.items.map((r) => ({
      value: r.recipe_id,
      label: `${r.recipe_name} ${r.recipe_version} (${r.recipe_id})`,
    })) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['work-orders'] })

  const createMutation = useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkOrderUpdate }) =>
      updateWorkOrder(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteWorkOrder, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    setDrawerOpen(true)
  }

  const openEdit = (record: WorkOrder) => {
    setMode('edit')
    setEditing(record)
    setDrawerOpen(true)
  }

  const openMaterial = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId)
    setMaterialDrawerOpen(true)
  }

  const handleSubmit = async (values: WorkOrderFormValues) => {
    const payload = {
      factory_id: values.factory_id,
      product_id: values.product_id,
      recipe_id: values.recipe_id,
      production_date: values.production_date.format('YYYY-MM-DD'),
      production_qty: values.production_qty,
    }
    if (mode === 'create') {
      await createMutation.mutateAsync(payload as WorkOrderCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.work_order_id,
        payload: payload as WorkOrderUpdate,
      })
    }
  }

  const drawerInitial =
    mode === 'edit' && editing
      ? {
          factory_id: editing.factory_id,
          product_id: editing.product_id,
          recipe_id: editing.recipe_id,
          production_date: dayjs(editing.production_date),
          production_qty: Number(editing.production_qty),
        }
      : undefined

  const columns: ColumnsType<WorkOrder> = [
    { title: '工单ID', dataIndex: 'work_order_id', width: 110 },
    { title: '工厂', dataIndex: 'factory_id', width: 100 },
    { title: '产品', dataIndex: 'product_id', width: 100 },
    { title: '配方', dataIndex: 'recipe_id', width: 100 },
    {
      title: '生产日期',
      dataIndex: 'production_date',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '产量',
      dataIndex: 'production_qty',
      width: 100,
      render: (v) => formatNumber(v),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => openMaterial(record.work_order_id)}>
            原料需求
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() =>
              confirmDelete({
                onOk: () => deleteMutation.mutateAsync(record.work_order_id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const materialColumns: ColumnsType<MaterialRequirement['items'][number]> = [
    { title: '原料ID', dataIndex: 'ingredient_id', width: 110 },
    { title: '名称', dataIndex: 'ingredient_name' },
    { title: '单位', dataIndex: 'unit', width: 80 },
    {
      title: '需求量',
      dataIndex: 'required_qty',
      width: 120,
      render: (v) => formatNumber(v),
    },
  ]

  return (
    <div className="page-content">
      <PageHeader
        title="生产工单"
        subtitle="下达生产任务并测算原料需求"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增工单
          </Button>
        }
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索工单ID"
          onSearch={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          style={{ maxWidth: 280 }}
        />
      </div>

      <DataTable<WorkOrder>
        rowKey="work_order_id"
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

      <CrudDrawer<WorkOrderFormValues>
        open={drawerOpen}
        title={mode === 'create' ? '新增生产工单' : '编辑生产工单'}
        mode={mode}
        loading={createMutation.isPending || updateMutation.isPending}
        initialValues={drawerInitial}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      >
        {() => (
          <>
            <Form.Item
              name="factory_id"
              label="工厂"
              rules={[{ required: true, message: '请选择工厂' }]}
            >
              <Select options={factoryOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item
              name="product_id"
              label="产品"
              rules={[{ required: true, message: '请选择产品' }]}
            >
              <Select options={productOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item
              name="recipe_id"
              label="配方"
              rules={[{ required: true, message: '请选择配方' }]}
            >
              <Select options={recipeOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item
              name="production_date"
              label="生产日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="production_qty"
              label="生产数量"
              rules={[{ required: true, message: '请输入产量' }]}
            >
              <InputNumber min={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
      </CrudDrawer>

      <Drawer
        title={`原料需求测算 — ${selectedWorkOrderId ?? ''}`}
        width={560}
        open={materialDrawerOpen}
        onClose={() => {
          setMaterialDrawerOpen(false)
          setSelectedWorkOrderId(null)
        }}
      >
        {materialReq && (
          <p style={{ marginBottom: 16 }}>
            计划产量：<strong>{formatNumber(materialReq.production_qty)}</strong>
          </p>
        )}
        <Table
          size="small"
          rowKey="ingredient_id"
          loading={materialLoading}
          columns={materialColumns}
          dataSource={materialReq?.items ?? []}
          pagination={false}
        />
      </Drawer>
    </div>
  )
}
