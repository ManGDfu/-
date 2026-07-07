import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Space } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import type { ListParams, PaginatedResponse } from '../../types/common'
import { confirmDelete } from './ConfirmDelete'
import CrudDrawer from './CrudDrawer'
import DataTable from './DataTable'
import PageHeader from './PageHeader'

export interface CrudApi<T, Create, Update> {
  list: (params: ListParams) => Promise<PaginatedResponse<T>>
  create: (payload: Create) => Promise<T>
  update: (id: string, payload: Update) => Promise<T>
  delete: (id: string) => Promise<void>
}

interface CrudPageProps<T extends object, Create extends object, Update extends object> {
  title: string
  subtitle?: string
  rowKey: keyof T & string
  queryKey: string
  api: CrudApi<T, Create, Update>
  columns: ColumnsType<T>
  renderForm: (form: FormInstance, mode: 'create' | 'edit', record?: T) => ReactNode
  getRecordId: (record: T) => string
  toCreatePayload: (values: Create) => Create
  toUpdatePayload: (values: Update, record: T) => Update
  getEditInitialValues?: (record: T) => Partial<Update>
  extraParams?: ListParams
  searchPlaceholder?: string
}

export default function CrudPage<
  T extends object,
  Create extends object,
  Update extends object,
>({
  title,
  subtitle,
  rowKey,
  queryKey,
  api,
  columns,
  renderForm,
  getRecordId,
  toCreatePayload,
  toUpdatePayload,
  getEditInitialValues,
  extraParams,
  searchPlaceholder = '关键词搜索',
}: CrudPageProps<T, Create, Update>) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<T | undefined>()

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword, ...extraParams }),
    [page, pageSize, keyword, extraParams],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [queryKey, listParams],
    queryFn: () => api.list(listParams),
  })

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Update }) => api.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  })

  const actionColumn: ColumnsType<T>[number] = {
    title: '操作',
    key: 'actions',
    fixed: 'right',
    width: 160,
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
              onOk: () => deleteMutation.mutateAsync(getRecordId(record)),
            })
          }
        >
          删除
        </Button>
      </Space>
    ),
  }

  const tableColumns = [...columns, actionColumn]

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    setDrawerOpen(true)
  }

  const openEdit = (record: T) => {
    setMode('edit')
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: Create & Update) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(toCreatePayload(values as Create))
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: getRecordId(editing),
        payload: toUpdatePayload(values as Update, editing),
      })
    }
  }

  const drawerInitial =
    mode === 'edit' && editing
      ? (getEditInitialValues?.(editing) ?? (editing as Partial<Update>))
      : undefined

  return (
    <div className="page-content">
      <PageHeader
        title={title}
        subtitle={subtitle}
        extra={
          <Button type="primary" onClick={openCreate}>
            新增
          </Button>
        }
      />

      <div className="toolbar">
        <Input.Search
          allowClear
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={(value) => {
            setKeyword(value)
            setPage(1)
          }}
          style={{ maxWidth: 320 }}
        />
      </div>

      <DataTable<T>
        rowKey={rowKey}
        loading={isLoading || isFetching}
        columns={tableColumns}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
      />

      <CrudDrawer<Create & Update>
        open={drawerOpen}
        title={mode === 'create' ? `新增${title}` : `编辑${title}`}
        mode={mode}
        loading={createMutation.isPending || updateMutation.isPending}
        initialValues={drawerInitial as Partial<Create & Update>}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      >
        {(form) => renderForm(form as FormInstance, mode, editing)}
      </CrudDrawer>
    </div>
  )
}
