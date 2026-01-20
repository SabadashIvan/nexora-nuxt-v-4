<script setup lang="ts">
/**
 * User notifications page with filtering
 */
import { Bell, Check, Settings } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'
import type { NotificationFilter } from '~/types'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const localePath = useLocalePath()
const notificationsStore = shallowRef<ReturnType<typeof useNotificationsStore> | null>(null)

const filters: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
]

onMounted(async () => {
  const store = useNotificationsStore()
  notificationsStore.value = store
  await Promise.all([
    store.fetchNotifications(),
    store.fetchUnreadCount(),
  ])
})

const notifications = computed(() => notificationsStore.value?.notifications ?? [])
const loading = computed(() => notificationsStore.value?.loading ?? false)
const currentFilter = computed(() => notificationsStore.value?.currentFilter ?? 'all')
const unreadCount = computed(() => notificationsStore.value?.unreadCount ?? 0)
const hasMorePages = computed(() => notificationsStore.value?.hasMorePages ?? false)

async function handleFilterChange(filter: NotificationFilter) {
  const store = notificationsStore.value
  if (!store) return

  store.setFilter(filter)
  await store.fetchNotifications(1, 15, filter)
}

async function handleMarkAsRead(notificationId: string) {
  const store = notificationsStore.value
  if (!store) return

  await store.markAsRead(notificationId)
}

async function handleMarkAllAsRead() {
  const store = notificationsStore.value
  if (!store) return

  await store.markAllAsRead()
}

async function handleLoadMore() {
  const store = notificationsStore.value
  if (!store) return

  await store.loadMore()
}

function isUnread(notification: { read_at: string | null }): boolean {
  return notification.read_at === null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
      <NuxtLink
        :to="localePath('/profile/notifications-preferences')"
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Settings class="h-4 w-4" />
        Preferences
      </NuxtLink>
    </div>

    <!-- Filter tabs -->
    <div class="mb-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-800">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="pb-3 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="[
          currentFilter === filter.value
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
        @click="handleFilterChange(filter.value)"
      >
        {{ filter.label }}
        <span
          v-if="filter.value === 'unread' && unreadCount > 0"
          class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        >
          {{ unreadCount }}
        </span>
      </button>

      <!-- Mark all as read button -->
      <button
        v-if="unreadCount > 0"
        type="button"
        class="ml-auto pb-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
        @click="handleMarkAllAsRead"
      >
        <Check class="h-4 w-4" />
        Mark all as read
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && notifications.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>

    <!-- Notifications list -->
    <div v-else-if="notifications.length" class="space-y-3">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-start gap-4"
        :class="{ 'ring-2 ring-indigo-500/20': isUnread(notification) }"
      >
        <!-- Unread indicator -->
        <div class="flex-shrink-0 mt-1">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :class="isUnread(notification) ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-gray-900 dark:text-gray-100">
            {{ notification.title }}
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ notification.message }}
          </p>
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {{ formatDate(notification.created_at) }}
          </p>
        </div>

        <!-- Mark as read button -->
        <button
          v-if="isUnread(notification)"
          type="button"
          class="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-500 transition-colors"
          title="Mark as read"
          @click="handleMarkAsRead(notification.id)"
        >
          <Check class="h-5 w-5" />
        </button>
      </div>

      <!-- Load more button -->
      <button
        v-if="hasMorePages"
        type="button"
        class="w-full py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        :disabled="loading"
        @click="handleLoadMore"
      >
        {{ loading ? 'Loading...' : 'Load more' }}
      </button>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      title="No notifications"
      :description="currentFilter === 'unread' ? 'You have no unread notifications' : 'You have no notifications yet'"
      :icon="Bell"
    />
  </div>
</template>
