/**
 * Client-side initialization plugin
 * Initializes stores and loads essential data on app mount
 */

import { useSystemStore } from '~/stores/system.store'
import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtPlugin(async (nuxtApp) => {
  const pinia = nuxtApp.$pinia

  if (!pinia) {
    console.error('Pinia instance is not available during client init')
    return
  }

  const systemStore = useSystemStore(pinia)
  const authStore = useAuthStore(pinia)

  // Initialize system config (locales, currencies)
  if (!systemStore.initialized) {
    try {
      await systemStore.fetchSystemConfig()
      systemStore.initialized = true
    } catch (error) {
      console.error('Failed to initialize system config:', error)
    }
  }

  // Try to restore auth from session cookie (Laravel Sanctum)
  try {
    await authStore.initialize()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
})

