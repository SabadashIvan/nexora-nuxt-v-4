/**
 * System Store
 * Handles global system configuration: locales, currencies, settings
 */

import { defineStore } from 'pinia'
import type { Locale, Currency, LanguagesResponse, CurrenciesResponse, SiteContacts, SiteContactsResponse, SiteLocation, SiteLocationsResponse } from '~/types'
import { applySeoMetadata, fetchSeoMetadata } from '~/composables/useSeoMetadata'
import { setToken, TOKEN_KEYS, getToken } from '~/utils/tokens'
import { getCurrencySymbol } from '~/utils/price'

interface SystemState {
  locales: Locale[]
  currencies: Currency[]
  currentLocale: string
  currentCurrency: string
  contacts: SiteContacts | null
  locations: SiteLocation[]
  locationsLoading: boolean
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
    contacts: null,
    locations: [],
    locationsLoading: false,
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
     * Uses symbol from loaded currencies, or falls back to utility function
     */
    currencySymbol: (state): string => {
      const currency = state.currencies.find(c => c.code === state.currentCurrency)
      if (currency?.symbol) {
        return currency.symbol
      }
      // Fallback to utility function for symbol mapping
      return getCurrencySymbol(state.currentCurrency)
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
     * Fetch currencies from API
     */
    async fetchCurrencies() {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const response = await api.get<CurrenciesResponse>('/app/currencies')
        
        // Map API response to internal Currency format
        // precision → decimal_places
        // Generate name from code (e.g., "USD" → "US Dollar")
        const currencyNameMap: Record<string, string> = {
          USD: 'US Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          UAH: 'Ukrainian Hryvnia',
          RUB: 'Russian Ruble',
          PLN: 'Polish Zloty',
          JPY: 'Japanese Yen',
          CNY: 'Chinese Yuan',
          KRW: 'South Korean Won',
          INR: 'Indian Rupee',
          BRL: 'Brazilian Real',
          CAD: 'Canadian Dollar',
          AUD: 'Australian Dollar',
        }

        this.currencies = response.data.map((currency) => ({
          code: currency.code,
          symbol: currency.symbol,
          decimal_places: currency.precision,
          name: currencyNameMap[currency.code] || currency.code,
          is_default: currency.is_default,
        }))

        // Sync current currency - similar to how fetchLanguages() handles locale
        // Don't set default currency from API if already stored
        // Only set currentCurrency if not already stored (use API default)
        const storedCurrency = getToken(TOKEN_KEYS.CURRENCY)
        if (!storedCurrency && response.meta.default) {
          // Set default currency from API if not stored
          this.currentCurrency = response.meta.default
          setToken(TOKEN_KEYS.CURRENCY, response.meta.default)
        }
        // If storedCurrency exists, it's already set in middleware or store initialization
      } catch (error) {
        this.error = 'Failed to load currencies'
        console.error('Currencies fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch site contacts from API
     * GET /api/v1/site/contacts
     */
    async fetchContacts() {
      const api = useApi()

      try {
        const response = await api.get<SiteContactsResponse | SiteContacts>('/site/contacts')
        // Handle both wrapped and unwrapped response
        this.contacts = 'data' in response ? response.data : response
      } catch (error) {
        console.error('Contacts fetch error:', error)
        // Don't set error - contacts are optional
      }
    },

    /**
     * Fetch site locations from API
     * GET /api/v1/site/locations
     */
    async fetchLocations(): Promise<SiteLocation[]> {
      const api = useApi()
      this.locationsLoading = true

      try {
        const response = await api.get<SiteLocationsResponse | SiteLocation[]>('/site/locations')
        // Handle both wrapped and unwrapped response
        this.locations = Array.isArray(response) ? response : (response?.data ?? [])
        return this.locations
      } catch (error) {
        console.error('Locations fetch error:', error)
        // Don't set error - locations are optional
        this.locations = []
        return []
      } finally {
        this.locationsLoading = false
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
      const route = useRoute()
      const config = useRuntimeConfig()
      const siteUrl = config.public.siteUrl as string || 'http://localhost:3000'
      const fullUrl = `${siteUrl}${route.fullPath}`
      const meta = await fetchSeoMetadata(fullUrl)
      applySeoMetadata(meta, route.fullPath)

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
      this.locations = []
      this.locationsLoading = false
      this.loading = false
      this.error = null
      this.initialized = false
    },
  },
})
