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
  CartItemImage,
  CartTotals,
  CartState,
  CartApiResponse,
  CartWarning,
  AddToCartPayload,
  UpdateCartItemPayload,
  CartItemOptionsPayload,
  CouponPayload,
  AppliedCoupon,
  CartOptimisticOp,
} from '~/types'
import { minorToMajor, formatPrice } from '~/types/cart'
import { parseApiError, getErrorMessage } from '~/utils/errors'
import { ensureCartToken, generateUUID, getToken, TOKEN_KEYS, setToken, removeToken } from '~/utils/tokens'
import { useAuthStore } from '~/stores/auth.store'

function cloneCart(cart: Cart): Cart {
  if (typeof structuredClone === 'function') {
    return structuredClone(cart)
  }
  return JSON.parse(JSON.stringify(cart)) as Cart
}

/**
 * Get image URL from cart item image
 * Handles both string and object formats from backend
 */
export function getCartItemImageUrl(image: CartItemImage | undefined): string | null {
  if (!image) return null
  if (typeof image === 'string') return image
  return image.url
}

function recalculateTotals(cart: Cart): void {
  const itemsMinor = cart.items.reduce((sum, item) => sum + item.line_total_minor, 0)
  const shippingMinor = cart.totals.shipping_minor || 0
  const taxMinor = cart.totals.tax_minor || 0
  const discountsMinor = cart.totals.discounts_minor || 0

  cart.totals.items_minor = itemsMinor
  cart.totals.grand_total_minor = itemsMinor + shippingMinor + taxMinor - discountsMinor
}

