/**
 * Favorites Store
 * Handles wishlist functionality using X-Guest-Id token
 * CSR-only
 */

import { defineStore } from 'pinia'
import type { ProductVariant, ApiResponse } from '~/types'
import { getErrorMessage } from '~/utils/errors'

// Favorites API response structure
interface FavoritesResponse {
  data: ProductVariant[]
  meta: {
    pagination: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

interface FavoritesState {
  favorites: ProductVariant[]
  loading: boolean
  error: string | null
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favorites: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Number of favorites
     */
    count: (state): number => {
      return state.favorites.length
    },

    /**
     * Check if a variant is in favorites
     */
    isFavorite: (state) => (variantId: number): boolean => {
      return state.favorites.some(f => f.id === variantId)
    },

    /**
     * Check if favorites is empty
     */
    isEmpty: (state): boolean => {
      return state.favorites.length === 0
    },

    /**
     * Get favorite IDs for quick lookup
     */
    favoriteIds: (state): number[] => {
      return state.favorites.map(f => f.id)
    },
  },

  actions: {
    /**
     * Fetch favorites from API
     */
    async fetchFavorites(): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<FavoritesResponse>('/catalog/favorites', undefined, { guest: true })
        // Extract data from paginated response
        this.favorites = response.data || []
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch favorites error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Add variant to favorites
     */
    async addToFavorites(variantId: number): Promise<boolean> {
      const api = useApi()
      this.error = null

      // Don't set loading=true to avoid blocking UI
      // We'll update optimistically after API success

      try {
        await api.post('/catalog/favorites', { variant_id: variantId }, { guest: true })
        
        // Fetch the variant data and add it immediately for instant UI update
        try {
          const response = await api.get<ApiResponse<ProductVariant> | ProductVariant>(`/catalog/variants/${variantId}`)
          
          // Handle wrapped or direct response
          let variant: ProductVariant
          if ('data' in response && response.data) {
            variant = response.data
          } else {
            variant = response as ProductVariant
          }
          
          // Update is_favorite flag
          variant.is_favorite = true
          
          // Add to favorites list immediately (optimistic update)
          if (!this.favorites.some(f => f.id === variantId)) {
            this.favorites.push(variant)
          }
          
          // Update product store if this variant is currently loaded
          try {
            const productStore = useProductStore()
            if (productStore.product?.id === variantId) {
              productStore.product.is_favorite = true
            }
            // Also check selected variant
            if (productStore.selectedVariant?.id === variantId) {
              productStore.selectedVariant.is_favorite = true
            }
          } catch {
            // Product store not available, ignore
          }
        } catch (fetchError) {
          // If fetching variant fails, fallback to refetching favorites list
          console.warn('Failed to fetch variant after adding to favorites, refetching list:', fetchError)
          await this.fetchFavorites()
        }
        
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to favorites error:', error)
        return false
      }
    },

    /**
     * Remove variant from favorites
     */
    async removeFromFavorites(variantId: number): Promise<boolean> {
      const api = useApi()
      this.error = null

      // Don't set loading=true to avoid blocking UI
      // We'll update optimistically immediately

      try {
        await api.delete(`/catalog/favorites/${variantId}`, { guest: true })
        
        // Remove from local state optimistically (instant UI update)
        this.favorites = this.favorites.filter(f => f.id !== variantId)
        
        // Update product store if this variant is currently loaded
        try {
          const productStore = useProductStore()
          if (productStore.product?.id === variantId) {
            productStore.product.is_favorite = false
          }
          // Also check selected variant
          if (productStore.selectedVariant?.id === variantId) {
            productStore.selectedVariant.is_favorite = false
          }
        } catch {
          // Product store not available, ignore
        }
        
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove from favorites error:', error)
        // Refetch on error to ensure consistency
        await this.fetchFavorites()
        return false
      }
    },

    /**
     * Toggle favorite status
     */
    async toggleFavorite(variantId: number): Promise<boolean> {
      if (this.isFavorite(variantId)) {
        return this.removeFromFavorites(variantId)
      } else {
        return this.addToFavorites(variantId)
      }
    },

    /**
     * Initialize favorites store
     * Called on app initialization to load favorites
     */
    async initialize(): Promise<void> {
      // Only fetch if favorites haven't been loaded yet
      if (this.favorites.length === 0 && !this.loading) {
        await this.fetchFavorites()
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.favorites = []
      this.loading = false
      this.error = null
    },
  },
})

