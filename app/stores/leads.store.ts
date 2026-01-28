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
     * Uses server route proxy to add IP address and user agent from request headers
     * Uses useApi() which should route through Nuxt server routes when they exist
     */
    async createLead(payload: Omit<CreateLeadPayload, 'ip_address' | 'user_agent'>): Promise<boolean> {
      this.loading = true
      this.clearState()
      this.success = false

      // Helper to get cookie value (client-side only)
      function getCookieValue(key: string): string | null {
        if (import.meta.server) return null
        try {
          const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
          return match && match[1] ? decodeURIComponent(match[1]) : null
        } catch {
          return null
        }
      }

      try {
        // Get client info (user_agent)
        const clientInfo = getClientInfo()

        // Build payload with client metadata
        // Note: ip_address will be extracted server-side from request headers by the server route proxy
        // Server route is at /api/v1/leads and will extract IP and user agent from headers
        const fullPayload: Omit<CreateLeadPayload, 'ip_address'> = {
          ...payload,
          user_agent: clientInfo.user_agent,
        }

        // Use $fetch directly with current origin to ensure it goes through Nuxt server routes
        // The server route will add ip_address and proxy to backend
        // We need to call Nuxt's server (not backend directly) so server routes can intercept
        if (import.meta.dev) {
          console.log('[Leads Store] Sending request to Nuxt server route /api/v1/leads with payload:', fullPayload)
        }
        
        // Get current origin (Nuxt server) to ensure request goes through server routes
        const nuxtOrigin = import.meta.client ? window.location.origin : ''
        
        await $fetch<LeadApiResponse>('/api/v1/leads', {
          method: 'POST',
          body: fullPayload,
          baseURL: nuxtOrigin || undefined, // Use Nuxt server origin, not backend
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': getCookieValue('locale') || 'en',
            'Accept-Currency': getCookieValue('currency') || 'USD',
          },
          credentials: 'include',
        })

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
