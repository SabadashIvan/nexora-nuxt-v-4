<script setup lang="ts">
/**
 * Profile settings page
 */
import { Github } from 'lucide-vue-next'
import { useUserSession } from '#auth-utils'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const authStore = shallowRef<ReturnType<typeof useAuthStore> | null>(null)
const linkingProvider = ref<string | null>(null)
const oauthPollTimer = ref<ReturnType<typeof setInterval> | null>(null)

const { openInPopup } = useUserSession()

onMounted(() => {
  authStore.value = useAuthStore()
})

const linkedProviders = computed(() => {
  const user = authStore.value?.user
  return {
    github: !!user?.githubId,
    google: !!user?.googleId,
  }
})

async function handleLink(provider: 'github' | 'google') {
  if (linkingProvider.value) return
  const store = useAuthStore()
  const existingUser = store.user

  try {
    store.setLinking()
    linkingProvider.value = provider
    openInPopup(`/auth/${provider}`)
    startOAuthPolling()
  } catch (error) {
    console.error('OAuth linking failed:', error)
  } finally {
    linkingProvider.value = null
    if (store.state === 'linking' && existingUser) {
      store.setAuthenticated(existingUser)
    }
  }
}

function startOAuthPolling() {
  const store = useAuthStore()
  let attempts = 0
  if (oauthPollTimer.value) {
    clearInterval(oauthPollTimer.value)
  }
  oauthPollTimer.value = setInterval(async () => {
    attempts += 1
    await store.syncUserSession()
    if (store.user?.githubId || store.user?.googleId || store.state === 'auth' || attempts >= 12) {
      if (oauthPollTimer.value) {
        clearInterval(oauthPollTimer.value)
        oauthPollTimer.value = null
      }
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (oauthPollTimer.value) {
    clearInterval(oauthPollTimer.value)
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Account settings</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Manage your connected accounts and authentication methods.
      </p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Linked accounts</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Link OAuth providers to sign in faster next time.
      </p>

      <div class="mt-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <Github class="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">GitHub</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ linkedProviders.github ? 'Linked' : 'Not linked' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="linkedProviders.github || linkingProvider === 'github'"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleLink('github')"
          >
            <UiSpinner v-if="linkingProvider === 'github'" size="sm" class="mr-2" />
            {{ linkedProviders.github ? 'Linked' : 'Link GitHub' }}
          </button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <span class="h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              G
            </span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Google</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ linkedProviders.google ? 'Linked' : 'Not linked' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="linkedProviders.google || linkingProvider === 'google'"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleLink('google')"
          >
            <UiSpinner v-if="linkingProvider === 'google'" size="sm" class="mr-2" />
            {{ linkedProviders.google ? 'Linked' : 'Link Google' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
