/**
 * Shipping search composable
 * Handles settlement and warehouse search for shipping providers
 */

import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import type {
  Settlement,
  Warehouse,
  SettlementsSearchResponse,
  WarehousesSearchResponse,
  SettlementSearchParams,
  WarehouseSearchParams,
} from '~/types/shipping'
import { getErrorMessage } from '~/utils/errors'

export function useShippingSearch() {
  const api = useApi()

  // State
  const settlements = ref<Settlement[]>([])
  const warehouses = ref<Warehouse[]>([])
  const settlementsLoading = ref(false)
  const warehousesLoading = ref(false)
  const settlementsError = ref<string | null>(null)
  const warehousesError = ref<string | null>(null)

  // Computed
  const loading = computed(() => settlementsLoading.value || warehousesLoading.value)
  const error = computed(() => settlementsError.value || warehousesError.value)

  /**
   * Search for settlements/cities
   * @param params - Search parameters
   * @returns Array of settlements or empty array on error
   */
  async function searchSettlements(params: SettlementSearchParams): Promise<Settlement[]> {
    const { provider_code, city_name, limit = 20, page = 1 } = params

    if (!city_name || city_name.length < 2) {
      settlements.value = []
      return []
    }

    settlementsLoading.value = true
    settlementsError.value = null

    try {
      const query: Record<string, string | number> = {
        city_name,
        limit,
        page,
      }

      const response = await api.get<SettlementsSearchResponse | Settlement[]>(
        `/shipping/${provider_code}/settlements/search`,
        query
      )

      // Handle both wrapped and unwrapped response formats
      const data = Array.isArray(response) ? response : (response?.data ?? [])
      settlements.value = data

      return data
    } catch (err) {
      settlementsError.value = getErrorMessage(err)
      settlements.value = []
      console.error('Settlement search error:', err)
      return []
    } finally {
      settlementsLoading.value = false
    }
  }

  /**
   * Search for warehouses/pickup points
   * @param params - Search parameters including checkout session ID
   * @returns Array of warehouses or empty array on error
   */
  async function searchWarehouses(params: WarehouseSearchParams): Promise<Warehouse[]> {
    const {
      provider_code,
      method_code,
      city_external_id,
      checkout_session_id,
      search,
      limit = 50,
      page = 1,
    } = params

    if (!city_external_id || !checkout_session_id) {
      warehouses.value = []
      return []
    }

    warehousesLoading.value = true
    warehousesError.value = null

    try {
      const query: Record<string, string | number> = {
        method_code,
        city_external_id,
        checkout_session_id,
        limit,
        page,
      }

      if (search) {
        query.search = search
      }

      const response = await api.get<WarehousesSearchResponse | Warehouse[]>(
        `/shipping/${provider_code}/warehouses/search`,
        query
      )

      // Handle both wrapped and unwrapped response formats
      const data = Array.isArray(response) ? response : (response?.data ?? [])
      warehouses.value = data

      return data
    } catch (err) {
      warehousesError.value = getErrorMessage(err)
      warehouses.value = []
      console.error('Warehouse search error:', err)
      return []
    } finally {
      warehousesLoading.value = false
    }
  }

  /**
   * Clear settlements search results
   */
  function clearSettlements(): void {
    settlements.value = []
    settlementsError.value = null
  }

  /**
   * Clear warehouses search results
   */
  function clearWarehouses(): void {
    warehouses.value = []
    warehousesError.value = null
  }

  /**
   * Reset all state
   */
  function reset(): void {
    clearSettlements()
    clearWarehouses()
    settlementsLoading.value = false
    warehousesLoading.value = false
  }

  return {
    // State
    settlements,
    warehouses,
    settlementsLoading,
    warehousesLoading,
    settlementsError,
    warehousesError,

    // Computed
    loading,
    error,

    // Actions
    searchSettlements,
    searchWarehouses,
    clearSettlements,
    clearWarehouses,
    reset,
  }
}
