/**
 * Shipping Search Composable
 * 
 * Client-side composable for shipping search (settlements/warehouses)
 * Uses debounced queries and calls Nitro endpoint (not direct provider API)
 * 
 * Features:
 * - Debounced search (client-side, not server)
 * - Cancellation support (latest query wins)
 * - Stable useAsyncData key
 */

import { ref, computed, watch } from 'vue'
import { useDebouncedRef } from './useDebounce'

// Nuxt auto-imports: useAsyncData, useApi
// These are available globally in Nuxt but TypeScript may need explicit reference

export interface ShippingSearchItem {
  label: string
  value: string
  meta?: Record<string, unknown>
}

export interface ShippingSearchParams {
  provider: string
  type: 'settlements' | 'warehouses'
  q?: string
  cityId?: string
}

export function useShippingSearch() {
  const query = ref('')
  const cityId = ref<string | undefined>(undefined)
  const provider = ref<string>('') // Should come from runtimeConfig or site config
  const type = ref<'settlements' | 'warehouses'>('settlements')

  // Debounced query (300ms delay)
  const debouncedQuery = useDebouncedRef(query, 300)

  // Search results
  const { data: results, pending, error, refresh } = useAsyncData(
    'shipping-search',
    async () => {
      if (!provider.value || !type.value) {
        return { items: [] }
      }

      if (debouncedQuery.value && debouncedQuery.value.length < 2) {
        return { items: [] }
      }

      const params: Record<string, string | number | boolean | string[] | undefined> = {
        provider: provider.value,
        type: type.value,
      }

      if (debouncedQuery.value) {
        params.q = debouncedQuery.value
      }

      if (cityId.value) {
        params.cityId = cityId.value
      }

      // Call Nitro endpoint (not direct provider API)
      const api = useApi()
      const response = await api.get<{ items: ShippingSearchItem[] }>('/api/shipping/search', params, {
        raw: true, // Skip /api/v1 prefix
      })
      return response
    },
    {
      // Watch debounced query and cityId
      watch: [debouncedQuery, cityId, provider, type],
    }
  )

  // Watch for query changes and refresh
  watch([debouncedQuery, cityId, provider, type], () => {
    refresh()
  })

  return {
    // State
    query,
    cityId,
    provider,
    type,
    results: computed(() => {
      const data = results.value as { items: ShippingSearchItem[] } | null | undefined
      return data?.items || []
    }),
    pending,
    error,

    // Methods
    setProvider: (p: string) => { provider.value = p },
    setType: (t: 'settlements' | 'warehouses') => { type.value = t },
    setCityId: (id: string | undefined) => { cityId.value = id },
    clear: () => {
      query.value = ''
      cityId.value = undefined
    },
  }
}
