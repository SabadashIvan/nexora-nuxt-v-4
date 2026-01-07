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

  // Step 2: Initialize languages and system config
  if (!systemStore.initialized) {
    try {
      // Fetch languages first (from /app/languages)
      if (systemStore.locales.length === 0) {
        await systemStore.fetchLanguages()
      }
      
      // Fetch system config (currencies, etc. - without locales)
      await systemStore.fetchSystemConfig()
      
      systemStore.initialized = true
    } catch (error) {
      console.error('Failed to initialize system config:', error)
    }
  }
  
  // Sync with i18n after app is mounted (defer to avoid initialization errors)
  // Use app:mounted hook to ensure i18n is fully initialized
  nuxtApp.hook('app:mounted', async () => {
    if (systemStore.initialized && systemStore.locales.length > 0) {
      try {
        // Add a small delay to ensure i18n module is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        await systemStore.syncWithI18n()
      } catch (error) {
        console.warn('Could not sync with i18n after mount:', error)
      }
    }
  })

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

