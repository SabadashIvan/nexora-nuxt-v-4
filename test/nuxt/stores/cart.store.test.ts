import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '~/stores/cart.store'
import type { Cart, CartItem } from '~/types'
import { useApi } from '~/composables/useApi'
import { getToken, removeToken, ensureCartToken } from '~/utils/tokens'

// Mock useApi
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetchCsrfCookie: vi.fn(),
    buildHeaders: vi.fn(),
    buildUrl: vi.fn(),
  })),
}))

// Mock token utilities
vi.mock('~/utils/tokens', () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  ensureCartToken: vi.fn(() => 'test-cart-token'),
  generateUUID: vi.fn(() => 'test-uuid'),
  TOKEN_KEYS: {
    CART: 'cart_token',
  },
}))

// Helper to create a complete Cart object
function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    token: 'test-token',
    version: 1,
    context: {
      currency: 'USD',
      locale: 'en',
    },
    items: [],
    promotions: [],
    warnings: [],
    totals: {
      items_minor: 0,
      discounts_minor: 0,
      grand_total_minor: 0,
    },
    ...overrides,
  }
}

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = useCartStore()
      expect(store.cart).toBeNull()
      expect(store.cartToken).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should restore token from storage', () => {
      vi.mocked(getToken).mockReturnValue('existing-token')
      
      const store = useCartStore()
      const token = store.restoreToken()
      
      expect(token).toBe('existing-token')
      expect(store.cartToken).toBe('existing-token')
    })

    it('should initialize new token if none exists', () => {
      vi.mocked(ensureCartToken).mockReturnValue('new-token')
      
      const store = useCartStore()
      const token = store.initializeToken()
      
      expect(token).toBe('new-token')
      expect(store.cartToken).toBe('new-token')
    })
  })

  describe('getters', () => {
    it('should calculate item count correctly', () => {
      const store = useCartStore()
      store.cart = createMockCart({
        items: [
          { qty: 2 } as CartItem,
          { qty: 3 } as CartItem,
        ],
      })
      
      expect(store.itemCount).toBe(5)
    })

    it('should return 0 for empty cart', () => {
      const store = useCartStore()
      expect(store.itemCount).toBe(0)
    })

    it('should calculate unique item count', () => {
      const store = useCartStore()
      store.cart = createMockCart({
        items: [
          { id: '1' } as CartItem,
          { id: '2' } as CartItem,
        ],
      })
      
      expect(store.uniqueItemCount).toBe(2)
    })

    it('should check if cart is empty', () => {
      const store = useCartStore()
      expect(store.isEmpty).toBe(true)
      
      store.cart = createMockCart({ items: [] })
      expect(store.isEmpty).toBe(true)
      
      store.cart = createMockCart({ items: [{ id: '1' } as CartItem] })
      expect(store.isEmpty).toBe(false)
    })

    it('should calculate subtotal correctly', () => {
      const store = useCartStore()
      store.cart = createMockCart({
        totals: {
          items_minor: 10000,
          discounts_minor: 0,
          grand_total_minor: 10000,
        },
      })
      
      expect(store.subtotal).toBe(100)
      expect(store.subtotalMinor).toBe(10000)
    })

    it('should calculate total correctly', () => {
      const store = useCartStore()
      store.cart = createMockCart({
        totals: {
          items_minor: 10000,
          discounts_minor: 2000,
          grand_total_minor: 8000,
        },
      })
      
      expect(store.total).toBe(80)
      expect(store.totalMinor).toBe(8000)
      expect(store.discountTotal).toBe(20)
    })
  })

  describe('loadCart', () => {
    it('should load cart successfully', async () => {
      const mockCart = createMockCart()
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      vi.mocked(getToken).mockReturnValue('test-token')
      
      const store = useCartStore()
      await store.loadCart()
      
      expect(store.cart).toBeTruthy()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle 404 error and clear token', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockRejectedValue({
          status: 404,
          message: 'Cart not found',
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      vi.mocked(getToken).mockReturnValue('test-token')
      
      const store = useCartStore()
      store.cartToken = 'test-token'
      await store.loadCart()
      
      expect(store.cartToken).toBeNull()
      expect(removeToken).toHaveBeenCalled()
    })
  })

  describe('addItem', () => {
    it('should add item to new cart', async () => {
      const mockCart = createMockCart({
        items: [{ id: '1', qty: 1 } as CartItem],
        totals: { items_minor: 1000, discounts_minor: 0, grand_total_minor: 1000 },
        token: 'new-token',
      })
      const mockApi = {
        request: vi.fn(),
        get: vi.fn(),
        post: vi.fn().mockResolvedValue(mockCart),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      const result = await store.addItem(1, 1)
      
      expect(result).toBe(true)
      expect(store.cart).toEqual(mockCart)
      expect(store.cartToken).toBe('new-token')
    })

    it('should add item to existing cart with version', async () => {
      vi.mocked(getToken).mockReturnValue('existing-token')
      
      const mockCart = createMockCart({
        items: [{ id: '1', qty: 2 } as CartItem],
        totals: { items_minor: 2000, discounts_minor: 0, grand_total_minor: 2000 },
        version: 2,
        token: 'existing-token',
      })
      
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn().mockResolvedValue(mockCart),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      store.cartToken = 'existing-token'
      store.cart = createMockCart({ ...mockCart, version: 1 })
      
      const result = await store.addItem(1, 1)
      
      expect(result).toBe(true)
      expect(mockApi.post).toHaveBeenCalled()
    })

    it('should handle IF_MATCH_REQUIRED error and retry', async () => {
      vi.mocked(getToken).mockReturnValue('existing-token')
      
      const mockCart = createMockCart({
        items: [{ id: '1', qty: 1 } as CartItem],
        totals: { items_minor: 1000, discounts_minor: 0, grand_total_minor: 1000 },
      })
      
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn()
          .mockRejectedValueOnce({
            status: 422,
            errors: { 'If-Match': ['IF_MATCH_REQUIRED'] },
          })
          .mockResolvedValueOnce(mockCart),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      store.cartToken = 'existing-token'
      
      const result = await store.addItem(1, 1)
      
      expect(result).toBe(true)
      expect(mockApi.post).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const mockCart = createMockCart({
        items: [{ id: '1', qty: 3 } as CartItem],
        totals: { items_minor: 3000, discounts_minor: 0, grand_total_minor: 3000 },
        version: 2,
      })
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn().mockResolvedValue(mockCart),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      store.cart = createMockCart({ ...mockCart, version: 1 })
      store.cartToken = 'test-token'
      
      const result = await store.updateItemQuantity('1', 3)
      
      expect(result).toBe(true)
      expect(store.cart?.items[0]?.qty).toBe(3)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const mockCart = createMockCart({
        items: [],
        totals: { items_minor: 0, discounts_minor: 0, grand_total_minor: 0 },
        version: 2,
      })
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn().mockResolvedValue(mockCart),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      store.cart = createMockCart({
        items: [{ id: '1' } as CartItem],
        version: 1,
      })
      store.cartToken = 'test-token'
      
      const result = await store.removeItem('1')
      
      expect(result).toBe(true)
      expect(store.cart?.items.length).toBe(0)
    })
  })

  describe('applyCoupon', () => {
    it('should apply coupon successfully', async () => {
      const mockCart = createMockCart({
        items: [],
        totals: { items_minor: 10000, discounts_minor: 2000, grand_total_minor: 8000 },
        version: 2,
      })
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCart),
        post: vi.fn().mockResolvedValue({
          cart: mockCart,
          coupon: { code: 'SAVE20', discount_minor: 2000 },
        }),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCartStore()
      store.cart = createMockCart({ ...mockCart, version: 1 })
      store.cartToken = 'test-token'
      
      const result = await store.applyCoupon('SAVE20')
      
      expect(result).toBe(true)
      expect(store.appliedCoupons.length).toBeGreaterThan(0)
    })
  })

  describe('clearCart', () => {
    it('should clear cart state', () => {
      const store = useCartStore()
      store.cart = createMockCart({
        items: [{ id: '1' } as CartItem],
        totals: { items_minor: 1000, discounts_minor: 0, grand_total_minor: 1000 },
      })
      store.appliedCoupons = [{ code: 'TEST' } as any]
      
      store.clearCart()
      
      expect(store.cart).toBeNull()
      expect(store.appliedCoupons).toEqual([])
    })
  })
})
