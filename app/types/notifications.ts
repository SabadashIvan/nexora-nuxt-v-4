/**
 * Notifications domain types
 * API: /api/v1/notifications/*
 */

import type { PaginationMeta } from './common'

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
  channel: NotificationChannel
  group: string
  enabled: boolean
}

/**
 * Available notification channels
 */
export type NotificationChannel = 'email' | 'sms' | 'push'

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

