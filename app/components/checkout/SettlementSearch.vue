<script setup lang="ts">
/**
 * Settlement/City search autocomplete component
 * Used in checkout for warehouse-based shipping methods
 */
import { ref, watch } from 'vue'
import { MapPin, Search, X, Loader2 } from 'lucide-vue-next'
import { useShippingSearch } from '~/composables/useShippingSearch'
import type { Settlement } from '~/types/shipping'

interface Props {
  /** Shipping provider code */
  providerCode: string
  /** Selected settlement */
  modelValue: Settlement | null
  /** Placeholder text */
  placeholder?: string
  /** Disable the input */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for city...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [settlement: Settlement | null]
}>()

const { settlements, settlementsLoading, searchSettlements, clearSettlements } = useShippingSearch()

// Local state
const query = ref('')
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch for query changes and search
watch(query, (newQuery) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (newQuery.length < 2) {
    clearSettlements()
    return
  }

  debounceTimer = setTimeout(async () => {
    await searchSettlements({
      provider_code: props.providerCode,
      city_name: newQuery,
    })
    isOpen.value = true
  }, 300)
})

// Select a settlement
function selectSettlement(settlement: Settlement): void {
  emit('update:modelValue', settlement)
  query.value = settlement.name
  isOpen.value = false
  clearSettlements()
}

// Clear selection
function clearSelection(): void {
  emit('update:modelValue', null)
  query.value = ''
  clearSettlements()
  inputRef.value?.focus()
}

// Handle input focus
function onFocus(): void {
  if (settlements.value.length > 0) {
    isOpen.value = true
  }
}

// Handle input blur
function onBlur(): void {
  // Delay closing to allow click on dropdown
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

// Keep query in sync with model value
watch(
  () => props.modelValue,
  (settlement) => {
    // Always mirror the model value to keep UI in sync
    // When modelValue is cleared or changed, query should reflect that
    query.value = settlement?.name ?? ''
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative">
    <!-- Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Loader2 v-if="settlementsLoading" class="h-5 w-5 text-gray-400 animate-spin" />
        <Search v-else class="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
        @focus="onFocus"
        @blur="onBlur"
      >
      <button
        v-if="modelValue"
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="clearSelection"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen && settlements.length > 0"
        class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
      >
        <ul class="py-1">
          <li
            v-for="settlement in settlements"
            :key="settlement.external_id"
            class="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3"
            @mousedown.prevent="selectSettlement(settlement)"
          >
            <MapPin class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ settlement.name }}
              </p>
              <p v-if="settlement.region" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ settlement.region }}
                <span v-if="settlement.postal_index">, {{ settlement.postal_index }}</span>
              </p>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- No results message -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && query.length >= 2 && !settlementsLoading && settlements.length === 0"
        class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center"
      >
        <p class="text-gray-500 dark:text-gray-400">No cities found for "{{ query }}"</p>
      </div>
    </Transition>
  </div>
</template>
