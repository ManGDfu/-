import { apiClient } from './client'
import type { ListParams, PaginatedResponse } from '../types/common'
import type {
  SalesOrder,
  SalesOrderCreate,
  SalesOrderUpdate,
  Store,
  StoreCreate,
  StoreUpdate,
} from '../types/sales'

export async function listStores(params: ListParams): Promise<PaginatedResponse<Store>> {
  const { data } = await apiClient.get<PaginatedResponse<Store>>('/stores', { params })
  return data
}

export async function createStore(payload: StoreCreate): Promise<Store> {
  const { data } = await apiClient.post<Store>('/stores', payload)
  return data
}

export async function updateStore(storeId: string, payload: StoreUpdate): Promise<Store> {
  const { data } = await apiClient.put<Store>(`/stores/${storeId}`, payload)
  return data
}

export async function deleteStore(storeId: string): Promise<void> {
  await apiClient.delete(`/stores/${storeId}`)
}

export async function listSalesOrders(params: ListParams): Promise<PaginatedResponse<SalesOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<SalesOrder>>('/sales-orders', { params })
  return data
}

export async function createSalesOrder(payload: SalesOrderCreate): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>('/sales-orders', payload)
  return data
}

export async function updateSalesOrder(
  salesOrderId: string,
  payload: SalesOrderUpdate,
): Promise<SalesOrder> {
  const { data } = await apiClient.put<SalesOrder>(`/sales-orders/${salesOrderId}`, payload)
  return data
}

export async function deleteSalesOrder(salesOrderId: string): Promise<void> {
  await apiClient.delete(`/sales-orders/${salesOrderId}`)
}

export async function paySalesOrder(salesOrderId: string): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`/sales-orders/${salesOrderId}/pay`)
  return data
}

export async function shipSalesOrder(salesOrderId: string): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`/sales-orders/${salesOrderId}/ship`)
  return data
}

export async function completeSalesOrder(salesOrderId: string): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`/sales-orders/${salesOrderId}/complete`)
  return data
}

export async function cancelSalesOrder(salesOrderId: string): Promise<SalesOrder> {
  const { data } = await apiClient.post<SalesOrder>(`/sales-orders/${salesOrderId}/cancel`)
  return data
}
