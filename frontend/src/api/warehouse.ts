import { apiClient } from './client'
import type { ListParams, PaginatedResponse } from '../types/common'
import type {
  Inventory,
  InventoryCreate,
  InventoryUpdate,
  TransferOrder,
  TransferOrderCreate,
  TransferOrderUpdate,
  Warehouse,
  WarehouseCreate,
  WarehouseUpdate,
} from '../types/warehouse'

export async function listWarehouses(params: ListParams): Promise<PaginatedResponse<Warehouse>> {
  const { data } = await apiClient.get<PaginatedResponse<Warehouse>>('/warehouses', { params })
  return data
}

export async function createWarehouse(payload: WarehouseCreate): Promise<Warehouse> {
  const { data } = await apiClient.post<Warehouse>('/warehouses', payload)
  return data
}

export async function updateWarehouse(
  warehouseId: string,
  payload: WarehouseUpdate,
): Promise<Warehouse> {
  const { data } = await apiClient.put<Warehouse>(`/warehouses/${warehouseId}`, payload)
  return data
}

export async function deleteWarehouse(warehouseId: string): Promise<void> {
  await apiClient.delete(`/warehouses/${warehouseId}`)
}

export async function listInventory(params: ListParams): Promise<PaginatedResponse<Inventory>> {
  const { data } = await apiClient.get<PaginatedResponse<Inventory>>('/inventory', { params })
  return data
}

export async function createInventory(payload: InventoryCreate): Promise<Inventory> {
  const { data } = await apiClient.post<Inventory>('/inventory', payload)
  return data
}

export async function updateInventory(
  inventoryId: string,
  payload: InventoryUpdate,
): Promise<Inventory> {
  const { data } = await apiClient.put<Inventory>(`/inventory/${inventoryId}`, payload)
  return data
}

export async function deleteInventory(inventoryId: string): Promise<void> {
  await apiClient.delete(`/inventory/${inventoryId}`)
}

export async function listTransferOrders(
  params: ListParams,
): Promise<PaginatedResponse<TransferOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<TransferOrder>>('/transfer-orders', {
    params,
  })
  return data
}

export async function createTransferOrder(payload: TransferOrderCreate): Promise<TransferOrder> {
  const { data } = await apiClient.post<TransferOrder>('/transfer-orders', payload)
  return data
}

export async function updateTransferOrder(
  transferOrderId: string,
  payload: TransferOrderUpdate,
): Promise<TransferOrder> {
  const { data } = await apiClient.put<TransferOrder>(
    `/transfer-orders/${transferOrderId}`,
    payload,
  )
  return data
}

export async function deleteTransferOrder(transferOrderId: string): Promise<void> {
  await apiClient.delete(`/transfer-orders/${transferOrderId}`)
}
