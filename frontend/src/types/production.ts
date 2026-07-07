export interface Factory {
  factory_id: string
  factory_name: string
  factory_location: string
  manager_name: string
  contact_phone: string
}

export interface FactoryCreate {
  factory_name: string
  factory_location: string
  manager_name: string
  contact_phone: string
}

export type FactoryUpdate = Partial<FactoryCreate>

export interface Product {
  product_id: string
  product_name: string
  product_category: string
  sales_price: number | string
  shelf_life_days: number
}

export interface ProductCreate {
  product_name: string
  product_category: string
  sales_price: number
  shelf_life_days: number
}

export type ProductUpdate = Partial<ProductCreate>

export interface RecipeIngredient {
  ingredient_id: string
  ingredient_qty: number | string
  recipe_id?: string
}

export interface Recipe {
  recipe_id: string
  product_id: string
  recipe_name: string
  recipe_version: string
  ingredients: RecipeIngredient[]
}

export interface RecipeIngredientCreate {
  ingredient_id: string
  ingredient_qty: number
}

export interface RecipeCreate {
  product_id: string
  recipe_name: string
  recipe_version: string
  ingredients?: RecipeIngredientCreate[]
}

export interface RecipeUpdate {
  product_id?: string
  recipe_name?: string
  recipe_version?: string
  ingredients?: RecipeIngredientCreate[]
}

export interface WorkOrder {
  work_order_id: string
  factory_id: string
  product_id: string
  recipe_id: string
  production_date: string
  production_qty: number | string
}

export interface WorkOrderCreate {
  factory_id: string
  product_id: string
  recipe_id: string
  production_date: string
  production_qty: number
}

export type WorkOrderUpdate = Partial<WorkOrderCreate>

export interface MaterialRequirementItem {
  ingredient_id: string
  ingredient_name?: string | null
  unit?: string | null
  required_qty: number | string
}

export interface MaterialRequirement {
  work_order_id: string
  production_qty: number | string
  items: MaterialRequirementItem[]
}
