/**
 * Client-side initialization plugin
 * Initializes CSRF cookie, stores and loads essential data on app mount
 * 
 * IMPORTANT: CSRF cookie must be fetched on app init per documentation:
 * "Frontend MUST call GET /sanctum/csrf-cookie once on app init"
 * 
 * Note: useApi() also handles CSRF automatically:
 * - Auto-fetches CSRF if missing before mutation requests
 * - Auto-retries on 419 (CSRF mismatch) with fresh token
 */

import { useSystemStore } from '~/stores/system.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCartStore } from '~/stores/cart.store'

// Flag to prevent duplicate CSRF initialization
let _csrfInitialized = false

export default defineNuxtPlugin(async () => {
  // Capture Nuxt context to preserve it after await
  const nuxtApp = useNuxtApp()
  const api = useApi()
  const systemStore = useSystemStore()
  const authStore = useAuthStore()

  // Step 1: Fetch CSRF cookie first (required for all mutation requests)
  // This must happen before any other API calls that might mutate data
  // Only fetch once per page load to avoid unnecessary requests
  if (!_csrfInitialized) {
    try {
      await nuxtApp.runWithContext(async () => await api.fetchCsrfCookie())
      _csrfInitialized = true
    } catch (error) {
      // Log but continue - useApi() will auto-fetch CSRF if needed
      // and will auto-retry on 419 errors
      if (import.meta.dev) {
        console.warn('CSRF cookie fetch failed on init (will be retried on demand):', error)
      }
    }
  }

  // Step 2: Initialize system config (locales, currencies)
  if (!systemStore.initialized) {
    try {
      await systemStore.fetchSystemConfig()
      systemStore.initialized = true
    } catch (error) {
      console.error('Failed to initialize system config:', error)
    }
  }

  // Step 3: Try to restore auth from session cookie (Laravel Sanctum)
  try {
    await nuxtApp.runWithContext(async () => await authStore.initialize())
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }

  // Step 4: Restore cart from storage if token exists
  try {
    const cartStore = useCartStore()
    await nuxtApp.runWithContext(async () => await cartStore.initialize())
  } catch (error) {
    console.error('Failed to initialize cart:', error)
  }
})

