<script setup lang="ts">
/**
 * Notification preferences page
 * Allows users to configure notification preferences by channel and group
 */
import { ArrowLeft, Bell } from 'lucide-vue-next'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const localePath = useLocalePath()
const notificationsStore = shallowRef<ReturnType<typeof useNotificationsStore> | null>(null)

onMounted(async () => {
  const store = useNotificationsStore()
  notificationsStore.value = store
  await store.fetchPreferencesMatrix()
})

const preferencesMatrix = computed(() => notificationsStore.value?.preferencesMatrix ?? [])
const loading = computed(() => notificationsStore.value?.loading ?? false)
const error = computed(() => notificationsStore.value?.error ?? null)

async function handleToggle(channelValue: number, groupValue: number) {
  const store = notificationsStore.value
  if (!store) return

  await store.togglePreference(channelValue, groupValue)
}
</script>

<template>
  <div>
    <!-- Header with back link -->
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        :to="localePath('/profile/notifications')"
        class="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft class="h-5 w-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('profile.notificationsPreferences.title') }}</h1>
    </div>

    <p class="text-gray-600 dark:text-gray-400 mb-6">
      {{ $t('profile.notificationsPreferences.description') }}
    </p>

    <!-- Loading -->
    <div v-if="loading && preferencesMatrix.length === 0" class="space-y-6">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-900 rounded-lg p-6">
        <div class="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
        <div class="space-y-3">
          <div v-for="j in 4" :key="j" class="h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="preferencesMatrix.length === 0"
      :title="$t('profile.notificationsPreferences.noPreferencesAvailable')"
      :description="$t('profile.notificationsPreferences.notAvailable')"
      :icon="Bell"
    />

    <!-- Preferences matrix -->
    <div v-else class="space-y-6">
      <div
        v-for="channel in preferencesMatrix"
        :key="channel.value"
        class="bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
      >
        <!-- Channel header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">
              {{ channel.title }}
            </h2>
            <span
              v-if="!channel.contact_channel.is_linked"
              class="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            >
              {{ $t('profile.notificationsPreferences.notLinked') }}
            </span>
          </div>
        </div>

        <!-- Groups list -->
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="group in channel.groups"
            :key="group.value"
            class="px-6 py-4 flex items-center justify-between gap-4"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 dark:text-gray-100">
                {{ group.title }}
              </h3>
              <p v-if="group.description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {{ group.description }}
              </p>
            </div>

            <!-- Toggle switch -->
            <button
              type="button"
              role="switch"
              :aria-checked="group.enabled"
              :disabled="!channel.contact_channel.is_linked"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="group.enabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'"
              @click="handleToggle(channel.value, group.value)"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="group.enabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
