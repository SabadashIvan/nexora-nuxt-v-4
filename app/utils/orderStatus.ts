/**
 * Order Status Mapping Utility
 * 
 * Maps backend order statuses to UI labels, colors, and icons
 * Provides fallback rendering for unknown statuses
 */

import type { OrderStatus } from '~/types/enums'

export interface OrderStatusConfig {
  label: string
  color: string
  bgColor: string
  icon?: string
}

/**
 * Status mapping table (backend status → UI config)
 * Add new statuses here as backend introduces them
 */
const STATUS_MAP: Record<string, OrderStatusConfig> = {
  // Pending statuses
  'pending': {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  'processing': {
    label: 'Processing',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  'confirmed': {
    label: 'Confirmed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },

  // Fulfillment statuses
  'shipped': {
    label: 'Shipped',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  'delivered': {
    label: 'Delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },

  // Cancellation statuses
  'cancelled': {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  'refunded': {
    label: 'Refunded',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}

/**
 * Get status config for a given status
 * Returns fallback config for unknown statuses
 */
export function getOrderStatusConfig(status: OrderStatus | string): OrderStatusConfig {
  const normalizedStatus = status.toLowerCase()
  
  if (STATUS_MAP[normalizedStatus]) {
    return STATUS_MAP[normalizedStatus]
  }

  // Fallback for unknown statuses
  return {
    label: String(status), // Use raw status as label
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  }
}

/**
 * Check if status is a completion status (delivered, cancelled, refunded)
 */
export function isOrderComplete(status: OrderStatus | string): boolean {
  const normalizedStatus = status.toLowerCase()
  return ['delivered', 'cancelled', 'refunded'].includes(normalizedStatus)
}

/**
 * Check if status is a pending status
 */
export function isOrderPending(status: OrderStatus | string): boolean {
  const normalizedStatus = status.toLowerCase()
  return ['pending', 'processing', 'confirmed'].includes(normalizedStatus)
}
