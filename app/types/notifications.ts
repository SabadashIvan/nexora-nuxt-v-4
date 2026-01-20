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
 * Notification filter types
 */
export type NotificationFilter = 'all' | 'unread' | 'archived'

/**
 * Notification group with enabled status
 * Part of the preferences matrix
 */
export interface NotificationGroupDetail {
  value: number
  title: string
  description: string
  enabled: boolean
}

/**
 * Contact channel details
 */
export interface ContactChannelDetail {
  value: number
  can_link: boolean
  can_unlink: boolean
  is_linked: boolean
}

/**
 * Notification channel with groups
 * Part of the preferences matrix response
 */
export interface NotificationChannelDetail {
  value: number
  title: string
  contact_channel: ContactChannelDetail
  groups: NotificationGroupDetail[]
}

/**
 * Response for preferences matrix
 * GET /api/v1/notifications/preferences
 */
export interface NotificationPreferencesMatrixResponse {
  data: NotificationChannelDetail[]
}

/**
 * Notifications store state
 */
export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  /** Detailed preferences matrix with channels and groups */
  preferencesMatrix: NotificationChannelDetail[]
  /** Current filter for notifications list */
  currentFilter: NotificationFilter
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
  }
}
