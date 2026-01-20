/**
 * Audience Store
 * Handles email marketing subscription: subscribe, confirm, unsubscribe
 * API: /api/v1/audience/*
 * Public endpoints (no authentication required)
 */

import { defineStore } from 'pinia'
import type {
  AudienceState,
  AudienceSubscribePayload,
  AudienceSubscribeResponse,
  AudienceConfirmPayload,
  AudienceConfirmResponse,
  AudienceUnsubscribePayload,
  AudienceUnsubscribeResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

export const useAudienceStore = defineStore('audience', {
  state: (): AudienceState => ({
    status: 'idle',
    loading: false,
    error: null,
    message: null,
  }),

  getters: {
    /**
     * Check if subscription is pending confirmation
     */
    isPending: (state): boolean => {
      return state.status === 'pending'
    },

    /**
     * Check if subscription is confirmed
     */
    isConfirmed: (state): boolean => {
      return state.status === 'confirmed'
    },

    /**
     * Check if there was an error
     */
    hasError: (state): boolean => {
      return state.status === 'error'
    },
  },

  actions: {
    /**
     * Clear state
     */
    clearState(): void {
      this.error = null
      this.message = null
    },

    /**
     * Subscribe to audience (newsletter)
     * POST /api/v1/audience/subscribe
     */
    async subscribe(payload: AudienceSubscribePayload): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()

      try {
        const response = await api.post<AudienceSubscribeResponse>('/audience/subscribe', payload)
        
        this.status = 'pending'
        this.message = response.message
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        this.status = 'error'
        console.error('Subscribe error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Confirm subscription with token
     * POST /api/v1/audience/confirm
     */
    async confirmSubscription(token: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()

      try {
        const payload: AudienceConfirmPayload = { token }
        const response = await api.post<AudienceConfirmResponse>('/audience/confirm', payload)
        
        this.status = 'confirmed'
        this.message = response.message
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        this.status = 'error'
        console.error('Confirm subscription error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Unsubscribe from audience (with email)
     * DELETE /api/v1/audience/unsubscribe
     */
    async unsubscribe(email: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()

      try {
        const payload: AudienceUnsubscribePayload = { email }
        // Note: DELETE with body requires special handling
        const response = await api.request<AudienceUnsubscribeResponse>('/audience/unsubscribe', {
          method: 'DELETE',
          body: payload,
        })

        this.status = 'unsubscribed'
        this.message = response.message
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        this.status = 'error'
        console.error('Unsubscribe error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Unsubscribe authenticated user from audience
     * POST /api/v1/audience/unsubscribe
     * Requires authentication - uses user's email from session
     */
    async unsubscribeFromAccount(): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.clearState()

      try {
        const response = await api.post<AudienceUnsubscribeResponse>('/audience/unsubscribe', {})

        this.status = 'unsubscribed'
        this.message = response.message
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        this.status = 'error'
        console.error('Unsubscribe from account error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.status = 'idle'
      this.loading = false
      this.error = null
      this.message = null
    },
  },
})

