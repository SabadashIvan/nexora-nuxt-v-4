/**
 * Orders domain types
 */

import type { Address, ShippingMethod, PaymentProvider } from './checkout'
import type { ImageValue } from './common'
import { OrderStatus, PaymentStatus } from './enums'

export interface OrderItem {
  id: number
  variant_id: number
  name: string
  slug: string
  sku: string
  image?: ImageValue
  quantity: number
  price: number
  total: number
  currency: string
  options?: Record<string, string>
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  discounts: number
  tax?: number
  total: number
  currency: string
}

// Re-export enums for convenience
export { OrderStatus, PaymentStatus }

export interface Order {
  id: number
  order_number: string
  status: OrderStatus | string // Allow string for backward compatibility
  payment_status: PaymentStatus | string // Allow string for backward compatibility
  items: OrderItem[]
  totals: OrderTotals
  shipping_address: Address
  billing_address: Address
  shipping_method: ShippingMethod
  payment_provider: PaymentProvider
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrdersState {
  orders: Order[]
  order: Order | null
  loading: boolean
  error: string | null
}

