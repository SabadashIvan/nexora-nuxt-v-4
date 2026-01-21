/**
 * Support Store
 * Handles customer support request submissions
 * API: /api/v1/customer-support/*
 * Public endpoint (no authentication required)
 */

import { defineStore } from 'pinia'
import type {
  SupportState,
  SupportRequestPayload,
  SupportRequestResponse,
  SupportRequestTypeOption,
} from '~/types'
import { getErrorMessage, getFieldErrors, isRateLimitError, extractRetryTime, parseApiError } from '~/utils/errors'

export const useSupportStore = defineStore('support', {
  state: (): SupportState => ({
    loading: false,
    error: null,
    message: null,
    success: false,
    retryAfter: null,
    fieldErrors: {},
    requestTypes: [],
    requestTypesLoading: false,
  }),

  getters: {
    /**
     * Check if there was an error
     */
    hasError: (state): boolean => {
      return state.error !== null
    },

    /**
     * Check if submission was successful
     */
    isSuccess: (state): boolean => {
      return state.success
    },

    /**
     * Check if rate limited
     */
    isRateLimited: (state): boolean => {
      return state.retryAfter !== null && state.retryAfter > 0
    },

    /**
     * Check if request types are available
     */
    hasRequestTypes: (state): boolean => {
      return state.requestTypes.length > 0
    },
  },

  actions: {
    /**
     * Clear state
     */
    clearState(): void {
      this.error = null
      this.message = null
      this.fieldErrors = {}
      this.retryAfter = null
    },

    /**
     * Fetch support request types
     * GET /api/v1/customer-support/requests/types
     */
    async fetchRequestTypes(): Promise<void> {
      const api = useApi()
      this.requestTypesLoading = true

      try {
        const response = await api.get<SupportRequestTypeOption[] | { data: SupportRequestTypeOption[] }>(
          '/customer-support/requests/types'
        )
        // Handle both wrapped and unwrapped response
        this.requestTypes = Array.isArray(response) ? response : (response?.data ?? [])
      } catch (error) {
        console.error('Fetch request types error:', error)
        // Don't set error - request types are optional, form can still work with fallback
        this.requestTypes = []
      } finally {
        this.requestTypesLoading = false
      }
    },

    /**
     * Submit support request
     * POST /api/v1/customer-support/requests
     * Uses server route proxy to add IP address and user agent
     */
    async submitRequest(payload: SupportRequestPayload): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()
      this.success = false

      try {
        // Use server route proxy which adds IP address and user agent from headers
        // Server route is at /api/v1/customer-support/requests
        // The server route will extract IP and user agent from headers and proxy to backend
        await api.post<SupportRequestResponse>('/customer-support/requests', payload)
        
        this.success = true
        this.message = 'Your support request has been submitted successfully. We will get back to you soon.'
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        
        // Handle rate limiting (429)
        if (isRateLimitError(apiError)) {
          const retryTime = extractRetryTime(apiError)
          this.retryAfter = retryTime
          this.error = apiError.message || 'Too many support request attempts. Please try again later.'
          this.success = false
          return false
        }

        // Handle validation errors (422)
        if (apiError.status === 422) {
          this.fieldErrors = getFieldErrors(apiError)
          this.error = apiError.message || 'Please check your input and try again.'
          this.success = false
          return false
        }

        // Handle other errors
        this.error = getErrorMessage(error)
        this.success = false
        console.error('Support request error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.loading = false
      this.error = null
      this.message = null
      this.success = false
      this.retryAfter = null
      this.fieldErrors = {}
      this.requestTypes = []
      this.requestTypesLoading = false
    },
  },
})

