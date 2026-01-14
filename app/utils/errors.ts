/**
 * Centralized error handling utilities
 */

import type { ApiError } from '~/types'

// Error codes mapping
export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CSRF_MISMATCH: 419,
  VALIDATION_ERROR: 422,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
} as const

// Custom error messages
export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'You are not authenticated. Please log in.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  409: 'The request could not be completed due to a conflict.',
  419: 'Session expired. Please try again.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please try again later.',
  500: 'An unexpected error occurred. Please try again later.',
}

// Auth endpoint types for specific error messages
export type AuthEndpoint = 'login' | 'register' | 'forgot-password' | 'reset-password'

// Auth-specific error messages by endpoint and status code
export const AUTH_ERROR_MESSAGES: Record<AuthEndpoint, Record<number, string>> = {
  'login': {
    422: 'The provided credentials are incorrect.',
    429: 'Too many login attempts. Please try again in {time} seconds.',
  },
  'register': {
    422: 'Registration failed. Please check your input.',
    429: 'Too many registration attempts. Please try again in {time} seconds.',
  },
  'forgot-password': {
    422: 'The provided email is invalid.',
    429: 'Too many password reset requests. Please try again in {time} seconds.',
  },
  'reset-password': {
    422: 'The reset token is invalid or expired.',
    429: 'Too many password reset attempts. Please try again in {time} seconds.',
  },
}

// Checkout-specific errors
export const CHECKOUT_ERRORS = {
  CART_CHANGED: 'CART_CHANGED',
  INVALID_SHIPPING: 'INVALID_SHIPPING',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const

class ApiBaseError extends Error implements ApiError {
  status: number
  errors?: Record<string, string[]>
  data?: unknown

  constructor(message: string, status: number, errors?: Record<string, string[]>, data?: unknown) {
    super(message)
    this.status = status
    this.errors = errors
    this.data = data
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ConcurrencyEvent extends ApiBaseError {
  resource: string
  version?: number

  constructor(message: string, resource = 'cart', version?: number, data?: unknown) {
    super(message, ERROR_CODES.CONFLICT, undefined, data)
    this.resource = resource
    this.version = version
  }
}

export class ValidationError extends ApiBaseError {
  constructor(message: string, errors: Record<string, string[]>, data?: unknown) {
    super(message, ERROR_CODES.VALIDATION_ERROR, errors, data)
  }
}

export class SessionError extends ApiBaseError {
  code: 'csrf' | 'unauthorized' | 'expired'

  constructor(message: string, code: 'csrf' | 'unauthorized' | 'expired', status: number, data?: unknown) {
    super(message, status, undefined, data)
    this.code = code
  }
}

export class UnknownApiError extends ApiBaseError {
  statusCode: number

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message, statusCode, undefined, data)
    this.statusCode = statusCode
  }
}

function normalizeMessage(message: string | undefined, status: number): string {
  return message || ERROR_MESSAGES[status] || ERROR_MESSAGES[500] || 'An unexpected error occurred.'
}

/**
 * Parse API error response into a structured format
 */
export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiBaseError) {
    return error
  }

  const err = error as Record<string, unknown> | undefined
  const response = err?.response as Record<string, unknown> | undefined
  const status = (err?.status as number | undefined)
    ?? (response?.status as number | undefined)
    ?? ERROR_CODES.SERVER_ERROR
  const data = (err?.data as Record<string, unknown> | undefined)
    ?? (response?._data as Record<string, unknown> | undefined)
  const message = normalizeMessage(
    (data?.message as string | undefined)
    ?? (data?.error as string | undefined)
    ?? (data?.detail as string | undefined)
    ?? (response?.statusText as string | undefined)
    ?? (err?.message as string | undefined),
    status
  )

  if (status === ERROR_CODES.CONFLICT) {
    const version = data?.version
    return new ConcurrencyEvent(message, 'cart', typeof version === 'number' ? version : undefined, data)
  }

  if (status === ERROR_CODES.VALIDATION_ERROR) {
    const errors = (data?.errors as Record<string, string[]> | undefined) ?? {}
    return new ValidationError(message, errors, data)
  }

  if (status === ERROR_CODES.UNAUTHORIZED) {
    return new SessionError(message, 'unauthorized', status, data)
  }

  if (status === ERROR_CODES.CSRF_MISMATCH) {
    return new SessionError(message, 'csrf', status, data)
  }

  return new UnknownApiError(message, status, data)
}

export function isConcurrencyEvent(error: unknown): error is ConcurrencyEvent {
  return error instanceof ConcurrencyEvent
}

