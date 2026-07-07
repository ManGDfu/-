import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { listIngredients } from '../../api/purchase'
import {
  createInventory,
  deleteInventory,
  listInventory,
  listWarehouses,
  updateInventory,
} from '../../api/warehouse'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import CrudDrawer from '../../components/common/CrudDrawer'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import { formatDate, formatNumber } from '../../utils/format'
import type { Inventory, InventoryCreate, InventoryUpdate } from '../../types/warehouse'

interface InventoryFormValues {
  warehouse_id: string
  ingredient_id: string
  stock_qty: number
  production_date: dayjs.Dayjs
  expiry_date: dayjs.Dayjs
  safety_stock: number
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [expiringDays, setExpiringDays] = useState<number | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Inventory | undefined>()

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      keyword,
      low_stock: lowStock ? true : undefined,
      expiring_in_days: expiringDays,
    }),
    [page, pageSize, keyword, lowStock, expiringDays],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inventory', listParams],
    queryFn: () => listInventory(listParams),
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inventory'] })

  const createMutation = useMutation({
    mutationFn: createInventory,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryUpdate }) =>
      updateInventory(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteInventory, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    setDrawerOpen(true)
  }

  const openEdit = (record: Inventory) => {
    setMode('edit')
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: InventoryFormValues) => {
    const payload = {
      warehouse_id: values.warehouse_id,
      ingredient_id: values.ingredient_id,
      stock_qty: values.stock_qty,
      safety_stock: values.safety_stock,
      production_date: values.production_date.format('YYYY-MM-DD'),
      expiry_date: values.expiry_date.format('YYYY-MM-DD'),
    }
    if (mode === 'create') {
      await createMutation.mutateAsync(payload as InventoryCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.inventory_id,
        payload: payload as InventoryUpdate,
      })
    }
  }

  const drawerInitial =
    mode === 'edit' && editing
      ? {
          warehouse_id: editing.warehouse_id,
          ingredient_id: editing.ingredient_id,
          stock_qty: Number(editing.stock_qty),
          safety_stock: Number(editing.safety_stock),
          production_date: dayjs(editing.production_date),
          expiry_date: dayjs(editing.expiry_date),
        }
      : undefined

  const columns: ColumnsType<Inventory> = [
    { title: '库存ID', dataIndex: 'inventory_id', width: 100 },
    { title: '仓库', dataIndex: 'warehouse_id', width: 100 },
    { title: '原料', dataIndex: 'ingredient_id', width: 100 },
    {
      title: '库存量',
      dataIndex: 'stock_qty',
      width: 100,
      render: (v, record) => {
        const low = Number(v) < Number(record.safety_stock)
        return (
          <span style={low ? { color: '#cf1322', fontWeight: 500 } : undefined}>
            {formatNumber(v)}
          </span>
        )
      },
    },
    {
      title: '安全库存',
      dataIndex: 'safety_stock',
      width: 100,
      render: (v) => formatNumber(v),
    },
    {
      title: '生产日期',
      dataIndex: 'production_date',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '过期日期',
      dataIndex: 'expiry_date',
      width: 120,
      render: (v) => formatDate(v),
    },
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
                onOk: () => deleteMutation.mutateAsync(record.inventory_id),
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
        title="库存"
        subtitle="按仓库/原料查看批次库存，支持低库存与临期预警"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增
          </Button>
        }
      />

      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索库存ID、仓库、原料"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          style={{ maxWidth: 320 }}
        />
        <span>
          仅低库存 <Switch checked={lowStock} onChange={setLowStock} />
        </span>
        <Select
          allowClear
          placeholder="临期筛选"
          style={{ width: 160 }}
          value={expiringDays}
          onChange={setExpiringDays}
          options={[
            { value: 7, label: '7 天内到期' },
            { value: 14, label: '14 天内到期' },
            { value: 30, label: '30 天内到期' },
          ]}
        />
      </div>

      <DataTable<Inventory>
        rowKey="inventory_id"
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

      <CrudDrawer<InventoryFormValues>
        open={drawerOpen}
        title={mode === 'create' ? '新增库存' : '编辑库存'}
        mode={mode}
        loading={createMutation.isPending || updateMutation.isPending}
        initialValues={drawerInitial}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      >
        {() => (
          <>
            <Form.Item
              name="warehouse_id"
              label="仓库"
              rules={[{ required: true, message: '请选择仓库' }]}
            >
              <Select options={warehouseOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item
              name="ingredient_id"
              label="原料"
              rules={[{ required: true, message: '请选择原料' }]}
            >
              <Select options={ingredientOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item
              name="stock_qty"
              label="库存量"
              rules={[{ required: true, message: '请输入库存量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="safety_stock"
              label="安全库存"
              rules={[{ required: true, message: '请输入安全库存' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="production_date"
              label="生产日期"
              rules={[{ required: true, message: '请选择生产日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="expiry_date"
              label="过期日期"
              rules={[{ required: true, message: '请选择过期日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
      </CrudDrawer>
    </div>
  )
}
