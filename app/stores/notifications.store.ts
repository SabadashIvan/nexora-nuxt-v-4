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
  NotificationFilter,
  NotificationChannelDetail,
  NotificationPreferencesMatrixResponse,
} from '~/types'
import { getErrorMessage } from '~/utils/errors'

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: [],
    unreadCount: 0,
    preferences: null,
    preferencesMatrix: [],
    currentFilter: 'all',
    loading: false,
    error: null,
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
     * Set current filter
     */
    setFilter(filter: NotificationFilter): void {
      this.currentFilter = filter
    },

    /**
     * Fetch notifications list
     * GET /api/v1/notifications
     * @param page - Page number
     * @param perPage - Items per page
     * @param filter - Filter type (all, unread, archived)
     */
    async fetchNotifications(page = 1, perPage = 15, filter?: NotificationFilter): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      // Use provided filter or current filter from state
      const activeFilter = filter ?? this.currentFilter

      try {
        const query: Record<string, string | number> = {
          page,
          per_page: perPage,
        }

        // Add filter parameter if not 'all'
        if (activeFilter && activeFilter !== 'all') {
          query.filter = activeFilter
        }

        const response = await api.get<NotificationsListResponse>('/notifications', query)

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

        // Update current filter if provided
        if (filter) {
          this.currentFilter = filter
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
      await this.fetchNotifications(this.pagination.currentPage + 1, this.pagination.perPage, this.currentFilter)
    },

    /**
     * Fetch preferences matrix
     * GET /api/v1/notifications/preferences
     */
    async fetchPreferencesMatrix(): Promise<void> {
      const api = useApi()
      this.loading = true

      try {
        const response = await api.get<NotificationPreferencesMatrixResponse | NotificationChannelDetail[]>('/notifications/preferences')
        // Handle both wrapped and unwrapped response
        this.preferencesMatrix = Array.isArray(response) ? response : (response?.data ?? [])
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch preferences matrix error:', error)
        this.preferencesMatrix = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle preference for a channel/group combination
     * PUT /api/v1/notifications/preferences/{channel}/{group}
     */
    async togglePreference(channelValue: number, groupValue: number): Promise<boolean> {
      const api = useApi()

      // Find current state
      const channel = this.preferencesMatrix.find(c => c.value === channelValue)
      if (!channel) return false

      const group = channel.groups.find(g => g.value === groupValue)
      if (!group) return false

      const newEnabled = !group.enabled

      try {
        await api.put(`/notifications/preferences/${channelValue}/${groupValue}`, {
          enabled: newEnabled,
        })

        // Update local state optimistically
        group.enabled = newEnabled
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Toggle preference error:', error)
        return false
      }
    },

    /**
     * Fetch unread notifications count
     * GET /api/v1/notifications/count
     */
    async fetchUnreadCount(): Promise<void> {
      const api = useApi()

      try {
        const response = await api.get<NotificationCountResponse | { data: { unread_count: number } }>('/notifications/count')
        // Handle both response formats: { count } or { data: { unread_count } }
        if ('data' in response && response.data && 'unread_count' in response.data) {
          this.unreadCount = response.data.unread_count
        } else if ('count' in response) {
          this.unreadCount = (response as NotificationCountResponse).count
        }
      } catch (error) {
        console.error('Fetch unread count error:', error)
      }
    },

    /**
     * Archive a notification
     * PUT /api/v1/notifications/{id}/archive
     */
    async archiveNotification(notificationId: string): Promise<boolean> {
      const api = useApi()

      try {
        await api.put(`/notifications/${notificationId}/archive`)

        // Remove from current notifications list
        this.notifications = this.notifications.filter(n => n.id !== notificationId)

        return true
      } catch (error) {
        console.error('Archive notification error:', error)
        return false
      }
    },

    /**
     * Restore an archived notification
     * PUT /api/v1/notifications/{id}/restore
     */
    async restoreNotification(notificationId: string): Promise<boolean> {
      const api = useApi()

      try {
        await api.put(`/notifications/${notificationId}/restore`)

        // Refetch notifications to get updated list
        await this.fetchNotifications(1, this.pagination.perPage, this.currentFilter)

        return true
      } catch (error) {
        console.error('Restore notification error:', error)
        return false
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
     * Reset store state
     */
    reset(): void {
      this.notifications = []
      this.unreadCount = 0
      this.preferences = null
      this.preferencesMatrix = []
      this.currentFilter = 'all'
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

