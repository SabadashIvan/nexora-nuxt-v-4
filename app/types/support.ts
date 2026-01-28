/**
 * Customer Support domain types
 * API: /api/v1/customer-support/*
 */

import type { SupportRequestType } from './enums'

/**
 * Payload for submitting a support request
 * POST /api/v1/customer-support/requests
 */
export interface SupportRequestPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  type?: SupportRequestType | string // Allow string for backward compatibility
  ip_address: string
  user_agent: string
  source?: string
}

/**
 * Support request metadata (auto-populated by backend)
 */
export interface SupportRequestMetadata {
  ip_address: string
  user_agent: string
  source: string
  referer: string
}

/**
 * Support request data structure
 */
export interface SupportRequestData {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  type: SupportRequestType | string // Allow string for backward compatibility
  status: string
  metadata: SupportRequestMetadata
  created_at: string
}

/**
 * Response for support request submission
 * POST /api/v1/customer-support/requests
 */
export interface SupportRequestResponse {
  data: SupportRequestData
}

/**
 * Support request type option from API
 * GET /api/v1/customer-support/requests/types
 */
export interface SupportRequestTypeOption {
  id: number
  title: string
}

/**
 * Support store state
 */
export interface SupportState {
  loading: boolean
  error: string | null
  message: string | null
  success: boolean
  retryAfter: number | null
  fieldErrors: Record<string, string>
  requestTypes: SupportRequestTypeOption[]
  requestTypesLoading: boolean
}
