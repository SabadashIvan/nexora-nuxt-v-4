/**
 * Comparison Store
 * Handles product comparison table using X-Comparison-Token
 * CSR-only
 */

import { defineStore } from 'pinia'
import type { ComparisonResponse, ProductVariant } from '~/types'
import { getErrorMessage } from '~/utils/errors'
import { ensureComparisonToken, setToken, TOKEN_KEYS } from '~/utils/tokens'

interface ComparisonState {
  items: ProductVariant[]
  comparisonToken: string | null
  maxItems: number
  loading: boolean
  error: string | null
}

export const useComparisonStore = defineStore('comparison', {
  state: (): ComparisonState => ({
    items: [],
    comparisonToken: null,
    maxItems: 10, // Default, will be updated from API response
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Number of items in comparison
     */
    count: (state): number => {
      return state.items.length
    },

    /**
     * Check if a variant is in comparison
     */
    isInComparison: (state) => (variantId: number): boolean => {
      return state.items.some(item => item.id === variantId)
    },

    /**
     * Check if comparison is empty
     */
    isEmpty: (state): boolean => {
      return state.items.length === 0
    },

    /**
     * Check if comparison is full
     */
    isFull: (state): boolean => {
      return state.items.length >= state.maxItems
    },

    /**
     * Get comparison item IDs
     */
    itemIds: (state): number[] => {
      return state.items.map(item => item.id)
    },

    /**
     * Get all unique attributes across comparison items
     */
    comparisonAttributes: (state): string[] => {
      const attributeCodes = new Set<string>()
      state.items.forEach(item => {
        item.attributes?.forEach(attr => {
          attributeCodes.add(attr.code)
        })
      })
      return Array.from(attributeCodes)
    },
  },

  actions: {
    /**
     * Initialize comparison token
     */
    initializeToken(): string {
      if (!this.comparisonToken) {
        this.comparisonToken = ensureComparisonToken()
      }
      return this.comparisonToken
    },

    /**
     * Update store state from API response
     */
    updateFromResponse(response: ComparisonResponse): void {
      // Update items from response
      this.items = response.data.variants

      // Update token if provided
      if (response.data.token) {
        this.comparisonToken = response.data.token
        setToken(TOKEN_KEYS.COMPARISON, response.data.token)
      }

      // Update maxItems from meta
      if (response.data.meta?.max_items) {
        this.maxItems = response.data.meta.max_items
      }
    },

    /**
     * Fetch comparison from API
     */
    async fetchComparison(): Promise<void> {
      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<ComparisonResponse>('/catalog/comparison', undefined, { comparison: true })
        this.updateFromResponse(response)
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch comparison error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Add item to comparison
     */
    async addToComparison(variantId: number): Promise<boolean> {
      // Check if already at max
      if (this.isFull) {
        this.error = `You can compare up to ${this.maxItems} items`
        return false
      }

      // Check if already in comparison
      if (this.isInComparison(variantId)) {
        return true
      }

      const api = useApi()
      this.initializeToken()
      this.loading = true
      this.error = null

      try {
        const response = await api.post<ComparisonResponse>('/catalog/comparison/items', { variant_id: variantId }, { comparison: true })
        this.updateFromResponse(response)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to comparison error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove item from comparison
     */
    async removeFromComparison(variantId: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.delete<ComparisonResponse>(`/catalog/comparison/items/${variantId}`, { comparison: true })
        this.updateFromResponse(response)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove from comparison error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all comparison items
     */
    async clearComparison(): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.delete('/catalog/comparison', { comparison: true })
        this.items = []
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Clear comparison error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle comparison status
     */
    async toggleComparison(variantId: number): Promise<boolean> {
      if (this.isInComparison(variantId)) {
        return this.removeFromComparison(variantId)
      } else {
        return this.addToComparison(variantId)
      }
    },

    /**
     * Initialize comparison store
     * Called on app initialization to load comparison data
     */
    async initialize(): Promise<void> {
      // Only fetch if comparison hasn't been loaded yet
      if (this.items.length === 0 && !this.loading) {
        await this.fetchComparison()
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.items = []
      this.comparisonToken = null
      this.maxItems = 10
      this.loading = false
      this.error = null
    },
  },
})

