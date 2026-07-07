import { apiClient } from './client'
import type { ListParams, PaginatedResponse } from '../types/common'
import type {
  Factory,
  FactoryCreate,
  FactoryUpdate,
  MaterialRequirement,
  Product,
  ProductCreate,
  ProductUpdate,
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  WorkOrder,
  WorkOrderCreate,
  WorkOrderUpdate,
} from '../types/production'

export async function listFactories(params: ListParams): Promise<PaginatedResponse<Factory>> {
  const { data } = await apiClient.get<PaginatedResponse<Factory>>('/factories', { params })
  return data
}

export async function createFactory(payload: FactoryCreate): Promise<Factory> {
  const { data } = await apiClient.post<Factory>('/factories', payload)
  return data
}

export async function updateFactory(factoryId: string, payload: FactoryUpdate): Promise<Factory> {
  const { data } = await apiClient.put<Factory>(`/factories/${factoryId}`, payload)
  return data
}

export async function deleteFactory(factoryId: string): Promise<void> {
  await apiClient.delete(`/factories/${factoryId}`)
}

export async function listProducts(params: ListParams): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params })
  return data
}

export async function createProduct(payload: ProductCreate): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload)
  return data
}

export async function updateProduct(productId: string, payload: ProductUpdate): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/products/${productId}`, payload)
  return data
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete(`/products/${productId}`)
}

export async function listRecipes(params: ListParams): Promise<PaginatedResponse<Recipe>> {
  const { data } = await apiClient.get<PaginatedResponse<Recipe>>('/recipes', { params })
  return data
}

export async function createRecipe(payload: RecipeCreate): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/recipes', payload)
  return data
}

export async function updateRecipe(recipeId: string, payload: RecipeUpdate): Promise<Recipe> {
  const { data } = await apiClient.put<Recipe>(`/recipes/${recipeId}`, payload)
  return data
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await apiClient.delete(`/recipes/${recipeId}`)
}

export async function listWorkOrders(params: ListParams): Promise<PaginatedResponse<WorkOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<WorkOrder>>('/work-orders', { params })
  return data
}

export async function createWorkOrder(payload: WorkOrderCreate): Promise<WorkOrder> {
  const { data } = await apiClient.post<WorkOrder>('/work-orders', payload)
  return data
}

export async function updateWorkOrder(
  workOrderId: string,
  payload: WorkOrderUpdate,
): Promise<WorkOrder> {
  const { data } = await apiClient.put<WorkOrder>(`/work-orders/${workOrderId}`, payload)
  return data
}

export async function deleteWorkOrder(workOrderId: string): Promise<void> {
  await apiClient.delete(`/work-orders/${workOrderId}`)
}

export async function getMaterialRequirement(workOrderId: string): Promise<MaterialRequirement> {
  const { data } = await apiClient.get<MaterialRequirement>(
    `/work-orders/${workOrderId}/material-requirement`,
  )
  return data
}
