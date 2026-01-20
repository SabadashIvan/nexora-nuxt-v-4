/**
 * Loyalty Store
 * Handles loyalty points balance and transaction history
 * API: /api/v1/loyalty/*
 * Requires authentication
 */

import { defineStore } from 'pinia'
import type {
  LoyaltyState,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyAccountResponse,
  LoyaltyHistoryResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

export const useLoyaltyStore = defineStore('loyalty', {
  state: (): LoyaltyState => ({
    account: null,
    transactions: [],
    loading: false,
    historyLoading: false,
    error: null,
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0,
    },
  }),

  getters: {
    /**
     * Check if user has loyalty account
     */
    hasAccount: (state): boolean => {
      return state.account !== null
    },

    /**
     * Get current balance as number (removes currency formatting)
     */
    balanceValue: (state): number => {
      if (!state.account?.balance) return 0
      // Parse currency string like "$100.00" to number
      const numStr = state.account.balance.replace(/[^0-9.-]/g, '')
      return parseFloat(numStr) || 0
    },

    /**
     * Get pending amount as number
     */
    pendingValue: (state): number => {
      if (!state.account?.pending) return 0
      const numStr = state.account.pending.replace(/[^0-9.-]/g, '')
      return parseFloat(numStr) || 0
    },

    /**
     * Check if has pending points
     */
    hasPending: (state): boolean => {
      if (!state.account?.pending) return false
      const numStr = state.account.pending.replace(/[^0-9.-]/g, '')
      return (parseFloat(numStr) || 0) > 0
    },

    /**
     * Check if has more history pages
     */
    hasMorePages: (state): boolean => {
      return state.pagination.currentPage < state.pagination.lastPage
    },

    /**
     * Get transactions expiring soon (within 30 days)
     */
    expiringTransactions: (state): LoyaltyTransaction[] => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      return state.transactions.filter((t) => {
        if (!t.expires_at || t.type !== 'Accrual') return false
        const expiresDate = new Date(t.expires_at)
        return expiresDate <= thirtyDaysFromNow && expiresDate > new Date()
      })
    },
  },

  actions: {
    /**
     * Fetch loyalty account details
     * GET /api/v1/loyalty
     */
    async fetchLoyaltyAccount(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<LoyaltyAccountResponse | LoyaltyAccount>('/loyalty')
        // Handle both wrapped and unwrapped response
        this.account = 'data' in response ? response.data : response
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch loyalty account error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch loyalty transaction history
     * GET /api/v1/loyalty/history
     */
    async fetchLoyaltyHistory(page = 1, perPage = 15): Promise<void> {
      const api = useApi()
      this.historyLoading = true

      try {
        const response = await api.get<LoyaltyHistoryResponse>('/loyalty/history', {
          page,
          per_page: perPage,
        })

        if (page === 1) {
          this.transactions = response.data
        } else {
          // Append for pagination
          this.transactions = [...this.transactions, ...response.data]
        }

        this.pagination = {
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
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
      if (!this.hasMorePages || this.historyLoading) return
      await this.fetchLoyaltyHistory(this.pagination.currentPage + 1, this.pagination.perPage)
    },

    /**
     * Refresh all data
     */
    async refresh(): Promise<void> {
      await Promise.all([
        this.fetchLoyaltyAccount(),
        this.fetchLoyaltyHistory(1),
      ])
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.account = null
      this.transactions = []
      this.loading = false
      this.historyLoading = false
      this.error = null
      this.pagination = {
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0,
      }
    },
  },
})
