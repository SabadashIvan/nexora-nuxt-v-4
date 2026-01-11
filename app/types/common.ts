/**
 * Common types used across the application
 */

import { LoadingState, AsyncStatus } from './enums'

// API Error response structure
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

// Pagination state for stores
export interface Pagination {
  page: number
  perPage: number
  total: number
  lastPage: number
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Image value as returned by backend
export type ImageValue = string | { url?: string | null } | null | undefined

// Re-export enums for convenience
export { LoadingState, AsyncStatus }

