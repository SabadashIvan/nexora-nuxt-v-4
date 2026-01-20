/**
 * Checkout domain types
 */

import type { CartItem, CartTotals } from './cart'
import { CheckoutStatus, PaymentProviderType } from './enums'

export interface Address {
  id?: number
  first_name: string
  last_name: string
  phone: string
  email?: string
  country: string
  region: string
  city: string
  postal: string
  address_line_1: string
  address_line_2?: string
  is_default?: boolean
}

export interface CheckoutAddresses {
  shipping: Address | null
  billing: Address | null
  billingSameAsShipping: boolean
}

/**
 * Shipping method from API
 * Uses code as identifier, price_minor in cents
 */
export interface ShippingMethod {
  /** Unique method code (used for selection) */
  code: string
  /** Display name */
  name: string
  /** Source of the shipping method */
  source: string
  /** Price in minor units (cents) */
  price_minor: number
  /** Estimated time of arrival (can be null) */
  eta: string | null
  /** Quote ID for this shipping option */
  quote_id: string
}

/**
 * API response for shipping methods
 */
export interface ShippingMethodsResponse {
  /** Currency for all prices */
  currency: string
  /** Available shipping methods */
  methods: ShippingMethod[]
  /** Cache TTL in seconds */
  cache_ttl_seconds: number
}

export interface PaymentProvider {
  code: string
  name: string
  type: PaymentProviderType | string // Allow string for backward compatibility
  fee: number
  icon?: string
  instructions?: string
}

export interface CheckoutPricing {
  items: number
  shipping: number
  discounts: number
  tax?: number
  total: number
  currency: string
}

export interface CheckoutItem extends CartItem {
  // Extended cart item for checkout context
}

export interface CheckoutSession {
  id: string
  items: CheckoutItem[]
  addresses: CheckoutAddresses
  pricing: CheckoutPricing
  selectedShippingMethod: ShippingMethod | null
  selectedPaymentProvider: PaymentProvider | null
  status: CheckoutStatus | string // Allow string for backward compatibility
}

// Re-export enum for convenience
export { CheckoutStatus }

export interface CheckoutState {
  checkoutId: string | null
  items: CheckoutItem[]
  addresses: CheckoutAddresses
  shippingMethods: ShippingMethod[]
  shippingCurrency: string | null
  selectedShipping: ShippingMethod | null
  /** Selected settlement for warehouse-based shipping */
  selectedSettlement: { external_id: string; name: string } | null
  /** Selected warehouse/pickup point for warehouse-based shipping */
  selectedWarehouse: { external_id: string; name: string; address: string } | null
  paymentProviders: PaymentProvider[]
  selectedPayment: PaymentProvider | null
  pricing: CheckoutPricing
  status: CheckoutStatus | string // Allow string for backward compatibility
  loading: boolean
  error: string | null
}

// Start checkout payload
export interface StartCheckoutPayload {
  billing_same_as_shipping: boolean
}

// Start checkout response
export interface StartCheckoutResponse {
  id: string
  items: CheckoutItem[]
  pricing: CheckoutPricing
  addresses: CheckoutAddresses
}

// API response wrapper (backend may wrap in { data: ... })
export interface CheckoutApiResponse<T> {
  data: T
}

export interface CheckoutUpdateAddressPayload {
  shipping_address: Address
  billing_address?: Address
  billing_same_as_shipping: boolean
}

export interface SetShippingMethodPayload {
  /** Shipping method code */
  method_code: string
  /** Quote ID from shipping methods response */
  quote_id?: string
  /** Provider-specific metadata (e.g., warehouse selection) */
  provider_metadata?: {
    /** External ID of selected warehouse/pickup point */
    warehouse_external_id?: string
    /** External ID of selected settlement/city */
    settlement_external_id?: string
  }
}

export interface SetPaymentProviderPayload {
  provider_code: string
}

export interface CheckoutConfirmResponse {
  order_id: number
}

// Payment initialization
export interface PaymentInitPayload {
  order_id: number
  provider_code: string
}

export interface PaymentInitResponse {
  payment_url: string
  status: string
}

