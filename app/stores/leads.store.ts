/**
 * Leads Store
 * Handles quick buy/callback request submissions
 * API: POST /api/v1/leads
 * Public endpoint (no authentication required)
 * Rate limited: 3 attempts per 60 minutes per email/IP
 */

import { defineStore } from 'pinia'
import type {
  LeadsState,
  CreateLeadPayload,
  LeadApiResponse,
} from '~/types'
import { getErrorMessage, getFieldErrors, isRateLimitError, extractRetryTime, parseApiError } from '~/utils/errors'
import { getClientInfo } from '~/utils/client-info'

export const useLeadsStore = defineStore('leads', {
  state: (): LeadsState => ({
    loading: false,
    error: null,
    success: false,
    retryAfter: null,
    fieldErrors: {},
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
  },

  actions: {
    /**
     * Clear state
     */
    clearState(): void {
      this.error = null
      this.fieldErrors = {}
      this.retryAfter = null
    },

    /**
     * Create a lead (quick buy/callback request)
     * POST /api/v1/leads
     */
    async createLead(payload: Omit<CreateLeadPayload, 'ip_address' | 'user_agent'>): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()
      this.success = false

      try {
        // Get client info (user_agent, referer)
        const clientInfo = getClientInfo()

        // Build full payload with client metadata
        // Note: ip_address will be extracted server-side from request headers
        const fullPayload: CreateLeadPayload = {
          ...payload,
          ip_address: '', // Will be set by backend from request headers
          user_agent: clientInfo.user_agent,
        }

        await api.post<LeadApiResponse>('/leads', fullPayload)

        this.success = true
        return true
      } catch (error) {
        const apiError = parseApiError(error)

        // Handle rate limiting (429)
        if (isRateLimitError(apiError)) {
          const retryTime = extractRetryTime(apiError)
          this.retryAfter = retryTime
          this.error = apiError.message || 'Too many requests. Please try again later.'
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
        console.error('Lead creation error:', error)
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
      this.success = false
      this.retryAfter = null
      this.fieldErrors = {}
    },
  },
})
