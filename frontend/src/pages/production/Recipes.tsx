import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
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
import { useMemo, useState } from 'react'
import { listIngredients } from '../../api/purchase'
import {
  createRecipe,
  deleteRecipe,
  listProducts,
  listRecipes,
  updateRecipe,
} from '../../api/production'
import { confirmDelete } from '../../components/common/ConfirmDelete'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import type {
  Recipe,
  RecipeCreate,
  RecipeIngredientCreate,
  RecipeUpdate,
} from '../../types/production'

interface RecipeFormValues {
  product_id: string
  recipe_name: string
  recipe_version: string
  ingredients: RecipeIngredientCreate[]
}

export default function Recipes() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<RecipeFormValues>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Recipe | undefined>()

  const listParams = useMemo(
    () => ({ page, page_size: pageSize, keyword }),
    [page, pageSize, keyword],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['recipes', listParams],
    queryFn: () => listRecipes(listParams),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => listProducts({ page: 1, page_size: 100 }),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', 'all'],
    queryFn: () => listIngredients({ page: 1, page_size: 100 }),
  })

  const productOptions =
    productsData?.items.map((p) => ({
      value: p.product_id,
      label: `${p.product_name} (${p.product_id})`,
    })) ?? []

  const ingredientOptions =
    ingredientsData?.items.map((i) => ({
      value: i.ingredient_id,
      label: `${i.ingredient_name} (${i.ingredient_id})`,
    })) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recipes'] })

  const createMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecipeUpdate }) => updateRecipe(id, payload),
    onSuccess: () => {
      invalidate()
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({ mutationFn: deleteRecipe, onSuccess: invalidate })

  const openCreate = () => {
    setMode('create')
    setEditing(undefined)
    form.resetFields()
    form.setFieldsValue({ ingredients: [{} as RecipeIngredientCreate] })
    setDrawerOpen(true)
  }

  const openEdit = (record: Recipe) => {
    setMode('edit')
    setEditing(record)
    form.setFieldsValue({
      product_id: record.product_id,
      recipe_name: record.recipe_name,
      recipe_version: record.recipe_version,
      ingredients: record.ingredients.map((i) => ({
        ingredient_id: i.ingredient_id,
        ingredient_qty: Number(i.ingredient_qty),
      })),
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: RecipeFormValues) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(values as RecipeCreate)
    } else if (editing) {
      await updateMutation.mutateAsync({
        id: editing.recipe_id,
        payload: values as RecipeUpdate,
      })
    }
  }

  const columns: ColumnsType<Recipe> = [
    { title: '配方ID', dataIndex: 'recipe_id', width: 100 },
    { title: '产品', dataIndex: 'product_id', width: 100 },
    { title: '配方名称', dataIndex: 'recipe_name' },
    { title: '版本', dataIndex: 'recipe_version', width: 100 },
    { title: '原料数', width: 80, render: (_, r) => r.ingredients?.length ?? 0 },
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
                onOk: () => deleteMutation.mutateAsync(record.recipe_id),
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
        title="配方"
        subtitle="维护产品配方版本及原料用量"
        extra={
          <Button type="primary" onClick={openCreate}>
            新增配方
          </Button>
        }
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索配方名称、版本"
          onSearch={(v) => {
            setKeyword(v)
            setPage(1)
          }}
          style={{ maxWidth: 280 }}
        />
      </div>

      <DataTable<Recipe>
        rowKey="recipe_id"
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
        title={mode === 'create' ? '新增配方' : '编辑配方'}
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
            name="product_id"
            label="产品"
            rules={[{ required: true, message: '请选择产品' }]}
          >
            <Select options={productOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="recipe_name"
            label="配方名称"
            rules={[{ required: true, message: '请输入配方名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="recipe_version"
            label="版本"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如 v1.0" />
          </Form.Item>

          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>配方原料</div>
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
                      title: '用量',
                      width: 140,
                      render: (_, field) => (
                        <Form.Item
                          {...field}
                          name={[field.name, 'ingredient_qty']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.001} style={{ width: '100%' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '',
                      width: 40,
                      render: (_, field) => (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      ),
                    },
                  ]}
                />
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  添加原料
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </div>
  )
}
