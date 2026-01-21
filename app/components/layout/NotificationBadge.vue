<script setup lang="ts">
/**
 * Notification Badge Component
 * Bell icon with unread count badge for header
 */
import { Bell } from 'lucide-vue-next'
import { useNotificationsStore } from '~/stores/notifications.store'
import { useAuthStore } from '~/stores/auth.store'

const localePath = useLocalePath()

// Computed to safely access stores
const unreadCount = computed(() => {
  try {
    return useNotificationsStore().unreadCount
  } catch {
    return 0
  }
})

const isAuthenticated = computed(() => {
  try {
    return useAuthStore().isAuthenticated
  } catch {
    return false
  }
})

const displayCount = computed(() => {
  if (unreadCount.value > 99) return '99+'
  return unreadCount.value
})

// Fetch unread count on mount (only for authenticated users)
onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await useNotificationsStore().fetchUnreadCount()
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }
})
</script>

<template>
  <NuxtLink
    v-if="isAuthenticated"
    :to="localePath('/profile/notifications')"
    class="group -m-2 flex items-center p-2 relative"
  >
    <Bell class="size-6 shrink-0 text-gray-400 group-hover:text-gray-500" />
    <span
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white"
    >
      {{ displayCount }}
    </span>
    <span class="sr-only">{{ $t('navigation.viewNotifications') }}</span>
  </NuxtLink>
</template>
