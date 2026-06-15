/**
 * RAM API v2 — shared envelope types
 * Generated from docs/api-v2-openapi.yaml
 */

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PageRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface ApiError {
  status: number
  detail: string
  path?: string
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'detail' in err
  )
}

export type SortDirection = 'asc' | 'desc'
