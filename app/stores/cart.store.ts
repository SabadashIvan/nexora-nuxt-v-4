/**
 * Cart Store
 * Handles shopping cart: items, totals, coupons, item options
 * CSR-only - depends on X-Cart-Token
 */

import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import type { 
  Cart, 
  CartItem, 
  CartTotals, 
  CartState,
  CartApiResponse,
  CartWarning,
  AddToCartPayload,
  UpdateCartItemPayload,
  CartItemOptionsPayload,
  CouponPayload,
  AppliedCoupon,
} from '~/types'
import { minorToMajor, formatPrice } from '~/types/cart'
import { parseApiError, getErrorMessage, CHECKOUT_ERRORS } from '~/utils/errors'
import { ensureCartToken, getToken, TOKEN_KEYS, setToken, removeToken } from '~/utils/tokens'

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    cartToken: null,
    cartVersion: null,
    loading: false,
    error: null,
    appliedCoupons: [],
  }),

  getters: {
    /**
     * Total number of items in cart (sum of quantities)
     */
    itemCount: (state): number => {
      if (!state.cart) return 0
      return state.cart.items.reduce((sum, item) => sum + item.qty, 0)
    },

    /**
     * Number of unique items in cart
     */
    uniqueItemCount: (state): number => {
      return state.cart?.items.length || 0
    },

    /**
     * Cart subtotal in minor units
     */
    subtotalMinor: (state): number => {
      return state.cart?.totals.items_minor || 0
    },

    /**
     * Cart subtotal in major units (e.g., dollars)
     */
    subtotal: (state): number => {
      return minorToMajor(state.cart?.totals.items_minor || 0)
    },

    /**
     * Cart grand total in minor units
     */
    totalMinor: (state): number => {
      return state.cart?.totals.grand_total_minor || 0
    },

    /**
     * Cart grand total in major units
     */
    total: (state): number => {
      return minorToMajor(state.cart?.totals.grand_total_minor || 0)
    },

    /**
     * Total discount in minor units
     */
    discountMinor: (state): number => {
      return state.cart?.totals.discounts_minor || 0
    },

    /**
     * Total discount in major units
     */
    discountTotal: (state): number => {
      return minorToMajor(state.cart?.totals.discounts_minor || 0)
    },

    /**
     * Check if cart is empty
     */
    isEmpty: (state): boolean => {
      return !state.cart || state.cart.items.length === 0
    },

    /**
     * Get cart items
     */
    items: (state): CartItem[] => {
      return state.cart?.items || []
    },

    /**
     * Get cart totals
     */
    totals: (state): CartTotals | null => {
      return state.cart?.totals || null
    },

    /**
     * Get cart currency
     */
    currency: (state): string => {
      return state.cart?.context.currency || 'USD'
    },

    /**
     * Get cart warnings (e.g., stock issues)
     */
    warnings: (state): CartWarning[] => {
      return state.cart?.warnings || []
    },

    /**
     * Check if cart has warnings
     */
    hasWarnings: (state): boolean => {
      return (state.cart?.warnings.length || 0) > 0
    },

    /**
     * Get formatted total price
     */
    formattedTotal(): string {
      if (!this.cart) return ''
      return formatPrice(
        this.cart.totals.grand_total_minor,
        this.cart.context.currency,
        this.cart.context.locale
      )
    },

    /**
     * Get formatted subtotal price
     */
    formattedSubtotal(): string {
      if (!this.cart) return ''
      return formatPrice(
        this.cart.totals.items_minor,
        this.cart.context.currency,
        this.cart.context.locale
      )
    },
  },

  actions: {
    /**
     * Restore cart token from storage (without creating new one)
     * Used for initialization - doesn't create token if it doesn't exist
     */
    restoreToken(): string | null {
      if (!this.cartToken) {
        // Try to get existing token from storage (don't create new)
        this.cartToken = getToken(TOKEN_KEYS.CART)
      }
      return this.cartToken
    },

    /**
     * Initialize cart token - creates new token if doesn't exist
     * Used when explicitly needed (e.g., before adding item)
     */
    initializeToken(): string {
      if (!this.cartToken) {
        this.cartToken = ensureCartToken()
      }
      return this.cartToken
    },

    /**
     * Initialize cart store - restore token and load cart if exists
     * Called on app initialization to restore cart state
     */
    async initialize(): Promise<void> {
      // Restore token from storage (don't create new)
      const token = this.restoreToken()
      
      // If token exists, try to load cart from backend
      if (token) {
        try {
          await this.loadCart()
        } catch (error) {
          // If cart doesn't exist on backend (expired), clear token
          // This can happen if cart expired on backend
          console.warn('Cart not found on backend, clearing token:', error)
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }
      }
    },

    /**
     * Extract cart from API response (handles { data: Cart } wrapper)
     */
    extractCart(response: Cart | CartApiResponse): Cart {
      if ('data' in response && response.data) {
        return response.data
      }
      return response as Cart
    },

    /**
     * Fetch cart version from lightweight endpoint
     * GET /api/v1/cart/v - returns version in X-Cart-Version header
     * Used for If-Match header in mutation requests
     */
    async fetchCartVersion(): Promise<number | null> {
      // Restore token if not set (don't create new)
      if (!this.cartToken) {
        this.restoreToken()
      }
      
      if (!this.cartToken) {
        return null
      }

      try {
        // Use $fetch directly to access response headers
        const baseUrl = import.meta.server
          ? (useRuntimeConfig().apiBackendUrl as string || 'http://localhost:8000')
          : (useRuntimeConfig().public.apiBackendUrl as string || 'http://localhost:8000')
        
        const response = await $fetch.raw(`${baseUrl}/api/v1/cart/v`, {
          method: 'GET',
          headers: {
            'X-Cart-Token': this.cartToken || '',
            'Accept': 'application/json',
          },
          credentials: 'include',
        })

        // Parse version from response headers
        const versionHeader = response.headers.get('X-Cart-Version')
        if (versionHeader) {
          const version = parseInt(versionHeader, 10)
          if (!isNaN(version)) {
            this.cartVersion = version
            return version
          }
        }

        // Fallback: try to get version from cart if available
        return this.cart?.version ?? null
      } catch (error) {
        console.error('Fetch cart version error:', error)
        return null
      }
    },

    /**
     * Ensure cart version is available for If-Match header
     * Fetches version if not already cached
     * @returns Current cart version or null if unavailable
     */
    async ensureCartVersion(): Promise<number | null> {
      // First check if we already have a version (from cart or cached)
      const existingVersion = this.cartVersion ?? this.cart?.version
      if (existingVersion !== undefined && existingVersion !== null) {
        return existingVersion
      }

      // Fetch version from lightweight endpoint
      return await this.fetchCartVersion()
    },

    /**
     * Get current cart version (sync, for building headers)
     * Returns cached version or cart version
     */
    getCurrentVersion(): number | null {
      return this.cartVersion ?? this.cart?.version ?? null
    },

    /**
     * Update cart version after successful mutation
     * @param version - New version from API response
     */
    updateVersion(version: number | undefined): void {
      if (version !== undefined) {
        this.cartVersion = version
      }
    },

    /**
     * Load cart from API
     * Requires existing cartToken (use initialize() to restore token first)
     */
    async loadCart(): Promise<void> {
      const api = useApi()
      
      // Restore token if not already set (but don't create new)
      if (!this.cartToken) {
        this.restoreToken()
      }
      
      // If still no token, can't load cart
      if (!this.cartToken) {
        this.error = 'No cart token available'
        return
      }
      
      this.loading = true
      this.error = null

      try {
        const response = await api.get<Cart | CartApiResponse>('/cart', undefined, { cart: true })
        const cart = this.extractCart(response)
        this.cart = cart
        // Sync version from cart response
        this.updateVersion(cart.version)
        
        // Update token if returned by API
        if (cart.token && cart.token !== this.cartToken) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Load cart error:', error)
        // If 404 or cart not found, clear token
        const apiError = parseApiError(error)
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Add item to cart
     * @param variantId - Product variant ID (optional if sku is provided)
     * @param quantity - Quantity to add
     * @param sku - Product variant SKU (optional if variantId is provided)
     * @param idempotencyKey - Optional idempotency key for request deduplication
     * 
     * If no cartToken exists, API creates a new cart automatically.
     * If cartToken exists, If-Match header with version is required.
     */
    async addItem(
      variantId?: number, 
      quantity = 1, 
      sku?: string,
      idempotencyKey?: string
    ): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Build payload - either variant_id or sku must be provided
        const payload: AddToCartPayload = { qty: quantity }
        if (variantId) {
          payload.variant_id = variantId
        } else if (sku) {
          payload.sku = sku
        } else {
          throw new Error('Either variantId or sku must be provided')
        }

        const headers: Record<string, string> = {}
        
        // Check if we have an existing cart
        const hasExistingCart = !!this.cartToken

        if (hasExistingCart) {
          // Existing cart: need If-Match header with version
          await this.ensureCartVersion()
          const version = this.getCurrentVersion()
          if (version !== null) {
            headers['If-Match'] = String(version)
          }
        }
        // If no cartToken, API will create new cart automatically
        // Don't send X-Cart-Token or If-Match headers

        // Add Idempotency-Key if provided
        if (idempotencyKey) {
          headers['Idempotency-Key'] = idempotencyKey
        }

        const response = await api.post<Cart | CartApiResponse>('/cart/items', payload, { 
          // Only include cart token if we have existing cart
          cart: hasExistingCart,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        
        const cart = this.extractCart(response)
        this.cart = cart
        
        // Save token and version from response (especially important for new cart)
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        this.updateVersion(cart.version)
        
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Add to cart error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update item quantity
     * Uses PATCH method as per API specification
     */
    async updateItemQuantity(itemId: string, quantity: number): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const payload: UpdateCartItemPayload = { qty: quantity }
        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await api.patch<Cart | CartApiResponse>(`/cart/items/${itemId}`, payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        const cart = this.extractCart(response)
        this.cart = cart
        this.updateVersion(cart.version)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update cart item error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove item from cart
     */
    async removeItem(itemId: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await api.delete<Cart | CartApiResponse>(`/cart/items/${itemId}`, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        const cart = this.extractCart(response)
        this.cart = cart
        this.updateVersion(cart.version)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove cart item error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update item options (size, color, etc.)
     */
    async updateItemOptions(itemId: string, options: Record<string, string>): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const payload: CartItemOptionsPayload = { options }
        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await api.put<Cart | CartApiResponse>(`/cart/items/${itemId}/options`, payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        const cart = this.extractCart(response)
        this.cart = cart
        this.updateVersion(cart.version)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update item options error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Apply coupon code
     */
    async applyCoupon(code: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const payload: CouponPayload = { code }
        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await api.post<{ data: Cart } | { cart: Cart; coupon: AppliedCoupon }>('/cart/coupons', payload, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        
        // Handle both response formats
        if ('data' in response) {
          this.cart = response.data
          this.updateVersion(response.data.version)
        } else if ('cart' in response) {
          this.cart = response.cart
          this.updateVersion(response.cart.version)
          if (response.coupon) {
            this.appliedCoupons.push(response.coupon)
          }
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Apply coupon error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove coupon
     */
    async removeCoupon(code: string): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await api.delete<Cart | CartApiResponse>(`/cart/coupons/${code}`, { 
          cart: true,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        })
        const cart = this.extractCart(response)
        this.cart = cart
        this.updateVersion(cart.version)
        this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== code)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Remove coupon error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Attach guest cart to authenticated user
     */
    async attachCart(): Promise<void> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      const authStore = useAuthStore()

      // Only attach if user is authenticated and we have a cart token
      if (!authStore.isAuthenticated || !this.cartToken) return

      try {
        // Ensure we have cart version for If-Match header
        await this.ensureCartVersion()

        const headers: Record<string, string> = {}
        const version = this.getCurrentVersion()
        if (version !== null) {
          headers['If-Match'] = String(version)
        }

        const response = await nuxtApp.runWithContext(async () => 
          await api.post<Cart | CartApiResponse>('/cart/attach', undefined, { 
            cart: true,
            headers: Object.keys(headers).length > 0 ? headers : undefined
          })
        )
        const cart = this.extractCart(response)
        this.cart = cart
        this.updateVersion(cart.version)
      } catch (error) {
        console.error('Attach cart error:', error)
        // Non-critical - just log the error
      }
    },

    /**
     * Format price using cart currency and locale
     */
    formatItemPrice(minorAmount: number): string {
      if (!this.cart) return ''
      return formatPrice(minorAmount, this.cart.context.currency, this.cart.context.locale)
    },

    /**
     * Clear cart (used after successful checkout)
     */
    clearCart(): void {
      this.cart = null
      this.cartVersion = null
      this.appliedCoupons = []
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.cart = null
      this.cartToken = null
      this.cartVersion = null
      this.loading = false
      this.error = null
      this.appliedCoupons = []
    },
  },
})
