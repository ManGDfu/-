export interface Supplier {
  supplier_id: string
  supplier_name: string
  contact_person: string
  contact_phone: string
  address: string
}

export interface SupplierCreate {
  supplier_name: string
  contact_person: string
  contact_phone: string
  address: string
}

export type SupplierUpdate = Partial<SupplierCreate>

export interface Ingredient {
  ingredient_id: string
  ingredient_name: string
  unit: string
  category: string
  shelf_life_days: number
}

export interface IngredientCreate {
  ingredient_name: string
  unit: string
  category: string
  shelf_life_days: number
}

export type IngredientUpdate = Partial<IngredientCreate>

export interface PurchaseDetail {
  purchase_detail_id?: string
  purchase_order_id?: string
  ingredient_id: string
  purchase_qty: number | string
  purchase_unit_price: number | string
}

export interface PurchaseOrder {
  purchase_order_id: string
  supplier_id: string
  order_date: string
  order_total_amount: number | string
  order_status: string
  details: PurchaseDetail[]
}

export interface PurchaseDetailCreate {
  ingredient_id: string
  purchase_qty: number
  purchase_unit_price: number
}

export interface PurchaseOrderCreate {
  supplier_id: string
  order_date: string
  order_status?: string
  details: PurchaseDetailCreate[]
}

export interface PurchaseOrderUpdate {
  supplier_id?: string
  order_date?: string
  details?: PurchaseDetailCreate[]
}
