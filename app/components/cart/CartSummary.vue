<script setup lang="ts">
/**
 * Cart summary component
 * Works with new API format (items_minor, discounts_minor, grand_total_minor)
 */
import { Tag } from 'lucide-vue-next'
import type { CartTotals, AppliedCoupon, CartPromotion } from '~/types'
import { useCartStore } from '~/stores/cart.store'
import { formatPrice as formatPriceUtil } from '~/types/cart'

interface Props {
  totals: CartTotals
  coupons?: AppliedCoupon[]
  promotions?: CartPromotion[]
  showCheckout?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  coupons: () => [],
  promotions: () => [],
  showCheckout: true,
})

const cartStore = useCartStore()

const couponCode = ref('')
const isApplyingCoupon = ref(false)
const couponError = ref('')

// Get currency and locale from cart context
const currency = computed(() => cartStore.cart?.context.currency || 'USD')
const locale = computed(() => cartStore.cart?.context.locale || 'en')

// Format prices using cart context
const formattedSubtotal = computed(() => 
  formatPriceUtil(props.totals.items_minor, currency.value, locale.value)
)

const formattedShipping = computed(() => {
  if (!props.totals.shipping_minor) return null
  return formatPriceUtil(props.totals.shipping_minor, currency.value, locale.value)
})

const formattedDiscounts = computed(() => {
  if (!props.totals.discounts_minor) return null
  return formatPriceUtil(props.totals.discounts_minor, currency.value, locale.value)
})

const formattedTotal = computed(() => 
  formatPriceUtil(props.totals.grand_total_minor, currency.value, locale.value)
)

async function applyCoupon() {
  if (!couponCode.value.trim()) return
  
  isApplyingCoupon.value = true
  couponError.value = ''
  
  const success = await cartStore.applyCoupon(couponCode.value.trim())
  
  if (success) {
    couponCode.value = ''
  } else {
    couponError.value = cartStore.error || 'Invalid coupon code'
  }
  
  isApplyingCoupon.value = false
}

async function removeCoupon(code: string) {
  await cartStore.removeCoupon(code)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h2>

    <!-- Coupon input -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Promo Code
      </label>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Tag class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            v-model="couponCode"
            type="text"
            placeholder="Enter code"
            class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none border-0"
            @keyup.enter="applyCoupon"
          >
        </div>
        <button
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          :disabled="isApplyingCoupon || !couponCode.trim()"
          @click="applyCoupon"
        >
          Apply
        </button>
      </div>
      <p v-if="couponError" class="mt-1 text-sm text-red-500">{{ couponError }}</p>
    </div>

    <!-- Applied promotions (from cart) -->
    <div v-if="promotions && Array.isArray(promotions) && promotions.length > 0" class="mb-4 space-y-2">
      <div 
        v-for="promo in promotions" 
        :key="promo.id"
        class="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <Tag class="h-4 w-4 text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">
            {{ promo.code || promo.description }}
          </span>
        </div>
        <span class="text-sm text-green-600 dark:text-green-400">
          -{{ formatPriceUtil(promo.discount_minor, currency, locale) }}
        </span>
      </div>
    </div>

    <!-- Applied coupons (legacy) -->
    <div v-if="coupons.length > 0" class="mb-4 space-y-2">
      <div 
        v-for="coupon in coupons" 
        :key="coupon.code"
        class="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <Tag class="h-4 w-4 text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">{{ coupon.code }}</span>
        </div>
        <button
          class="text-sm text-green-600 dark:text-green-400 hover:underline"
          @click="removeCoupon(coupon.code)"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- Totals -->
    <div class="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formattedSubtotal }}</span>
      </div>
      
      <div v-if="formattedShipping" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Shipping</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formattedShipping }}</span>
      </div>
      
      <div v-if="formattedDiscounts" class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Discounts</span>
        <span class="text-green-600 dark:text-green-400 font-medium">
          -{{ formattedDiscounts }}
        </span>
      </div>
      
      <div class="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
        <span class="font-semibold text-gray-900 dark:text-gray-100">Total</span>
        <span class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ formattedTotal }}</span>
      </div>
    </div>

    <!-- Checkout button -->
    <NuxtLink
      v-if="showCheckout"
      to="/checkout"
      class="mt-6 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
    >
      Proceed to Checkout
    </NuxtLink>
  </div>
</template>
