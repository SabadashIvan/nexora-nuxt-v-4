/**
 * System Store
 * Handles global system configuration: locales, currencies, settings
 */

import { defineStore } from 'pinia'
import type { SystemConfig, Locale, Currency, LanguagesResponse } from '~/types'
import { setToken, TOKEN_KEYS, getToken } from '~/utils/tokens'

interface SystemState {
  locales: Locale[]
  currencies: Currency[]
  currentLocale: string
  currentCurrency: string
  systemConfig: SystemConfig | null
  loading: boolean
  error: string | null
  initialized: boolean
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    locales: [],
    currencies: [],
    currentLocale: 'ru', // Must match nuxt.config.ts i18n.defaultLocale
    currentCurrency: 'USD',
    systemConfig: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    /**
     * Get current locale object
     */
    currentLocaleObject: (state): Locale | undefined => {
      return state.locales.find(l => l.code === state.currentLocale)
    },

    /**
     * Get current currency object
     */
    currentCurrencyObject: (state): Currency | undefined => {
      return state.currencies.find(c => c.code === state.currentCurrency)
    },

    /**
     * Get currency symbol
     */
    currencySymbol: (state): string => {
      const currency = state.currencies.find(c => c.code === state.currentCurrency)
      return currency?.symbol || state.currentCurrency
    },

    /**
     * Check if system is configured
     */
    isConfigured: (state): boolean => {
      return state.systemConfig !== null
    },
  },

  actions: {
    /**
     * Fetch active languages from API
     */
    async fetchLanguages() {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<LanguagesResponse>('/app/languages')
        
        this.locales = response.data

        // Don't set default locale from API - use config defaultLocale instead
        // Only set currentLocale if not already stored (use config default 'ru')
        const storedLocale = getToken(TOKEN_KEYS.LOCALE)
        if (!storedLocale) {
          // Use default locale from config (nuxt.config.ts i18n.defaultLocale)
          this.currentLocale = 'ru'
          setToken(TOKEN_KEYS.LOCALE, 'ru')
        }

        // Don't sync with i18n here - it may be called during SSR or before i18n is ready
        // Sync will happen in plugin after mount
      } catch (error) {
        this.error = 'Failed to load languages'
        console.error('Languages fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Sync locales with @nuxtjs/i18n module
     */
    async syncWithI18n() {
      if (import.meta.client) {
        try {
          // useI18n is auto-imported by @nuxtjs/i18n
          const i18n = useI18n()
          
          // Check if i18n is properly initialized
          if (!i18n || !i18n.locale || !this.currentLocale) {
            return
          }
          
          // Update i18n locale if current locale is set
          // Type assertion needed because i18n expects specific locale union type
          await i18n.setLocale(this.currentLocale as 'ru' | 'en' | 'uk' | 'awa')
        } catch (error) {
          // i18n might not be available yet, that's okay
          console.warn('Could not sync with i18n:', error)
        }
      }
    },

    /**
     * Fetch system configuration from API (without locales - they come from /app/languages)
     */
    async fetchSystemConfig() {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const config = await api.get<SystemConfig>('/system/config')
        
        this.systemConfig = config
        // Don't set locales here - they come from /app/languages
        this.currencies = config.currencies

        // Set default currency if not already set
        if (!this.currentCurrency && config.default_currency) {
          this.currentCurrency = config.default_currency
        }
      } catch (error) {
        this.error = 'Failed to load system configuration'
        console.error('System config error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Set current locale (state and cookie only)
     * Note: Locale is managed via cookie, which is automatically sent as Accept-Language header
     * No API call needed - backend reads locale from Accept-Language header
     * 
     * IMPORTANT: This method does NOT handle i18n navigation.
     * Components should handle i18n.setLocale() and navigation separately.
     * useI18n() can only be called at the top level of setup functions.
     */
    setLocale(locale: string) {
      // Only proceed if locale is different
      if (locale === this.currentLocale) {
        return
      }

      // Update store and cookie
      // Cookie will be automatically sent as Accept-Language header in all API requests
      this.currentLocale = locale
      setToken(TOKEN_KEYS.LOCALE, locale)

      // Trigger reactive updates across stores
      // Note: onLocaleChange is async but we don't await it here to keep method synchronous
      // Components can await it if needed
      this.onLocaleChange().catch(error => {
        console.error('Failed to trigger locale change updates:', error)
      })
    },

    /**
     * Set current currency
     * Note: Currency is managed via cookie, which is automatically sent as Accept-Currency header
     * No API call needed - backend reads currency from Accept-Currency header
     */
    async setCurrency(currency: string) {
      const previousCurrency = this.currentCurrency

      try {
        // Only proceed if currency is different
        if (currency === previousCurrency) {
          return
        }

        // Update store and cookie
        // Cookie will be automatically sent as Accept-Currency header in all API requests
        this.currentCurrency = currency
        setToken(TOKEN_KEYS.CURRENCY, currency)

        // Trigger reactive updates across stores
        // Currency change will be reflected in Accept-Currency header on next API request
        await this.onCurrencyChange()
      } catch (error) {
        // Rollback on failure
        this.currentCurrency = previousCurrency
        setToken(TOKEN_KEYS.CURRENCY, previousCurrency)
        console.error('Failed to set currency:', error)
        throw error
      }
    },

    /**
     * Handle locale change - reload locale-dependent data
     */
    async onLocaleChange() {
      // Reload SEO metadata
      const seoStore = useSeoStore()
      const route = useRoute()
      await seoStore.fetch(route.path)
      seoStore.apply()

      // Other stores can watch currentLocale and react accordingly
    },

    /**
     * Handle currency change - reload price-dependent data
     */
    async onCurrencyChange() {
      // Reload cart totals
      const cartStore = useCartStore()
      if (cartStore.cart) {
        await cartStore.loadCart()
      }

      // Other stores can watch currentCurrency and react accordingly
    },

    /**
     * Reset store state
     */
    reset() {
      this.locales = []
      this.currencies = []
      this.currentLocale = 'ru' // Must match nuxt.config.ts i18n.defaultLocale
      this.currentCurrency = 'USD'
      this.systemConfig = null
      this.loading = false
      this.error = null
      this.initialized = false
    },
  },
})

