import { describe, it, expect } from 'vitest'
import {
  parseApiError,
  getErrorMessage,
  getFieldErrors,
  isAuthError,
  isCsrfError,
  isValidationError,
  isRateLimitError,
  getAuthErrorMessage,
  createApiError,
  extractRetryTime,
  ERROR_CODES,
  ERROR_MESSAGES,
} from '~/utils/errors'
import type { ApiError } from '~/types'

describe('errors', () => {
  describe('parseApiError', () => {
    it('should parse standard API error format with data wrapper', () => {
      const error = {
        status: 422,
        data: {
          message: 'Validation failed',
          errors: {
            email: ['The email field is required'],
          },
        },
      }
      const result = parseApiError(error)
      expect(result.status).toBe(422)
      expect(result.message).toBe('Validation failed')
      expect(result.errors).toEqual({ email: ['The email field is required'] })
    })

    it('should parse direct error object', () => {
      const error = {
        status: 401,
        message: 'Unauthorized',
        errors: undefined,
      }
      const result = parseApiError(error)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Unauthorized')
    })

    it('should parse Error instance', () => {
      const error = new Error('Network error')
      const result = parseApiError(error)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Network error')
    })

    it('should handle null/undefined errors', () => {
      const result = parseApiError(null)
      expect(result.status).toBe(500)
      expect(result.message).toBeTruthy()
    })

    it('should handle missing status in data wrapper', () => {
      const error = {
        data: {
          message: 'Custom error',
        },
      }
      const result = parseApiError(error)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Custom error')
    })
  })

  describe('getErrorMessage', () => {
    it('should return error message from ApiError', () => {
      const error: ApiError = {
        status: 404,
        message: 'Not found',
      }
      expect(getErrorMessage(error)).toBe('Not found')
    })

    it('should fallback to status message if no message provided', () => {
      const error: ApiError = {
        status: 404,
      }
      const result = getErrorMessage(error)
      // Should return a message (either from ERROR_MESSAGES or default)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should parse unknown error format', () => {
      const error = { status: 500 }
      expect(getErrorMessage(error)).toBeTruthy()
    })
  })

  describe('getFieldErrors', () => {
    it('should extract field errors from error object', () => {
      const error: ApiError = {
        status: 422,
        errors: {
          email: ['The email field is required'],
          password: ['The password must be at least 8 characters'],
        },
      }
      const result = getFieldErrors(error)
      expect(result.email).toBe('The email field is required')
      expect(result.password).toBe('The password must be at least 8 characters')
    })

    it('should return empty object if no errors', () => {
      const error: ApiError = {
        status: 404,
      }
      expect(getFieldErrors(error)).toEqual({})
    })

    it('should take first error message from array', () => {
      const error: ApiError = {
        status: 422,
        errors: {
          email: ['First error', 'Second error'],
        },
      }
      const result = getFieldErrors(error)
      expect(result.email).toBe('First error')
    })
  })

  describe('isAuthError', () => {
    it('should return true for 401 errors', () => {
      const error: ApiError = { status: 401, message: 'Unauthorized' }
      expect(isAuthError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      const error: ApiError = { status: 404, message: 'Not found' }
      expect(isAuthError(error)).toBe(false)
    })

    it('should parse unknown error format', () => {
      expect(isAuthError({ status: 401 })).toBe(true)
      expect(isAuthError({ status: 500 })).toBe(false)
    })
  })

  describe('isCsrfError', () => {
    it('should return true for 419 errors', () => {
      const error: ApiError = { status: 419, message: 'CSRF token mismatch' }
      expect(isCsrfError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      const error: ApiError = { status: 401, message: 'Unauthorized' }
      expect(isCsrfError(error)).toBe(false)
    })
  })

  describe('isValidationError', () => {
    it('should return true for 422 errors', () => {
      const error: ApiError = { status: 422, message: 'Validation failed' }
      expect(isValidationError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      const error: ApiError = { status: 404, message: 'Not found' }
      expect(isValidationError(error)).toBe(false)
    })
  })

  describe('isRateLimitError', () => {
    it('should return true for 429 errors', () => {
      const error: ApiError = { status: 429, message: 'Too many requests' }
      expect(isRateLimitError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      const error: ApiError = { status: 404, message: 'Not found' }
      expect(isRateLimitError(error)).toBe(false)
    })
  })

  describe('getAuthErrorMessage', () => {
    it('should return endpoint-specific message for 422 errors', () => {
      const error: ApiError = { status: 422, message: ERROR_MESSAGES[422] }
      const result = getAuthErrorMessage('login', error)
      // Should use endpoint-specific message when backend message is generic
      expect(result).toBe('The provided credentials are incorrect.')
    })

    it('should return endpoint-specific message for 429 errors with retry time', () => {
      const error: ApiError = { status: 429, retry_after: 60 }
      const result = getAuthErrorMessage('login', error)
      expect(result).toContain('60')
    })

    it('should use backend message if specific', () => {
      const error: ApiError = { status: 422, message: 'Email already exists' }
      const result = getAuthErrorMessage('register', error)
      expect(result).toBe('Email already exists')
    })

    it('should fallback to generic message for unknown status', () => {
      const error: ApiError = { status: 500, message: 'Server error' }
      const result = getAuthErrorMessage('login', error)
      expect(result).toBe('Server error')
    })
  })

  describe('createApiError', () => {
    it('should create ApiError with provided values', () => {
      const error = createApiError(422, 'Custom message', { email: ['Required'] })
      expect(error.status).toBe(422)
      expect(error.message).toBe('Custom message')
      expect(error.errors).toEqual({ email: ['Required'] })
    })

    it('should use default message if not provided', () => {
      const error = createApiError(404)
      expect(error.status).toBe(404)
      expect(error.message).toBe(ERROR_MESSAGES[404])
    })
  })

  describe('extractRetryTime', () => {
    it('should extract retry_after from error', () => {
      const error: ApiError & { retry_after?: number } = {
        status: 429,
        retry_after: 120,
      }
      expect(extractRetryTime(error)).toBe(120)
    })

    it('should extract time from message', () => {
      const error: ApiError = {
        status: 429,
        message: 'Please try again in 60 seconds',
      }
      expect(extractRetryTime(error)).toBe(60)
    })

    it('should return null if no retry time found', () => {
      const error: ApiError = {
        status: 429,
        message: 'Too many requests',
      }
      expect(extractRetryTime(error)).toBeNull()
    })
  })
})
