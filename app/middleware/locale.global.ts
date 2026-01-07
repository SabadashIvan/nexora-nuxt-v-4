/**
 * Global locale middleware
 * Loads language and currency from cookies on SSR
 * Sets defaults if not present - store initialization handled by plugins
 */

import { getToken, TOKEN_KEYS, setToken } from '~/utils/tokens'
import { getActivePinia } from 'pinia'

// Default values - must match nuxt.config.ts i18n.defaultLocale
const DEFAULT_LOCALE = 'ru'
const DEFAULT_CURRENCY = 'USD'

export default defineNuxtRouteMiddleware(async () => {
  // Get stored preferences
  const storedLocale = getToken(TOKEN_KEYS.LOCALE)
  const storedCurrency = getToken(TOKEN_KEYS.CURRENCY)

  // Set defaults if not stored - only on client to avoid cookie issues during SSR/SWR
  // During SSR, we'll read from cookies but not write (to avoid header issues)
  if (import.meta.client) {
    if (!storedLocale) {
      setToken(TOKEN_KEYS.LOCALE, DEFAULT_LOCALE)
    }
    if (!storedCurrency) {
      setToken(TOKEN_KEYS.CURRENCY, DEFAULT_CURRENCY)
    }
  }

  // Only try to access store if Pinia is initialized
  const pinia = getActivePinia()
  if (!pinia) {
    // Pinia not available yet - plugin will handle initialization
    return
  }

  // Try to initialize store if Pinia is available
  try {
    const { useSystemStore } = await import('~/stores/system.store')
    const systemStore = useSystemStore()
    
    // Only run initialization once
    if (!systemStore.initialized) {
      // Initialize system store with stored values or defaults
      systemStore.currentLocale = storedLocale || DEFAULT_LOCALE
      systemStore.currentCurrency = storedCurrency || DEFAULT_CURRENCY

      // Fetch languages from API on first load (SSR)
      if (systemStore.locales.length === 0) {
        try {
          await systemStore.fetchLanguages()
        } catch (error) {
          console.error('Failed to fetch languages:', error)
        }
      }

      // Fetch system config (without locales) on first load (SSR)
      if (!systemStore.systemConfig && import.meta.server) {
        try {
          await systemStore.fetchSystemConfig()
        } catch (error) {
          console.error('Failed to fetch system config:', error)
        }
      }

      // Don't sync with i18n in middleware - it's too early
      // i18n sync will happen in plugin or component after mount

      systemStore.initialized = true
    }
    // Don't sync i18n in middleware - it runs too early in the lifecycle
  } catch (error) {
    // Store access failed - plugin will handle initialization
    console.warn('Could not initialize system store in middleware:', error)
  }
})

