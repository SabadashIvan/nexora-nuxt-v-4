/**
 * Cart domain types
 * Matches real API response format
 */

import type { CartWarningCode, CartPromotionType } from './enums'

/**
 * Cart item price in minor units (cents)
 */
export interface CartItemPrice {
  currency: string
  /** List price in minor units (e.g., cents) */
  list_minor: number
  /** Effective price after discounts in minor units */
  effective_minor: number
}

/**
 * Cart item option (e.g., size, color)
 */
export interface CartItemOption {
  name: string
  value: string
  price_minor?: number
}

/**
 * Cart item image - can be object, string URL, or null
 * Backend may return either format
 */
export type CartItemImage =
  | { id: number | null; url: string }
  | string
  | null

/**
 * Cart item from API
 */
export interface CartItem {
  /** Unique item ID (usually SKU-based) */
  id: string
  /** Product variant ID */
  variant_id: number
  /** Product SKU */
  sku: string
  /** Product name/title */
  name?: string
  /** Quantity in cart */
  qty: number
  /** Price information */
  price: CartItemPrice
  /** Selected options (size, color, etc.) */
  options: CartItemOption[]
  /** Total price of options in minor units */
  options_total_minor: number
  /** Line total in minor units (qty * effective_price + options) */
  line_total_minor: number
  /** Product image - can be object or string URL */
  image?: CartItemImage
}

/**
 * Cart totals in minor units
 */
export interface CartTotals {
  /** Subtotal of all items in minor units */
  items_minor: number
  /** Total discounts in minor units */
  discounts_minor: number
  /** Grand total in minor units */
  grand_total_minor: number
  /** Shipping cost in minor units (optional, may be calculated at checkout) */
  shipping_minor?: number
  /** Tax in minor units (optional) */
  tax_minor?: number
}

/**
 * Cart context (locale and currency)
 */
export interface CartContext {
  currency: string
  locale: string
}

/**
 * Cart warning (e.g., stock issues)
 */
export interface CartWarning {
  code: CartWarningCode | string // Allow string for backward compatibility
  item_id?: string
  variant_id?: number
  available?: number
  message?: string
}

/**
 * Cart promotion
 */
export interface CartPromotion {
  id: string
  code?: string
  description: string
  discount_minor: number
  type: CartPromotionType | string // Allow string for backward compatibility
}

/**
 * Cart from API
 */
export interface Cart {
  /** Cart token for identification */
  token: string
  /** Cart version for optimistic concurrency control */
  version: number
  /** Cart context (currency, locale) */
  context: CartContext
  /** Cart items */
  items: CartItem[]
  /** Applied promotions */
  promotions: CartPromotion[]
  /** Warnings (stock issues, etc.) */
  warnings: CartWarning[]
  /** Cart totals */
  totals: CartTotals
}

/**
 * API response wrapper for Cart
 */
export interface CartApiResponse {
  data: Cart
}

/**
 * Add to cart payload
 */
export interface AddToCartPayload {
  variant_id?: number
  sku?: string
  qty: number
}

/**
 * Update cart item payload
 */
export interface UpdateCartItemPayload {
  qty: number
}

/**
 * Cart item options payload
 */
export interface CartItemOptionsPayload {
  options: Record<string, string>
}

/**
 * Coupon payload
 */
export interface CouponPayload {
  code: string
}

/**
 * Applied coupon (legacy, now use CartPromotion)
 */
export interface AppliedCoupon {
  code: string
  discount: number
  type: CartPromotionType | string // Allow string for backward compatibility
  description?: string
}

/**
 * Cart store state
 */
export interface CartState {
  cart: Cart | null
  cartToken: string | null
  /** Cart version for optimistic concurrency control (If-Match header) */
  cartVersion: number | null
  /** Last confirmed cart state from the server */
  confirmedCart: Cart | null
  loading: boolean
  error: string | null
  /** Applied coupons (legacy) */
  appliedCoupons: AppliedCoupon[]
  /** Pending optimistic cart operations */
  pendingOps: CartOptimisticOp[]
}

export type CartOptimisticOpType = 'updateQty' | 'removeItem' | 'addItem'

export interface CartOptimisticOp {
  id: string
  type: CartOptimisticOpType
  status: 'pending' | 'failed'
  payload: {
    itemId?: string
    quantity?: number
    variantId?: number
    sku?: string
  }
}

/**
 * Helper: Convert minor units to major (e.g., cents to dollars)
 */
export function minorToMajor(minor: number): number {
  return minor / 100
}

/**
 * Helper: Format price from minor units
 */
export function formatPrice(minor: number, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(minorToMajor(minor))
}
