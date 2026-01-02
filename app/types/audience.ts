/**
 * Audience/Email Marketing domain types
 * API: /api/v1/audience/*
 */

/**
 * Payload for subscribing to audience
 * POST /api/v1/audience/subscribe
 */
export interface AudienceSubscribePayload {
  email: string
}

/**
 * Response for subscribe
 */
export interface AudienceSubscribeResponse {
  status: 'success'
  message: string
}

/**
 * Payload for confirming subscription
 * POST /api/v1/audience/confirm
 */
export interface AudienceConfirmPayload {
  token: string
}

/**
 * Response for confirm
 */
export interface AudienceConfirmResponse {
  status: 'success'
  message: string
}

/**
 * Payload for unsubscribing
 * DELETE /api/v1/audience/unsubscribe
 */
export interface AudienceUnsubscribePayload {
  email: string
}

/**
 * Response for unsubscribe
 */
export interface AudienceUnsubscribeResponse {
  status: 'success'
  message: string
}

/**
 * Subscription status
 */
export type AudienceSubscriptionStatus = 'idle' | 'pending' | 'confirmed' | 'unsubscribed' | 'error'

/**
 * Audience store state
 */
export interface AudienceState {
  status: AudienceSubscriptionStatus
  loading: boolean
  error: string | null
  message: string | null
}

