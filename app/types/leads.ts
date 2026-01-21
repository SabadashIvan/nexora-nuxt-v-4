/**
 * Leads domain types
 * For quick buy/callback requests
 * API: POST /api/v1/leads
 */

/**
 * Item in a lead request
 */
export interface LeadItem {
  variant_id: number
  qty: number
}

/**
 * Payload for creating a lead
 * Rate limited: 3 attempts per 60 minutes per email/IP
 */
export interface CreateLeadPayload {
  /** Product items to purchase */
  items: LeadItem[]
  /** Customer name */
  customer_name: string
  /** Customer phone (required) */
  customer_phone: string
  /** Customer email (optional) */
  customer_email?: string
  /** Additional comment */
  comment?: string
  /** Currency code (e.g., 'UAH') */
  currency: string
  /** Locale code (e.g., 'uk') */
  locale: string
  /** Client IP address */
  ip_address: string
  /** Browser user agent */
  user_agent: string
  /** Request source (e.g., 'product_page', 'landing_page') */
  source?: string
}

/**
 * Lead response from API
 */
export interface Lead {
  id: number
  status: string
  created_at: string
}

/**
 * Lead API response wrapper
 */
export interface LeadApiResponse {
  data: Lead
}

/**
 * Leads store state
 */
export interface LeadsState {
  loading: boolean
  error: string | null
  success: boolean
  /** Rate limit retry time in seconds */
  retryAfter: number | null
  /** Field-level validation errors */
  fieldErrors: Record<string, string>
}
