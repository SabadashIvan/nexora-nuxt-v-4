/**
 * Checkout domain types
 */

import { CheckoutStatus } from './enums'
import type { PaymentProviderType } from './enums'

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

/** API address format (address_line1/2, postal) */
export interface CheckoutAddressDto {
  first_name: string | null
  last_name: string | null
  phone: string | null
  country: string | null
  region: string | null
  city: string | null
  postal: string | null
  address_line1: string | null
  address_line2: string | null
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
  /** Shipping provider code (e.g., 'nova_post') */
  provider_code?: string
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
  /** Loyalty points discount in minor units */
  loyalty_points_minor?: number
  /** Applied promotions (for display) */
  promotions?: CheckoutPromotionDto[]
}

/** Checkout item price from API */
export interface CheckoutItemPriceDto {
  currency: string
  list_minor: number
  sale_minor?: number
  effective_minor: number
}

/** Checkout item from API (start/address/shipping/payment responses) */
export interface CheckoutItemDto {
  variant_id: number
  sku: string
  qty: number
  price: CheckoutItemPriceDto
  line_total_minor: number
  loyalty_discount_minor: number
}

/** Normalized checkout line item (display) */
export interface CheckoutItem {
  variant_id: number
  sku: string
  qty: number
  price: CheckoutItemPriceDto
  line_total_minor: number
  loyalty_discount_minor: number
  /** Composite key for v-for */
  id: string
  /** Display name (sku fallback when no title) */
  name?: string
  image?: { id: number | null; url: string } | string | null
}

/** Promotion from checkout pricing */
export interface CheckoutPromotionDto {
  name: string
  type: number
  value: number
  source: number
  promotion_id: number
}

/** Pricing block from checkout API */
export interface CheckoutPricingDto {
  currency: string
  items_minor: number
  discounts_minor: number
  loyalty_points_minor: number
  shipping_minor: number
  grand_total_minor: number
  promotions: CheckoutPromotionDto[]
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
  /** Loyalty points applied in minor units */
  loyaltyPointsApplied: number | null
  /** Available loyalty balance in minor units */
  availableLoyaltyPoints: number | null
  status: CheckoutStatus | string
  loading: boolean
  error: string | null
}

// Start checkout payload
export interface StartCheckoutPayload {
  billing_same_as_shipping: boolean
}

/** Raw checkout start/update API response */
export interface StartCheckoutResponseDto {
  id: number
  expires_at: string
  currency: string
  locale: string
  pricing: CheckoutPricingDto
  items: CheckoutItemDto[]
  payment_provider: unknown[]
  shipping: unknown
  shipping_address: CheckoutAddressDto
  billing_address: CheckoutAddressDto
  billing_same_as_shipping: boolean
}

// Start checkout response (normalized)
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

/** API address payload (address_line1/2, postal) */
export interface CheckoutAddressPayloadDto {
  first_name: string
  last_name: string
  phone: string
  country: string
  region: string
  city: string
  postal: string
  address_line1: string
  address_line2?: string
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