function applyOptimisticOp(cart: Cart, op: CartOptimisticOp): void {
  if (op.type === 'updateQty' && op.payload.itemId && op.payload.quantity !== undefined) {
    const item = cart.items.find(cartItem => cartItem.id === op.payload.itemId)
    if (!item) return
    item.qty = op.payload.quantity
    item.line_total_minor = (item.price.effective_minor * item.qty) + item.options_total_minor
    recalculateTotals(cart)
    return
  }

  if (op.type === 'removeItem' && op.payload.itemId) {
    cart.items = cart.items.filter(cartItem => cartItem.id !== op.payload.itemId)
    recalculateTotals(cart)
    return
  }

  if (op.type === 'addItem' && op.payload.quantity !== undefined && (op.payload.variantId || op.payload.sku)) {
    const match = cart.items.find((cartItem) => (
      (op.payload.variantId && cartItem.variant_id === op.payload.variantId) ||
      (op.payload.sku && cartItem.sku === op.payload.sku)
    ))
    if (!match) return
    match.qty += op.payload.quantity
    match.line_total_minor = (match.price.effective_minor * match.qty) + match.options_total_minor
    recalculateTotals(cart)
  }
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    cartToken: null,
    cartVersion: null,
    confirmedCart: null,
    loading: false,
    error: null,
    appliedCoupons: [],
    pendingOps: [],
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
     * Check if optimistic UI is enabled via runtime config
     */
    isOptimisticEnabled(): boolean {
      const config = useRuntimeConfig()
      return Boolean(config.public?.features?.cartOptimisticUI)
    },

    /**
     * Set cart state with confirmed server data
     */
    setCart(cart: Cart, options?: { clearPending?: boolean }): void {
      this.confirmedCart = cloneCart(cart)
      this.updateVersion(cart.version)
      if (options?.clearPending) {
        this.pendingOps = []
      }
      if (this.pendingOps.length > 0) {
        this.rebuildOptimisticCart()
      } else {
        this.cart = cart
      }
    },

    /**
     * Rebuild optimistic cart state from confirmed data + pending ops
     */
    rebuildOptimisticCart(): void {
      if (!this.confirmedCart) return
      const nextCart = cloneCart(this.confirmedCart)
      this.pendingOps.forEach((op) => {
        applyOptimisticOp(nextCart, op)
      })
      this.cart = nextCart
    },

    /**
     * Apply an optimistic operation to the current cart
     */
    applyOptimisticOperation(op: CartOptimisticOp): boolean {
      if (!this.confirmedCart) return false
      this.pendingOps.push(op)
      this.rebuildOptimisticCart()
      return true
    },

    /**
     * Finalize an optimistic operation after server success
     */
    finalizeOptimisticOperation(opId: string | null, cart: Cart): void {
      this.confirmedCart = cloneCart(cart)
      this.updateVersion(cart.version)

      if (opId) {
        this.pendingOps = this.pendingOps.filter(op => op.id !== opId)
      }

      if (this.pendingOps.length > 0) {
        this.rebuildOptimisticCart()
      } else {
        this.cart = cart
      }
    },

    /**
     * Roll back an optimistic operation on concurrency/validation errors
     */
    rollbackOptimisticOperation(opId: string): void {
      this.pendingOps = this.pendingOps.filter(op => op.id !== opId)
      this.rebuildOptimisticCart()
    },

    /**
     * Mark an optimistic operation as failed (rollback optimistic state)
     */
    markOptimisticFailed(opId: string): void {
      this.pendingOps = this.pendingOps.filter(op => op.id !== opId)
      this.rebuildOptimisticCart()
    },

    /**
     * Determine if error should trigger optimistic rollback
     */
    shouldRollbackOptimistic(error: unknown): boolean {
      const apiError = parseApiError(error)
      return apiError.status === 409 || apiError.status === 422
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
        this.setCart(cart, { clearPending: true })
        
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
     *
     * If no cartToken exists, API creates a new cart automatically.
     */
    async addItem(
      variantId?: number, 
      quantity = 1, 
      sku?: string
    ): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null
      let optimisticOpId: string | null = null

      let lastError: unknown = null
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

        // Check if we have an existing cart token
        // Restore token if not set (but don't create new one)
        if (!this.cartToken) {
          this.restoreToken()
        }

        if (this.isOptimisticEnabled() && (this.confirmedCart || this.cart)) {
          const baseCart = this.confirmedCart || this.cart
          const hasMatch = baseCart?.items.some((item) => (
            (variantId && item.variant_id === variantId) ||
            (sku && item.sku === sku)
          ))

          if (hasMatch) {
            const optimisticOp: CartOptimisticOp = {
              id: generateUUID(),
              type: 'addItem',
              status: 'pending',
              payload: {
                variantId,
                sku,
                quantity,
              },
            }

            if (this.applyOptimisticOperation(optimisticOp)) {
              optimisticOpId = optimisticOp.id
            }
          }
        }

        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const response = await api.post<Cart | CartApiResponse>('/cart/items', payload, { 
              cart: true,
            })
            
            const cart = this.extractCart(response)
            this.finalizeOptimisticOperation(optimisticOpId, cart)
            
            // Save token and version from response (especially important for new cart)
            if (cart.token) {
              this.cartToken = cart.token
              setToken(TOKEN_KEYS.CART, cart.token)
            }
            
            return true
          } catch (error) {
            const apiError = parseApiError(error)
            lastError = error
            
            // Handle 404 - cart doesn't exist, clear token and retry once
            if (apiError.status === 404 && attempt === 0) {
              this.cartToken = null
              removeToken(TOKEN_KEYS.CART)
              continue
            }
            
            break
          }
        }

        if (optimisticOpId) {
          if (this.shouldRollbackOptimistic(lastError)) {
            this.rollbackOptimisticOperation(optimisticOpId)
          } else {
            this.markOptimisticFailed(optimisticOpId)
          }
        }
        
        this.error = getErrorMessage(lastError)
        console.error('Add to cart error:', lastError)
        return false
      } catch (error) {
        lastError = error
        if (optimisticOpId) {
          if (this.shouldRollbackOptimistic(lastError)) {
            this.rollbackOptimisticOperation(optimisticOpId)
          } else {
            this.markOptimisticFailed(optimisticOpId)
          }
        }
        this.error = getErrorMessage(lastError)
        console.error('Add to cart error:', lastError)
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
      let optimisticOpId: string | null = null

      try {
        if (this.isOptimisticEnabled() && (this.confirmedCart || this.cart)) {
          const baseCart = this.confirmedCart || this.cart
          const hasItem = baseCart?.items.some(item => item.id === itemId)
          if (hasItem) {
            const optimisticOp: CartOptimisticOp = {
              id: generateUUID(),
              type: 'updateQty',
              status: 'pending',
              payload: {
                itemId,
                quantity,
              },
            }
            if (this.applyOptimisticOperation(optimisticOp)) {
              optimisticOpId = optimisticOp.id
            }
          }
        }

        const payload: UpdateCartItemPayload = { qty: quantity }
        const response = await api.patch<Cart | CartApiResponse>(`/cart/items/${itemId}`, payload, {
          cart: true,
        })
        const cart = this.extractCart(response)
        this.finalizeOptimisticOperation(optimisticOpId, cart)

        // Save token from response (ensures token is stored after cart creation)
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        
        // Handle 404 - cart doesn't exist, clear token
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }

        if (optimisticOpId) {
          if (this.shouldRollbackOptimistic(error)) {
            this.rollbackOptimisticOperation(optimisticOpId)
          } else {
            this.markOptimisticFailed(optimisticOpId)
          }
        }
        
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
      let optimisticOpId: string | null = null

      try {
        if (this.isOptimisticEnabled() && (this.confirmedCart || this.cart)) {
          const baseCart = this.confirmedCart || this.cart
          const hasItem = baseCart?.items.some(item => item.id === itemId)
          if (hasItem) {
            const optimisticOp: CartOptimisticOp = {
              id: generateUUID(),
              type: 'removeItem',
              status: 'pending',
              payload: { itemId },
            }
            if (this.applyOptimisticOperation(optimisticOp)) {
              optimisticOpId = optimisticOp.id
            }
          }
        }

        const response = await api.delete<Cart | CartApiResponse>(`/cart/items/${itemId}`, {
          cart: true,
        })
        const cart = this.extractCart(response)
        this.finalizeOptimisticOperation(optimisticOpId, cart)

        // Save token from response
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)

        // Handle 404 - cart doesn't exist, clear token
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }

        if (optimisticOpId) {
          if (this.shouldRollbackOptimistic(error)) {
            this.rollbackOptimisticOperation(optimisticOpId)
          } else {
            this.markOptimisticFailed(optimisticOpId)
          }
        }

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
        const payload: CartItemOptionsPayload = { options }
        const response = await api.put<Cart | CartApiResponse>(`/cart/items/${itemId}/options`, payload, {
          cart: true,
        })
        const cart = this.extractCart(response)
        this.finalizeOptimisticOperation(null, cart)

        // Save token from response
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        
        // Handle 404 - cart doesn't exist, clear token
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }
        
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
        const payload: CouponPayload = { code }
        const response = await api.post<{ data: Cart } | { cart: Cart; coupon: AppliedCoupon }>('/cart/coupons', payload, {
          cart: true,
        })

        // Handle both response formats and extract cart
        let cart: Cart
        if ('data' in response) {
          cart = response.data
          this.finalizeOptimisticOperation(null, cart)
        } else if ('cart' in response) {
          cart = response.cart
          this.finalizeOptimisticOperation(null, cart)
          if (response.coupon) {
            this.appliedCoupons.push(response.coupon)
          }
        } else {
          return true
        }

        // Save token from response
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        
        // Handle 404 - cart doesn't exist, clear token
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }
        
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
        const response = await api.delete<Cart | CartApiResponse>(`/cart/coupons/${code}`, {
          cart: true,
        })
        const cart = this.extractCart(response)
        this.finalizeOptimisticOperation(null, cart)
        this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== code)

        // Save token from response
        if (cart.token) {
          this.cartToken = cart.token
          setToken(TOKEN_KEYS.CART, cart.token)
        }
        return true
      } catch (error) {
        const apiError = parseApiError(error)

        // Handle 404 - cart doesn't exist, clear token
        if (apiError.status === 404) {
          this.cartToken = null
          removeToken(TOKEN_KEYS.CART)
        }

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
        const response = await nuxtApp.runWithContext(async () => 
          await api.post<Cart | CartApiResponse>('/cart/attach', undefined, { 
            cart: true,
          })
        )
        const cart = this.extractCart(response)
        this.finalizeOptimisticOperation(null, cart)
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
      this.confirmedCart = null
      this.appliedCoupons = []
      this.pendingOps = []
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.cart = null
      this.cartToken = null
      this.cartVersion = null
      this.confirmedCart = null
      this.loading = false
      this.error = null
      this.appliedCoupons = []
      this.pendingOps = []
    },
  },
})
