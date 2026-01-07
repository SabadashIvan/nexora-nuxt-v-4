/**
 * Notifications domain types
 * API: /api/v1/notifications/*
 */

import type { PaginationMeta } from './common'
import { NotificationChannel } from './enums'

/**
 * Notification entity
 */
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read_at: string | null
  created_at: string
}

/**
 * Notification preferences by channel
 */
export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
}

/**
 * Notification channel preference
 */
export interface ChannelPreference {
  channel: NotificationChannel | string // Allow string for backward compatibility
  group: string
  enabled: boolean
}

// Re-export enum for convenience
export { NotificationChannel }

/**
 * Response for notifications list
 * GET /api/v1/notifications
 */
export interface NotificationsListResponse {
  data: Notification[]
  meta: PaginationMeta
}

/**
 * Response for unread count
 * GET /api/v1/notifications/count
 */
export interface NotificationCountResponse {
  count: number
}

/**
 * Payload for updating preferences
 * POST /api/v1/notifications/preferences
 */
export interface UpdatePreferencesPayload {
  email?: boolean
  sms?: boolean
  push?: boolean
}

/**
 * Payload for channel/group preference
 * PUT /api/v1/notifications/preferences/{channel}/{group}
 */
export interface UpdateChannelPreferencePayload {
  enabled: boolean
}

/**
 * Response for marking notification as read
 * POST /api/v1/notifications/{id}/read
 */
export interface MarkAsReadResponse {
  status: 'success'
}

/**
 * Notifications store state
 */
export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
}
