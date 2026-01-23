<script setup lang="ts">
/**
 * Notification Item Component
 * Displays a single notification with actions
 */
import { Check, Archive, RotateCcw } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'
import type { Notification, NotificationFilter } from '~/types'

const props = defineProps<{
  notification: Notification
  filter: NotificationFilter
}>()

const emit = defineEmits<{
  markRead: [id: string]
  archive: [id: string]
  restore: [id: string]
}>()

const isUnread = computed(() => props.notification.read_at === null)
const isArchiveFilter = computed(() => props.filter === 'archived')
</script>

<template>
  <div
    class="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-start gap-4"
    :class="{ 'ring-2 ring-indigo-500/20': isUnread }"
  >
    <!-- Unread indicator -->
    <div class="flex-shrink-0 mt-1">
      <div
        class="w-2.5 h-2.5 rounded-full"
        :class="isUnread ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'"
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

    <!-- Actions -->
    <div class="flex-shrink-0 flex items-center gap-1">
      <!-- Mark as read button (only for unread) -->
      <button
        v-if="isUnread"
        type="button"
        class="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
        :title="$t('profile.notifications.markAsRead')"
        @click="emit('markRead', notification.id)"
      >
        <Check class="h-5 w-5" />
      </button>

      <!-- Archive button (only when not in archived filter) -->
      <button
        v-if="!isArchiveFilter"
        type="button"
        class="p-2 text-gray-400 hover:text-amber-500 transition-colors"
        :title="$t('profile.notifications.archive')"
        @click="emit('archive', notification.id)"
      >
        <Archive class="h-5 w-5" />
      </button>

      <!-- Restore button (only in archived filter) -->
      <button
        v-if="isArchiveFilter"
        type="button"
        class="p-2 text-gray-400 hover:text-green-500 transition-colors"
        :title="$t('profile.notifications.restore')"
        @click="emit('restore', notification.id)"
      >
        <RotateCcw class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
