import { Form, Input, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
  updateIngredient,
} from '../../api/purchase'
import CrudPage from '../../components/common/CrudPage'
import type { Ingredient, IngredientCreate, IngredientUpdate } from '../../types/purchase'

const ingredientApi = {
  list: listIngredients,
  create: createIngredient,
  update: updateIngredient,
  delete: deleteIngredient,
}

export default function Ingredients() {
  const columns: ColumnsType<Ingredient> = [
    { title: '原料ID', dataIndex: 'ingredient_id', width: 110 },
    { title: '名称', dataIndex: 'ingredient_name' },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '类别', dataIndex: 'category', width: 100 },
    { title: '保质期(天)', dataIndex: 'shelf_life_days', width: 110 },
  ]

  const renderForm = (_form: FormInstance, _mode: 'create' | 'edit') => (
    <>
      <Form.Item
        name="ingredient_name"
        label="原料名称"
        rules={[{ required: true, message: '请输入原料名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="unit"
        label="单位"
        rules={[{ required: true, message: '请输入单位' }]}
      >
        <Input placeholder="如 kg、L、袋" />
      </Form.Item>
      <Form.Item
        name="category"
        label="类别"
        rules={[{ required: true, message: '请输入类别' }]}
      >
        <Input placeholder="如 肉类、蔬菜、调料" />
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
    <CrudPage<Ingredient, IngredientCreate, IngredientUpdate>
      title="原料"
      subtitle="维护原料主数据"
      rowKey="ingredient_id"
      queryKey="ingredients"
      api={ingredientApi}
      columns={columns}
      searchPlaceholder="搜索名称、类别"
      getRecordId={(r) => r.ingredient_id}
      getEditInitialValues={(r) => ({
        ingredient_name: r.ingredient_name,
        unit: r.unit,
        category: r.category,
        shelf_life_days: r.shelf_life_days,
      })}
      toCreatePayload={(v) => v}
      toUpdatePayload={(v) => v}
      renderForm={renderForm}
    />
  )
}
