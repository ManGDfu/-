import { apiClient } from './client'
import type { ListParams, PaginatedResponse } from '../types/common'
import type {
  Ingredient,
  IngredientCreate,
  IngredientUpdate,
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
} from '../types/purchase'

export async function listSuppliers(
  params: ListParams,
): Promise<PaginatedResponse<Supplier>> {
  const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params })
  return data
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>('/suppliers', payload)
  return data
}

export async function updateSupplier(
  supplierId: string,
  payload: SupplierUpdate,
): Promise<Supplier> {
  const { data } = await apiClient.put<Supplier>(`/suppliers/${supplierId}`, payload)
  return data
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  await apiClient.delete(`/suppliers/${supplierId}`)
}

export async function listIngredients(
  params: ListParams,
): Promise<PaginatedResponse<Ingredient>> {
  const { data } = await apiClient.get<PaginatedResponse<Ingredient>>('/ingredients', { params })
  return data
}

export async function createIngredient(payload: IngredientCreate): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>('/ingredients', payload)
  return data
}

export async function updateIngredient(
  ingredientId: string,
  payload: IngredientUpdate,
): Promise<Ingredient> {
  const { data } = await apiClient.put<Ingredient>(`/ingredients/${ingredientId}`, payload)
  return data
}

export async function deleteIngredient(ingredientId: string): Promise<void> {
  await apiClient.delete(`/ingredients/${ingredientId}`)
}

export async function listPurchaseOrders(
  params: ListParams,
): Promise<PaginatedResponse<PurchaseOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', {
    params,
  })
  return data
}

export async function getPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}`)
  return data
}

export async function createPurchaseOrder(payload: PurchaseOrderCreate): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>('/purchase-orders', payload)
  return data
}

export async function updatePurchaseOrder(
  purchaseOrderId: string,
  payload: PurchaseOrderUpdate,
): Promise<PurchaseOrder> {
  const { data } = await apiClient.put<PurchaseOrder>(
    `/purchase-orders/${purchaseOrderId}`,
    payload,
  )
  return data
}

export async function deletePurchaseOrder(purchaseOrderId: string): Promise<void> {
  await apiClient.delete(`/purchase-orders/${purchaseOrderId}`)
}

export async function approvePurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${purchaseOrderId}/approve`,
  )
  return data
}

export async function completePurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${purchaseOrderId}/complete`,
  )
  return data
}

export async function cancelPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(
    `/purchase-orders/${purchaseOrderId}/cancel`,
  )
  return data
}
