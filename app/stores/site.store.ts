/**
 * Site Store
 * Handles site-wide data like contacts, configuration
 * SSR-safe with caching to avoid per-navigation churn
 */

import { defineStore } from 'pinia'
import { getErrorMessage } from '~/utils/errors'

export interface SiteContact {
  id: number
  type: 'phone' | 'email' | 'address' | 'social'
  label: string
  value: string
  icon?: string
  order: number
}

export interface SiteContactsResponse {
  data: SiteContact[]
}

interface SiteState {
  contacts: SiteContact[]
  contactsLoading: boolean
  contactsError: string | null
  contactsLastFetched: number | null // Timestamp for TTL cache
}

const CONTACTS_TTL = 5 * 60 * 1000 // 5 minutes

export const useSiteStore = defineStore('site', {
  state: (): SiteState => ({
    contacts: [],
    contactsLoading: false,
    contactsError: null,
    contactsLastFetched: null,
  }),

  getters: {
    /**
     * Check if contacts are cached and still valid
     */
    isContactsCacheValid: (state): boolean => {
      if (!state.contactsLastFetched || state.contacts.length === 0) {
        return false
      }
      const age = Date.now() - state.contactsLastFetched
      return age < CONTACTS_TTL
    },

    /**
     * Get contacts by type
     */
    contactsByType: (state) => (type: SiteContact['type']) => {
      return state.contacts.filter(c => c.type === type)
    },
  },

  actions: {
    /**
     * Fetch site contacts
     * GET /api/v1/site/contacts
     * Uses TTL cache to avoid per-navigation SSR churn
     */
    async fetchContacts(force = false): Promise<void> {
      // Check cache first
      if (!force && this.isContactsCacheValid) {
        return
      }

      const api = useApi()
      this.contactsLoading = true
      this.contactsError = null

      try {
        // TODO: Verify endpoint exists in API
        // Expected: GET /api/v1/site/contacts
        const response = await api.get<SiteContactsResponse>('/site/contacts')
        this.contacts = response.data || []
        this.contactsLastFetched = Date.now()
      } catch (error) {
        this.contactsError = getErrorMessage(error)
        console.error('Fetch site contacts error:', error)
        // Don't throw - graceful fallback (contacts are not critical)
      } finally {
        this.contactsLoading = false
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.contacts = []
      this.contactsLoading = false
      this.contactsError = null
      this.contactsLastFetched = null
    },
  },
})
