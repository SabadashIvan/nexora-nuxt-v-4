<script setup lang="ts">
/**
 * Warehouse/Pickup point selector component
 * Used in checkout for selecting warehouse delivery location
 */
import { ref, watch, computed } from 'vue'
import { MapPin, Clock, Check, Search, Package, CreditCard, Loader2 } from 'lucide-vue-next'
import { useShippingSearch } from '~/composables/useShippingSearch'
import type { Warehouse } from '~/types/shipping'

interface Props {
  /** Shipping provider code */
  providerCode: string
  /** Shipping method code */
  methodCode: string
  /** Selected settlement external ID */
  cityExternalId: string
  /** Checkout session ID */
  checkoutSessionId: string
  /** Selected warehouse */
  modelValue: Warehouse | null
  /** Disable the selector */
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [warehouse: Warehouse | null]
}>()

const { warehouses, warehousesLoading, warehousesError, searchWarehouses, clearWarehouses } = useShippingSearch()

// Local state
const searchQuery = ref('')

// Filtered warehouses based on search
const filteredWarehouses = computed(() => {
  if (!searchQuery.value) {
    return warehouses.value
  }
  const query = searchQuery.value.toLowerCase()
  return warehouses.value.filter(
    (w) =>
      w.name.toLowerCase().includes(query) ||
      w.address.toLowerCase().includes(query)
  )
})

// Load warehouses when city changes
watch(
  () => props.cityExternalId,
  async (cityId) => {
    // Always clear the selected warehouse when city changes
    // The old warehouse is no longer valid for the new city
    emit('update:modelValue', null)

    if (!cityId) {
      clearWarehouses()
      return
    }

    await searchWarehouses({
      provider_code: props.providerCode,
      method_code: props.methodCode,
      city_external_id: cityId,
      checkout_session_id: props.checkoutSessionId,
    })
  },
  { immediate: true }
)

// Select a warehouse
function selectWarehouse(warehouse: Warehouse): void {
  emit('update:modelValue', warehouse)
}

// Check if warehouse is selected
function isSelected(warehouse: Warehouse): boolean {
  return props.modelValue?.external_id === warehouse.external_id
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search input -->
    <div v-if="warehouses.length > 5" class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search class="h-5 w-5 text-gray-400" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search warehouses..."
        :disabled="disabled"
        class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-sm"
      >
    </div>

    <!-- Loading state -->
    <div v-if="warehousesLoading" class="flex items-center justify-center py-8">
      <Loader2 class="h-8 w-8 text-indigo-500 animate-spin" />
    </div>

    <!-- Error state -->
    <div v-else-if="warehousesError" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p class="text-red-600 dark:text-red-400 text-sm">{{ warehousesError }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="warehouses.length === 0 && cityExternalId" class="text-center py-8">
      <Package class="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <p class="text-gray-500 dark:text-gray-400">No warehouses available in this city</p>
    </div>

    <!-- No results from search -->
    <div v-else-if="filteredWarehouses.length === 0 && searchQuery" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No warehouses matching "{{ searchQuery }}"</p>
    </div>

    <!-- Warehouses list -->
    <div v-else class="space-y-2 max-h-80 overflow-y-auto">
      <button
        v-for="warehouse in filteredWarehouses"
        :key="warehouse.external_id"
        type="button"
        :disabled="disabled"
        class="w-full p-4 rounded-lg border-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          isSelected(warehouse)
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        ]"
        @click="selectWarehouse(warehouse)"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            :class="[
              isSelected(warehouse)
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
            ]"
          >
            <MapPin class="h-5 w-5" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h4 class="font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ warehouse.name }}
              </h4>
              <!-- Check mark -->
              <div
                v-if="isSelected(warehouse)"
                class="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <Check class="h-4 w-4 text-white" />
              </div>
            </div>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ warehouse.address }}
            </p>

            <!-- Additional info -->
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="warehouse.schedule" class="flex items-center gap-1">
                <Clock class="h-3.5 w-3.5" />
                {{ warehouse.schedule }}
              </span>
              <span v-if="warehouse.supports_payment" class="flex items-center gap-1">
                <CreditCard class="h-3.5 w-3.5" />
                Cash on delivery
              </span>
              <span v-if="warehouse.max_weight_kg" class="flex items-center gap-1">
                <Package class="h-3.5 w-3.5" />
                Up to {{ warehouse.max_weight_kg }} kg
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
