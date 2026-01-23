<script setup lang="ts">
/**
 * User notifications page with filtering
 * Supports archive/restore functionality
 */
import { Bell, Check, Settings } from 'lucide-vue-next'
import type { NotificationFilter } from '~/types'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const localePath = useLocalePath()
const { t } = useI18n()
const notificationsStore = shallowRef<ReturnType<typeof useNotificationsStore> | null>(null)

const filters: { value: NotificationFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'profile.notifications.all' },
  { value: 'unread', labelKey: 'profile.notifications.unread' },
  { value: 'archived', labelKey: 'profile.notifications.archived' },
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

async function handleArchive(notificationId: string) {
  const store = notificationsStore.value
  if (!store) return

  await store.archiveNotification(notificationId)
}

async function handleRestore(notificationId: string) {
  const store = notificationsStore.value
  if (!store) return

  await store.restoreNotification(notificationId)
}

async function handleLoadMore() {
  const store = notificationsStore.value
  if (!store) return

  await store.loadMore()
}

// Empty state messages based on filter
const emptyTitle = computed(() => {
  switch (currentFilter.value) {
    case 'unread': return t('profile.notifications.noUnread')
    case 'archived': return t('profile.notifications.noArchived')
    default: return t('profile.notifications.noNotifications')
  }
})

const emptyDescription = computed(() => {
  switch (currentFilter.value) {
    case 'unread': return t('profile.notifications.emptyUnreadDesc')
    case 'archived': return t('profile.notifications.emptyArchivedDesc')
    default: return t('profile.notifications.emptyAllDesc')
  }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('profile.notifications.title') }}</h1>
      <NuxtLink
        :to="localePath('/profile/notifications-preferences')"
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Settings class="h-4 w-4" />
        {{ $t('profile.notifications.preferences') }}
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
        {{ $t(filter.labelKey) }}
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
        {{ $t('profile.notifications.markAllAsRead') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && notifications.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>

    <!-- Notifications list -->
    <div v-else-if="notifications.length" class="space-y-3">
      <ProfileNotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        :filter="currentFilter"
        @mark-read="handleMarkAsRead"
        @archive="handleArchive"
        @restore="handleRestore"
      />

      <!-- Load more button -->
      <button
        v-if="hasMorePages"
        type="button"
        class="w-full py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        :disabled="loading"
        @click="handleLoadMore"
      >
        {{ loading ? $t('common.messages.loading') : $t('common.buttons.loadMore') }}
      </button>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      :title="emptyTitle"
      :description="emptyDescription"
      :icon="Bell"
    />
  </div>
</template>
