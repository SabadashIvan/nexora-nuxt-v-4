<script setup lang="ts">
/**
 * Currency Switcher Component
 * Displays current currency and allows switching between available currencies
 */

import { ChevronDown } from 'lucide-vue-next'
import { useSystemStore } from '~/stores/system.store'

const isOpen = ref(false)
const systemStore = useSystemStore()

// Access stores inside computed properties (lazy evaluation)
const currentCurrency = computed(() => {
  try {
    return systemStore.currentCurrency || 'USD'
  } catch {
    return 'USD'
  }
})

const availableCurrencies = computed(() => {
  try {
    return systemStore.currencies || []
  } catch {
    return []
  }
})

// Use store getter for current currency object (similar to LanguageSwitcher)
// If currency object not found, use fallback with symbol from store getter
const currentCurrencyObject = computed(() => {
  const currencyObj = systemStore.currentCurrencyObject
  if (currencyObj) {
    return currencyObj
  }
  
  // Fallback: use currency symbol from store getter (which has proper symbol mapping)
  return {
    code: currentCurrency.value,
    symbol: systemStore.currencySymbol,
    name: currentCurrency.value,
  }
})

// Close dropdown when clicking outside (similar to LanguageSwitcher - no loading in onMounted)
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-currency-switcher]')) {
        isOpen.value = false
      }
    })
  }
})

async function switchCurrency(currencyCode: string) {
  if (currencyCode === currentCurrency.value) {
    isOpen.value = false
    return
  }

  try {
    // Update store (updates state and cookie)
    // Cookie will be automatically sent as Accept-Currency header in all API requests
    await systemStore.setCurrency(currencyCode)

    // Currency change will trigger onCurrencyChange() which reloads cart totals
    isOpen.value = false
  } catch (error) {
    console.error('Failed to switch currency:', error)
    isOpen.value = false
  }
}
</script>

<template>
  <div class="relative" data-currency-switcher>
    <button
      type="button"
      class="flex items-center text-gray-700 hover:text-gray-800 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span class="block text-sm font-medium">{{ currentCurrencyObject.symbol }} {{ currentCurrencyObject.code }}</span>
      <ChevronDown
        class="ml-1 h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
      <span class="sr-only">, change currency</span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <button
          v-for="currency in availableCurrencies"
          :key="currency.code"
          type="button"
          class="block w-full px-4 py-2 text-left text-sm transition-colors"
          :class="
            currency.code === currentCurrency
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          "
          @click="switchCurrency(currency.code)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span>{{ currency.symbol }}</span>
              <span>{{ currency.name }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ currency.code }}</span>
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

