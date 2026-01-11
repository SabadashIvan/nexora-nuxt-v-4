/**
 * Audience/Email Marketing domain types
 * API: /api/v1/audience/*
 */

import { AudienceSubscriptionStatus } from './enums'

/**
 * Payload for subscribing to audience
 * POST /api/v1/audience/subscribe
 */
export interface AudienceSubscribePayload {
  email: string
  name?: string
  consent: boolean
  source?: string
  website: string  // Honeypot field, must be empty
}

/**
 * Response for subscribe
 */
export interface AudienceSubscribeResponse {
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

// Re-export enum for convenience
export { AudienceSubscriptionStatus }

/**
 * Audience store state
 */
export interface AudienceState {
  status: AudienceSubscriptionStatus | string // Allow string for backward compatibility
  loading: boolean
  error: string | null
  message: string | null
}

