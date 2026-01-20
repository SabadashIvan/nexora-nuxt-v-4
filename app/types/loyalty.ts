/**
 * Loyalty domain types
 * API: /api/v1/loyalty/*
 */

import type { PaginationMeta } from './common'

/**
 * Loyalty account details
 */
export interface LoyaltyAccount {
  user_id: number
  /** Current balance (formatted as currency string) */
  balance: string
  /** Pending points not yet available (formatted as currency string) */
  pending: string
}

/**
 * Loyalty transaction types
 */
export type LoyaltyTransactionType = 'Accrual' | 'Spending'

/**
 * Loyalty transaction record
 */
export interface LoyaltyTransaction {
  id: number
  type: LoyaltyTransactionType
  /** Amount (formatted as currency string) */
  amount: string
  description: string
  /** Expiration date for accrued points (null if no expiration) */
  expires_at: string | null
  created_at: string
}

/**
 * Response for loyalty account
 * GET /api/v1/loyalty
 */
export interface LoyaltyAccountResponse {
  data: LoyaltyAccount
}

/**
 * Response for loyalty history
 * GET /api/v1/loyalty/history
 */
export interface LoyaltyHistoryResponse {
  data: LoyaltyTransaction[]
  meta: PaginationMeta
}

/**
 * Loyalty store state
 */
export interface LoyaltyState {
  account: LoyaltyAccount | null
  transactions: LoyaltyTransaction[]
  loading: boolean
  historyLoading: boolean
  error: string | null
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
}
