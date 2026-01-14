/**
 * Notifications Store
 * Handles user notifications: list, count, preferences, mark as read
 * API: /api/v1/notifications/*
 * Requires authentication
 */

import { defineStore } from 'pinia'
import type {
  NotificationsState,
  Notification,
  NotificationPreferences,
  NotificationsListResponse,
  NotificationCountResponse,
  UpdatePreferencesPayload,
  UpdateChannelPreferencePayload,
  MarkAsReadResponse,
  NotificationChannel,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
    preferences: null,
    loading: false,
    error: null,
    filter: 'all', // 'all' | 'unread' | 'archived'
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0,
    },
  }),

  getters: {
    /**
     * Check if there are unread notifications
     */
    hasUnread: (state): boolean => {
      return state.unreadCount > 0
    },

    /**
     * Get unread notifications
     */
    unreadNotifications: (state): Notification[] => {
      return state.notifications.filter(n => n.read_at === null)
    },

    /**
     * Get read notifications
     */
    readNotifications: (state): Notification[] => {
      return state.notifications.filter(n => n.read_at !== null)
    },

    /**
     * Check if has more pages
     */
    hasMorePages: (state): boolean => {
      return state.pagination.currentPage < state.pagination.lastPage
    },
  },

  actions: {
    /**
     * Fetch notifications list
     * GET /api/v1/notifications
     * @param filter - Filter type: 'all' | 'unread' | 'archived'
     */
    async fetchNotifications(page = 1, perPage = 15, filter: 'all' | 'unread' | 'archived' = 'all'): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null
      this.filter = filter

      try {
        const queryParams: Record<string, string | number> = {
          page,
          per_page: perPage,
        }

        // Add filter query parameter if not 'all'
        if (filter !== 'all') {
          queryParams.filter = filter
        }

        const response = await api.get<NotificationsListResponse>('/notifications', queryParams)

        if (page === 1) {
          this.notifications = response.data
        } else {
          // Append for pagination
          this.notifications = [...this.notifications, ...response.data]
        }

        this.pagination = {
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch notifications error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Load more notifications (next page)
     */
    async loadMore(): Promise<void> {
      if (!this.hasMorePages || this.loading) return
      await this.fetchNotifications(this.pagination.currentPage + 1)
    },

    /**
     * Fetch unread notifications count
     * GET /api/v1/notifications/count
     */
    async fetchUnreadCount(): Promise<void> {
      const api = useApi()

      try {
        const response = await api.get<NotificationCountResponse>('/notifications/count')
        this.unreadCount = response.count
      } catch (error) {
        console.error('Fetch unread count error:', error)
      }
    },

    /**
     * Update notification preferences (bulk)
     * POST /api/v1/notifications/preferences
     */
    async updatePreferences(payload: UpdatePreferencesPayload): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        await api.post<NotificationPreferences>('/notifications/preferences', payload)
        
        // Update local preferences
        if (this.preferences) {
          this.preferences = {
            ...this.preferences,
            ...payload,
          }
        } else {
          this.preferences = {
            email: payload.email ?? true,
            sms: payload.sms ?? false,
            push: payload.push ?? true,
          }
        }

        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update preferences error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update channel/group preference
     * PUT /api/v1/notifications/preferences/{channel}/{group}
     */
    async updateChannelPreference(
      channel: NotificationChannel,
      group: string,
      enabled: boolean
    ): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: UpdateChannelPreferencePayload = { enabled }
        await api.put(`/notifications/preferences/${channel}/${group}`, payload)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Update channel preference error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Mark notification as read
     * POST /api/v1/notifications/{id}/read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
      const api = useApi()

      try {
        await api.post<MarkAsReadResponse>(`/notifications/${notificationId}/read`)
        
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification && !notification.read_at) {
          notification.read_at = new Date().toISOString()
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }

        return true
      } catch (error) {
        console.error('Mark as read error:', error)
        return false
      }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
      const unread = this.unreadNotifications
      for (const notification of unread) {
        await this.markAsRead(notification.id)
      }
    },

    /**
     * Archive notification
     * POST /api/v1/notifications/{id}/archive
     */
    async archiveNotification(notificationId: string): Promise<boolean> {
      const api = useApi()

      try {
        await api.post(`/notifications/${notificationId}/archive`)
        
        // Remove from local state if archived
        this.notifications = this.notifications.filter(n => n.id !== notificationId)
        
        // Update unread count if it was unread
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification && !notification.read_at) {
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }

        return true
      } catch (error) {
        console.error('Archive notification error:', error)
        return false
      }
    },

    /**
     * Unarchive notification
     * POST /api/v1/notifications/{id}/unarchive
     */
    async unarchiveNotification(notificationId: string): Promise<boolean> {
      const api = useApi()

      try {
        await api.post(`/notifications/${notificationId}/unarchive`)
        
        // Refresh notifications to get unarchived notification back
        await this.fetchNotifications(1, this.pagination.perPage, this.filter)

        return true
      } catch (error) {
        console.error('Unarchive notification error:', error)
        return false
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.notifications = []
      this.unreadCount = 0
      this.preferences = null
      this.loading = false
      this.error = null
      this.pagination = {
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0,
      }
    },
  },
})