export function isValidationError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error
    ? error as ApiError
    : parseApiError(error)
  return parsed.status === ERROR_CODES.VALIDATION_ERROR
}

export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError
}

export function isUnknownApiError(error: unknown): error is UnknownApiError {
  return error instanceof UnknownApiError
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ApiError | unknown): string {
  const parsed = error && typeof error === 'object' && 'message' in error
    ? error as ApiError
    : parseApiError(error)

  return parsed.message || ERROR_MESSAGES[parsed.status] || ERROR_MESSAGES[500] || 'An unexpected error occurred.'
}

/**
 * Get field-specific validation errors
 */
export function getFieldErrors(error: ApiError): Record<string, string> {
  if (!error.errors) return {}

  const fieldErrors: Record<string, string> = {}
  for (const [field, messages] of Object.entries(error.errors)) {
    fieldErrors[field] = messages[0] || ''
  }
  return fieldErrors
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error
    ? error as ApiError
    : parseApiError(error)
  return parsed.status === ERROR_CODES.UNAUTHORIZED
}

/**
 * Check if error is a CSRF token mismatch error (419)
 * Laravel returns 419 when XSRF token is invalid or expired
 */
export function isCsrfError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error
    ? error as ApiError
    : parseApiError(error)
  return parsed.status === ERROR_CODES.CSRF_MISMATCH
}

/**
 * Check if error is a checkout-specific error
 */
export function isCheckoutError(error: ApiError): boolean {
  const checkoutErrorMessages = Object.values(CHECKOUT_ERRORS)
  return checkoutErrorMessages.some(code =>
    error.message?.includes(code) ||
    (error.errors && Object.keys(error.errors).some(key => key.includes(code)))
  )
}

/**
 * Create a typed API error for throwing
 */
export function createApiError(status: number, message?: string, errors?: Record<string, string[]>): ApiError {
  const apiError = new UnknownApiError(
    message || ERROR_MESSAGES[status] || ERROR_MESSAGES[500] || 'An unexpected error occurred.',
    status
  )
  if (errors) {
    apiError.errors = errors
  }
  return apiError
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: ApiError | unknown): boolean {
  const parsed = error && typeof error === 'object' && 'status' in error
    ? error as ApiError
    : parseApiError(error)
  return parsed.status === ERROR_CODES.RATE_LIMIT
}

/**
 * Extract retry time (in seconds) from error response
 * Supports multiple formats:
 * - { "retry_after": 60 }
 * - { "message": "...try again in 60 seconds..." }
 * - Direct message with time pattern
 */
export function extractRetryTime(error: ApiError): number | null {
  // Check for retry_after field in error data
  const errorData = error as ApiError & { retry_after?: number }
  if (typeof errorData.retry_after === 'number') {
    return errorData.retry_after
  }

  // Try to extract time from message using regex
  // Matches patterns like "in 60 seconds", "in 120 seconds", etc.
  if (error.message) {
    const match = error.message.match(/in\s+(\d+)\s+seconds?/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }

  // Default retry time if none found
  return null
}

/**
 * Get auth-specific error message based on endpoint and status
 * Falls back to backend message if available, then to default messages
 */
export function getAuthErrorMessage(
  endpoint: AuthEndpoint,
  error: ApiError
): string {
  const status = error.status
  const defaultMessage = ERROR_MESSAGES[500] ?? 'An unexpected error occurred.'

  // For 429 errors, try to extract retry time and format message
  if (status === ERROR_CODES.RATE_LIMIT) {
    const retryTime = extractRetryTime(error)
    const template = AUTH_ERROR_MESSAGES[endpoint]?.[429] ?? ERROR_MESSAGES[429] ?? 'Too many requests.'

    if (retryTime !== null) {
      return template.replace('{time}', String(retryTime))
    }
    // If no retry time found, use backend message or remove placeholder
    if (error.message && !error.message.includes('{time}')) {
      return error.message
    }
    return template.replace(' in {time} seconds', '')
  }

  // For 422 errors, prefer backend message if it's specific (not generic)
  if (status === ERROR_CODES.VALIDATION_ERROR) {
    // If backend provides a specific message, use it
    if (error.message && error.message !== ERROR_MESSAGES[422]) {
      return error.message
    }
    // Fall back to auth-specific message
    return AUTH_ERROR_MESSAGES[endpoint]?.[422] ?? ERROR_MESSAGES[422] ?? 'Validation failed.'
  }

  // For other errors, use backend message or generic message
  return error.message || (ERROR_MESSAGES[status] ?? defaultMessage)
}
