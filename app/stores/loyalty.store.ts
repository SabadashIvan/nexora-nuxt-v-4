/**
 * Loyalty Points Store
 * Handles loyalty points summary and history
 * CSR-only - requires authentication
 * 
 * Note: API endpoints may not exist yet - placeholder implementation
 */

import { defineStore } from 'pinia'
import { getErrorMessage } from '~/utils/errors'

export interface LoyaltyPointsSummary {
  available: number
  pending: number
  total_earned: number
  total_spent: number
}

export interface LoyaltyPointsTransaction {
  id: number
  type: 'earned' | 'spent' | 'expired'
  amount: number
  description: string
  order_id?: number
  created_at: string
}

export interface LoyaltyPointsHistoryResponse {
  data: LoyaltyPointsTransaction[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface LoyaltyState {
  summary: LoyaltyPointsSummary | null
  history: LoyaltyPointsTransaction[]
  loading: boolean
  historyLoading: boolean
  error: string | null
  pagination: {
    page: number
    perPage: number
    total: number
    lastPage: number
  }
}

export const useLoyaltyStore = defineStore('loyalty', {
  state: (): LoyaltyState => ({
    summary: null,
    history: [],
    loading: false,
    historyLoading: false,
    error: null,
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
      lastPage: 1,
    },
  }),

  getters: {
    /**
     * Check if user has points
     */
    hasPoints: (state): boolean => {
      return (state.summary?.available || 0) > 0
    },

    /**
     * Get available points
     */
    availablePoints: (state): number => {
      return state.summary?.available || 0
    },
  },

  actions: {
    /**
     * Fetch loyalty points summary
     * GET /api/v1/loyalty/summary
     * Cached with short TTL to reduce repeated calls
     */
    async fetchSummary(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // TODO: Verify endpoint exists in API
        // Expected: GET /api/v1/loyalty/summary
        const summary = await api.get<LoyaltyPointsSummary>('/loyalty/summary')
        this.summary = summary
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch loyalty summary error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch loyalty points history
     * GET /api/v1/loyalty/history
     */
    async fetchHistory(page = 1): Promise<void> {
      const api = useApi()
      this.historyLoading = true
      this.error = null

      try {
        // TODO: Verify endpoint exists in API
        // Expected: GET /api/v1/loyalty/history?page=1&per_page=20
        const response = await api.get<LoyaltyPointsHistoryResponse>('/loyalty/history', {
          page,
          per_page: this.pagination.perPage,
        })

        if (page === 1) {
          this.history = response.data
        } else {
          // Append for pagination
          this.history = [...this.history, ...response.data]
        }

        this.pagination = {
          page: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch loyalty history error:', error)
      } finally {
        this.historyLoading = false
      }
    },

    /**
     * Load more history (next page)
     */
    async loadMoreHistory(): Promise<void> {
      if (this.pagination.page >= this.pagination.lastPage || this.historyLoading) {
        return
      }
      await this.fetchHistory(this.pagination.page + 1)
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.summary = null
      this.history = []
      this.loading = false
      this.historyLoading = false
      this.error = null
      this.pagination = {
        page: 1,
        perPage: 20,
        total: 0,
        lastPage: 1,
      }
    },
  },
})
