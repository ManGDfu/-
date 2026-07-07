import axios, { type AxiosError } from 'axios'
import { message } from 'antd'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})

function extractErrorMessage(error: AxiosError<{ detail?: unknown }>): string {
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg)
        }
        return JSON.stringify(item)
      })
      .join('; ')
  }
  return error.message || '请求失败'
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    if (!axios.isCancel(error)) {
      message.error(extractErrorMessage(error))
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('userId')
    }
    return Promise.reject(error)
  },
)

export interface HealthResponse {
  status: string
}

export interface DbHealthResponse {
  status: string
  database: string
  detail?: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health')
  return data
}

export async function fetchDbHealth(): Promise<DbHealthResponse> {
  const { data } = await apiClient.get<DbHealthResponse>('/health/db')
  return data
}
