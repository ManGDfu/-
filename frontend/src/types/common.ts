export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ListParams {
  page?: number
  page_size?: number
  keyword?: string
  [key: string]: string | number | boolean | undefined
}
