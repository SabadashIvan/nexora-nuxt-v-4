<script setup lang="ts">
/**
 * Cart page - CSR only (token dependent)
 * Works with new API format
 */
import { ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart.store'

definePageMeta({
  ssr: false,
})

// Locale-aware navigation
const localePath = useLocalePath()
const { t, locale: i18nLocale } = useI18n()

const cartStore = useCartStore()

// Load cart on mount if not already loaded (CSR only)
onMounted(async () => {
  // If cart is not loaded yet and we have a token, load it
  // Cart might already be loaded from init.client.ts
  if (!cartStore.cart && cartStore.cartToken) {
    await cartStore.loadCart()
  }
})

// Get warning for specific item
function getItemWarning(itemId: string) {
  return cartStore.warnings.find(w => w.item_id === itemId)
}

// Get item count label with proper pluralization
function getItemCountLabel(count: number): string {
  if (count === 1) {
    return t('cart.item')
  }
  // For Russian/Ukrainian: 2-4 use "few", 5+ use "many"
  const locale = i18nLocale.value
  if (locale === 'ru') {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return t('cart.itemsFew')
    }
  }
  return t('cart.items')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumbs -->
      <UiBreadcrumbs :items="[{ label: $t('cart.shoppingCart') }]" class="mb-6" />

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ $t('cart.shoppingCart') }}</h1>
        <span v-if="cartStore.itemCount > 0" class="text-sm text-gray-500 dark:text-gray-400">
          {{ cartStore.itemCount }} {{ getItemCountLabel(cartStore.itemCount) }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="cartStore.loading && !cartStore.cart" class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>

      <!-- Empty cart -->
      <UiEmptyState
        v-else-if="cartStore.isEmpty"
        :title="$t('cart.empty.title')"
        :description="$t('cart.empty.description')"
        :icon="ShoppingBag"
      >
        <template #action>
          <NuxtLink
            :to="localePath('/categories')"
            class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            {{ $t('cart.continueShopping') }}
          </NuxtLink>
        </template>
      </UiEmptyState>

      <!-- Cart content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Items -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Warnings banner -->
          <div 
            v-if="cartStore.hasWarnings" 
            class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium text-amber-800 dark:text-amber-200">
                {{ $t('cart.warnings.title') }}
              </h3>
              <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {{ $t('cart.warnings.description') }}
              </p>
            </div>
          </div>

          <!-- Cart items -->
          <CartItem 
            v-for="item in cartStore.items" 
            :key="item.id" 
            :item="item"
            :warning="getItemWarning(item.id)"
          />

          <!-- Continue shopping -->
          <NuxtLink 
            :to="localePath('/categories')" 
            class="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mt-4"
          >
            <ArrowLeft class="h-4 w-4" />
            {{ $t('cart.continueShopping') }}
          </NuxtLink>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-1">
          <div class="sticky top-4">
            <CartSummary 
              v-if="cartStore.totals" 
              :totals="cartStore.totals" 
              :coupons="cartStore.appliedCoupons"
              :promotions="cartStore.cart?.promotions || []"
            />
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div 
        v-if="cartStore.error" 
        class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300"
      >
        {{ cartStore.error }}
      </div>
    </div>
  </div>
</template>
