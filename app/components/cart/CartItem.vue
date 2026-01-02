<script setup lang="ts">
/**
 * Cart item component
 * Works with new API format (qty, price.effective_minor, line_total_minor)
 */
import { Trash2, AlertTriangle } from 'lucide-vue-next'
import type { CartItem, CartWarning } from '~/types'
import { useCartStore } from '~/stores/cart.store'
import { formatPrice as formatPriceUtil } from '~/types/cart'

interface Props {
  item: CartItem
  /** Optional warning for this item (e.g., stock issue) */
  warning?: CartWarning
}

const props = defineProps<Props>()

const cartStore = useCartStore()

const isUpdating = ref(false)
const isRemoving = ref(false)

// Local quantity for immediate UI updates
const localQty = ref(props.item.qty)

// Watch for external changes (e.g., after API response)
watch(() => props.item.qty, (newVal) => {
  localQty.value = newVal
})

// Get currency from cart context
const currency = computed(() => cartStore.cart?.context.currency || 'USD')
const locale = computed(() => cartStore.cart?.context.locale || 'en')

// Format prices
const formattedEffectivePrice = computed(() => 
  formatPriceUtil(props.item.price.effective_minor, currency.value, locale.value)
)

const formattedListPrice = computed(() => 
  formatPriceUtil(props.item.price.list_minor, currency.value, locale.value)
)

const formattedLineTotal = computed(() => 
  formatPriceUtil(props.item.line_total_minor, currency.value, locale.value)
)

// Check if item has discount
const hasDiscount = computed(() => 
  props.item.price.effective_minor < props.item.price.list_minor
)

// Check if item has stock warning
const hasStockWarning = computed(() => 
  props.warning?.code === 'INSUFFICIENT_STOCK'
)

async function updateQuantity(newQty: number) {
  if (newQty === props.item.qty || newQty < 1) return
  
  isUpdating.value = true
  await cartStore.updateItemQuantity(props.item.id, newQty)
  isUpdating.value = false
}

async function removeItem() {
  isRemoving.value = true
  await cartStore.removeItem(props.item.id)
  isRemoving.value = false
}

// Debounced quantity update
let updateTimeout: ReturnType<typeof setTimeout> | null = null

function onQuantityChange(newQty: number) {
  localQty.value = newQty
  
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  updateTimeout = setTimeout(() => {
    if (newQty !== props.item.qty && newQty >= 1) {
      updateQuantity(newQty)
    }
  }, 500)
}
</script>

<template>
  <div 
    class="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
    :class="{ 
      'opacity-50': isRemoving,
      'border-amber-300 dark:border-amber-700': hasStockWarning
    }"
  >
    <!-- Placeholder image (API doesn't return images) -->
    <div class="flex-shrink-0">
      <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span class="text-xs text-gray-400 text-center px-2">{{ item.sku }}</span>
      </div>
    </div>

    <!-- Details -->
    <div class="flex-1 min-w-0">
      <!-- SKU as title (API doesn't return product name) -->
      <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">
        Product #{{ item.variant_id }}
      </h3>
      
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">SKU: {{ item.sku }}</p>

      <!-- Stock warning -->
      <div 
        v-if="hasStockWarning && warning" 
        class="mt-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
      >
        <AlertTriangle class="h-4 w-4 flex-shrink-0" />
        <span class="text-sm">
          Only {{ warning.available }} available in stock
        </span>
      </div>

      <!-- Options -->
      <div v-if="item.options.length > 0" class="mt-2 flex flex-wrap gap-2">
        <span 
          v-for="option in item.options" 
          :key="option.name"
          class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
        >
          {{ option.name }}: {{ option.value }}
        </span>
      </div>

      <!-- Price for mobile -->
      <div class="mt-2 sm:hidden">
        <span class="font-bold text-gray-900 dark:text-gray-100">
          {{ formattedEffectivePrice }}
        </span>
        <span v-if="hasDiscount" class="ml-2 text-sm text-gray-500 line-through">
          {{ formattedListPrice }}
        </span>
      </div>
    </div>

    <!-- Price for desktop -->
    <div class="hidden sm:block text-right flex-shrink-0">
      <span class="font-bold text-gray-900 dark:text-gray-100">
        {{ formattedEffectivePrice }}
      </span>
      <div v-if="hasDiscount" class="text-sm text-gray-500 line-through">
        {{ formattedListPrice }}
      </div>
    </div>

    <!-- Quantity -->
    <div class="flex-shrink-0">
      <UiQuantitySelector
        :model-value="localQty"
        :max="99"
        :disabled="isUpdating || isRemoving"
        size="sm"
        @update:model-value="onQuantityChange"
      />
    </div>

    <!-- Line total -->
    <div class="hidden sm:block w-24 text-right flex-shrink-0">
      <span class="font-bold text-gray-900 dark:text-gray-100">
        {{ formattedLineTotal }}
      </span>
    </div>

    <!-- Remove button -->
    <button
      class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      :disabled="isRemoving"
      aria-label="Remove item"
      @click="removeItem"
    >
      <Trash2 class="h-5 w-5" />
    </button>
  </div>
</template>
