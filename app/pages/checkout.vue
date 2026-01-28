<script setup lang="ts">
/**
 * Single-page checkout - CSR only
 * All checkout fields visible on one page (no tabs/steps)
 * 
 * Layout (top to bottom):
 * 1. Order items
 * 2. Shipping address
 * 3. Shipping method
 * 4. Payment method
 * 5. Place order button
 */
import { Lock, AlertCircle, RefreshCw, Package, MapPin, Truck, CreditCard, ShoppingBag, Gift } from 'lucide-vue-next'
import type { Address } from '~/types'
import type { Settlement, Warehouse } from '~/types/shipping'
import { useCheckoutDelivery } from '~/composables/useCheckoutDelivery'
import { useCheckoutSession } from '~/composables/useCheckoutSession'
import { useCountries } from '~/composables/useCountries'
import SettlementSearch from '~/components/checkout/SettlementSearch.vue'
import WarehouseSelector from '~/components/checkout/WarehouseSelector.vue'

definePageMeta({
  layout: 'checkout',
  ssr: false,
})

const router = useRouter()
const { countries } = useCountries()
const checkoutSession = useCheckoutSession()
const checkoutDelivery = useCheckoutDelivery()
const getCartStore = () => useCartStore()
const checkoutStore = useCheckoutStore()
const authStore = useAuthStore()
const loyaltyStore = useLoyaltyStore()

// Local state
const shippingAddress = ref<Address>({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  country: '',
  region: '',
  city: '',
  postal: '',
  address_line_1: '',
  address_line_2: '',
})
const billingAddress = ref<Address | null>(null)
const billingSameAsShipping = ref(true)
const selectedShippingCode = ref<string | null>(null)
const selectedPaymentCode = ref<string>('monobank_installments')
const isProcessing = ref(false)
const addressErrors = ref<Record<string, string>>({})
const isInitialized = ref(false)
const selectedSettlement = ref<Settlement | null>(null)
const selectedWarehouse = ref<Warehouse | null>(null)
const loyaltyPointsInput = ref<string>('')
const isApplyingLoyalty = ref(false)

// Computed
const items = computed(() => checkoutSession.items.value)
const pricing = computed(() => checkoutSession.pricing.value)
const shippingMethods = computed(() => checkoutDelivery.shippingMethods.value)
const paymentProviders = computed(() => checkoutSession.paymentProviders.value)
const error = computed(() => checkoutSession.error.value)
const loading = computed(() => checkoutSession.loading.value || checkoutDelivery.deliveryLoading.value)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const availableLoyaltyPoints = computed(() => checkoutStore.availableLoyaltyPoints)
const loyaltyPointsApplied = computed(() => checkoutStore.loyaltyPointsApplied)
const canApplyLoyalty = computed(() => checkoutStore.canApplyLoyalty && isAuthenticated.value)

// Validation
const isAddressValid = computed(() => {
  const required = ['first_name', 'last_name', 'phone', 'country', 'region', 'city', 'postal', 'address_line_1']
  return required.every(field => !!shippingAddress.value[field as keyof Address])
})

const isShippingSelected = computed(() => selectedShippingCode.value !== null)
const shippingCurrency = computed(() => checkoutDelivery.shippingCurrency.value || pricing.value.currency)
const isPaymentSelected = computed(() => selectedPaymentCode.value !== null)

// Detect if selected method requires warehouse selection
const isWarehouseMethod = computed(() => {
  const method = selectedShippingMethod.value
  if (!method) return false
  const code = method.code.toLowerCase()
  const name = method.name.toLowerCase()
  const keywords = ['warehouse', 'pickup', 'postomat', 'branch', 'відділення', 'nova_post']
  return keywords.some(k => code.includes(k) || name.includes(k))
})

// Get provider code from method code (e.g., "nova_post_warehouse" -> "nova_post")
const selectedProviderCode = computed(() => {
  const method = selectedShippingMethod.value
  if (!method) return ''
  // If provider_code exists, use it; otherwise extract from code
  if (method.provider_code) return method.provider_code
  // Extract provider from method code (remove last segment)
  const parts = method.code.split('_')
  if (parts.length > 1) {
    return parts.slice(0, -1).join('_')
  }
  return method.code
})

const canPlaceOrder = computed(() => {
  const baseValid = isAddressValid.value && isShippingSelected.value && isPaymentSelected.value && !isProcessing.value

  // Warehouse methods require warehouse selection
  if (isWarehouseMethod.value) {
    return baseValid && selectedWarehouse.value !== null
  }

  return baseValid
})

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// Fetch shipping methods with address params (debounced)
const fetchShippingDebounced = debounce(async () => {
  const addr = shippingAddress.value
  if (addr.country && addr.city) {
    // Reset selected shipping when address changes
    selectedShippingCode.value = null
    
    await checkoutDelivery.fetchShippingMethods({
      country: addr.country,
      city: addr.city,
      region: addr.region || undefined,
      postal: addr.postal || undefined,
    })
  }
}, 500)

// Watch address fields and fetch shipping methods
watch(
  () => [
    shippingAddress.value.country,
    shippingAddress.value.city,
    shippingAddress.value.region,
    shippingAddress.value.postal,
  ],
  () => {
    if (isInitialized.value) {
      fetchShippingDebounced()
    }
  }
)

// Clear warehouse selection when shipping method changes
watch(selectedShippingCode, () => {
  selectedSettlement.value = null
  selectedWarehouse.value = null
})

// Initialize checkout on mount
onMounted(async () => {
  // Load cart first if not already loaded
  const cartStore = getCartStore()
  if (!cartStore.cart) {
    await cartStore.loadCart()
  }
  
  // Check if cart is empty
  if (cartStore.isEmpty) {
    const localePath = useLocalePath()
    router.push(localePath('/cart'))
    return
  }

  // Start checkout session
  await checkoutSession.startSession(billingSameAsShipping.value)
  
  // Pre-fill address if available from previous session or user profile
  if (checkoutSession.addresses.value.shipping) {
    shippingAddress.value = { ...checkoutSession.addresses.value.shipping }
  }
  if (checkoutSession.addresses.value.billing) {
    billingAddress.value = { ...checkoutSession.addresses.value.billing }
  }
  billingSameAsShipping.value = checkoutSession.addresses.value.billingSameAsShipping

  // Load payment providers
  await checkoutSession.fetchPaymentProviders()
  
  // Select default payment if available
  if (paymentProviders.value.some(p => p.code === 'monobank_installments')) {
    selectedPaymentCode.value = 'monobank_installments'
  } else if (paymentProviders.value.length > 0 && !paymentProviders.value.find(p => p.code === selectedPaymentCode.value)) {
    // If default not available, select first available
    const firstProvider = paymentProviders.value[0]
    if (firstProvider) {
      selectedPaymentCode.value = firstProvider.code
    }
  }
  
  // Load shipping methods if we have address
  if (shippingAddress.value.country && shippingAddress.value.city) {
    await checkoutDelivery.fetchShippingMethods({
      country: shippingAddress.value.country,
      city: shippingAddress.value.city,
      region: shippingAddress.value.region || undefined,
      postal: shippingAddress.value.postal || undefined,
    })
  }

  isInitialized.value = true

  // Fetch available loyalty points if user is authenticated
  if (authStore.isAuthenticated) {
    try {
      await loyaltyStore.fetchLoyaltyAccount()
      // Convert balance from currency string (e.g., "$100.00") to minor units
      const balanceValue = loyaltyStore.balanceValue || 0
      const balanceMinor = Math.floor(balanceValue * 100) // Convert to minor units
      checkoutStore.setAvailableLoyaltyPoints(balanceMinor > 0 ? balanceMinor : null)
    } catch (err) {
      console.error('Failed to fetch loyalty points:', err)
    }
  }
})

// Validate address
function validateAddress(): boolean {
  const required = ['first_name', 'last_name', 'phone', 'country', 'region', 'city', 'postal', 'address_line_1']
  addressErrors.value = {}
  
  for (const field of required) {
    if (!shippingAddress.value[field as keyof Address]) {
      addressErrors.value[field] = 'This field is required'
    }
  }
  
  return Object.keys(addressErrors.value).length === 0
}

// Select shipping method
function selectShipping(methodCode: string) {
  selectedShippingCode.value = methodCode
}

// Get selected shipping method object
const selectedShippingMethod = computed(() => {
  if (!selectedShippingCode.value) return null
  return shippingMethods.value.find(m => m.code === selectedShippingCode.value) || null
})

// Select payment provider
function selectPayment(code: string) {
  selectedPaymentCode.value = code
}

// Apply loyalty points
async function applyLoyaltyPoints() {
  if (!loyaltyPointsInput.value) return
  
  const points = parseInt(loyaltyPointsInput.value)
  if (isNaN(points) || points <= 0) {
    return
  }

  // Convert to minor units (assuming input is in major units, e.g., 1 = 100 minor)
  const pointsMinor = points * 100

  isApplyingLoyalty.value = true
  try {
    await checkoutStore.applyLoyaltyPoints(pointsMinor)
    loyaltyPointsInput.value = ''
  } catch (err) {
    console.error('Apply loyalty points error:', err)
  } finally {
    isApplyingLoyalty.value = false
  }
}

// Remove loyalty points
async function removeLoyaltyPoints() {
  isApplyingLoyalty.value = true
  try {
    await checkoutStore.removeLoyaltyPoints()
  } catch (err) {
    console.error('Remove loyalty points error:', err)
  } finally {
    isApplyingLoyalty.value = false
  }
}

// Place order - sequential API calls
async function placeOrder() {
  if (!validateAddress()) return
  if (!selectedShippingCode.value || !selectedPaymentCode.value) return

  isProcessing.value = true

  try {
    // Step 1: Save address
    const addressSuccess = await checkoutSession.applyAddress(
      shippingAddress.value,
      billingSameAsShipping.value ? undefined : billingAddress.value || undefined,
      billingSameAsShipping.value
    )
    if (!addressSuccess) {
      isProcessing.value = false
      return
    }

    // Step 2: Save shipping method with warehouse metadata if applicable
    const method = selectedShippingMethod.value
    const providerMetadata = isWarehouseMethod.value && selectedWarehouse.value
      ? {
          warehouse_external_id: selectedWarehouse.value.external_id,
          settlement_external_id: selectedSettlement.value?.external_id,
        }
      : undefined

    const shippingSuccess = await checkoutSession.applyShippingMethod(
      selectedShippingCode.value,
      method?.quote_id,
      providerMetadata
    )
    if (!shippingSuccess) {
      isProcessing.value = false
      return
    }

    // Step 3: Save payment provider
    const paymentSuccess = await checkoutSession.applyPaymentProvider(selectedPaymentCode.value)
    if (!paymentSuccess) {
      isProcessing.value = false
      return
    }

    // Step 4: Apply loyalty points if any were entered (optional, authenticated users only)
    if (isAuthenticated.value && loyaltyPointsApplied.value) {
      // Loyalty points are already applied via applyLoyaltyPoints() function
      // No need to re-apply here, they're already in the checkout session
    }

    // Step 5: Confirm checkout and create order
    const orderId = await checkoutSession.confirmCheckout()
    if (!orderId) {
      isProcessing.value = false
      return
    }

    // Step 6: Initialize payment (for online payments)
    const paymentResult = await checkoutSession.initializePayment(orderId)

    if (paymentResult?.payment_url) {
      // Online payment - redirect to payment gateway
      window.location.href = paymentResult.payment_url
      return
    }

    // Offline payment or no payment init needed - redirect to order page
    const localePath = useLocalePath()
    router.push(localePath(`/profile/order/${orderId}`))
  } catch (err) {
    console.error('Place order error:', err)
  } finally {
    isProcessing.value = false
  }
}

// Format price helper
function formatPrice(minor: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(minor / 100)
}
</script>

<template>
  <div class="min-h-screen bg-white py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete your order</p>
      </div>

      <!-- Loading -->
      <div v-if="!isInitialized" class="flex items-center justify-center py-24">
        <UiSpinner size="lg" />
      </div>

      <template v-else>
        <!-- Error message -->
        <div 
          v-if="error" 
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-red-700 dark:text-red-400 font-medium">{{ error }}</p>
              <button
                v-if="error.includes('cart') || error.includes('session')"
                class="mt-2 inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                :disabled="isProcessing"
                @click="checkoutSession.restartSession()"
              >
                <RefreshCw class="h-4 w-4" />
                Restart checkout
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Section 1: Order Items -->
          <section class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Package class="h-5 w-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Order Items</h2>
              <span class="ml-auto text-sm text-gray-500 dark:text-gray-400">
                {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
              </span>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="item in items"
                :key="item.id"
                class="px-6 py-4 flex items-center gap-4"
              >
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag class="h-6 w-6 text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ item.name ?? item.sku }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Qty: {{ item.qty }}
                  </p>
                </div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ formatPrice(item.line_total_minor, pricing.currency) }}
                </p>
              </div>
            </div>
            <!-- Totals -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span class="text-gray-900 dark:text-gray-100">{{ formatPrice(pricing.items, pricing.currency) }}</span>
              </div>
              <div v-if="pricing.shipping > 0" class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Shipping</span>
                <span class="text-gray-900 dark:text-gray-100">{{ formatPrice(pricing.shipping, pricing.currency) }}</span>
              </div>
              <div v-if="pricing.discounts > 0" class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Discounts</span>
                <span class="text-green-600 dark:text-green-400">-{{ formatPrice(pricing.discounts, pricing.currency) }}</span>
              </div>
              <template v-if="pricing.promotions?.length">
                <div
                  v-for="promo in pricing.promotions"
                  :key="promo.promotion_id"
                  class="flex justify-between text-sm pl-2 text-gray-500 dark:text-gray-500"
                >
                  <span>{{ promo.name }}</span>
                  <span class="text-green-600 dark:text-green-400">-{{ formatPrice(promo.value, pricing.currency) }}</span>
                </div>
              </template>
              <div v-if="(pricing.loyalty_points_minor ?? 0) > 0" class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Loyalty points</span>
                <span class="text-green-600 dark:text-green-400">-{{ formatPrice(pricing.loyalty_points_minor!, pricing.currency) }}</span>
              </div>
              <div class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-900 dark:text-gray-100">Total</span>
                <span class="text-gray-900 dark:text-gray-100">{{ formatPrice(pricing.total, pricing.currency) }}</span>
              </div>
            </div>
          </section>

          <!-- Section 2: Shipping Address -->
          <section class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <MapPin class="h-5 w-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Shipping Address</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- First Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    v-model="shippingAddress.first_name"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.first_name }"
                  >
                  <p v-if="addressErrors.first_name" class="mt-1 text-xs text-red-500">{{ addressErrors.first_name }}</p>
                </div>

                <!-- Last Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    v-model="shippingAddress.last_name"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.last_name }"
                  >
                  <p v-if="addressErrors.last_name" class="mt-1 text-xs text-red-500">{{ addressErrors.last_name }}</p>
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    v-model="shippingAddress.phone"
                    type="tel"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.phone }"
                  >
                  <p v-if="addressErrors.phone" class="mt-1 text-xs text-red-500">{{ addressErrors.phone }}</p>
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    v-model="shippingAddress.email"
                    type="email"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                </div>

                <!-- Country -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country *
                  </label>
                  <select
                    v-model="shippingAddress.country"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.country }"
                  >
                    <option value="">Select country</option>
                    <option v-for="country in countries" :key="country.code" :value="country.code">
                      {{ country.name }}
                    </option>
                  </select>
                  <p v-if="addressErrors.country" class="mt-1 text-xs text-red-500">{{ addressErrors.country }}</p>
                </div>

                <!-- Region -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region/State *
                  </label>
                  <input
                    v-model="shippingAddress.region"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.region }"
                  >
                  <p v-if="addressErrors.region" class="mt-1 text-xs text-red-500">{{ addressErrors.region }}</p>
                </div>

                <!-- City -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    v-model="shippingAddress.city"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.city }"
                  >
                  <p v-if="addressErrors.city" class="mt-1 text-xs text-red-500">{{ addressErrors.city }}</p>
                </div>

                <!-- Postal Code -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal Code *
                  </label>
                  <input
                    v-model="shippingAddress.postal"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.postal }"
                  >
                  <p v-if="addressErrors.postal" class="mt-1 text-xs text-red-500">{{ addressErrors.postal }}</p>
                </div>

                <!-- Address Line 1 -->
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address *
                  </label>
                  <input
                    v-model="shippingAddress.address_line_1"
                    type="text"
                    placeholder="Street address"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    :class="{ 'border-red-500': addressErrors.address_line_1 }"
                  >
                  <p v-if="addressErrors.address_line_1" class="mt-1 text-xs text-red-500">{{ addressErrors.address_line_1 }}</p>
                </div>

                <!-- Address Line 2 -->
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apartment, suite, etc.
                  </label>
                  <input
                    v-model="shippingAddress.address_line_2"
                    type="text"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                </div>
              </div>

              <!-- Billing same as shipping -->
              <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="billingSameAsShipping"
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  >
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    Billing address same as shipping
                  </span>
                </label>
              </div>
            </div>
          </section>

          <!-- Section 3: Shipping Method -->
          <section class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Truck class="h-5 w-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Shipping Method</h2>
            </div>
            <div class="p-6">
              <div v-if="loading && !shippingMethods.length" class="flex items-center justify-center py-8">
                <UiSpinner size="md" />
              </div>
              <div v-else-if="shippingMethods.length" class="space-y-3">
                <label
                  v-for="method in shippingMethods"
                  :key="method.code"
                  class="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                  :class="[
                    selectedShippingCode === method.code 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  <input
                    v-model="selectedShippingCode"
                    type="radio"
                    :value="method.code"
                    class="text-indigo-600 focus:ring-indigo-500"
                    @change="selectShipping(method.code)"
                  >
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ method.name }}</p>
                    <p v-if="method.eta" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ method.eta }}
                    </p>
                    <p v-if="method.source" class="text-xs text-gray-400 dark:text-gray-500">
                      {{ method.source }}
                    </p>
                  </div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ formatPrice(method.price_minor, shippingCurrency) }}
                  </p>
                </label>
              </div>
              <p v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
                No shipping methods available
              </p>

              <!-- Warehouse Selection (for warehouse-based methods) -->
              <div v-if="selectedShippingCode && isWarehouseMethod" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <!-- Settlement/City Search -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select City *
                  </label>
                  <SettlementSearch
                    v-model="selectedSettlement"
                    :provider-code="selectedProviderCode"
                    placeholder="Search for your city..."
                  />
                </div>

                <!-- Warehouse Selector -->
                <div v-if="selectedSettlement">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Pickup Point *
                  </label>
                  <WarehouseSelector
                    v-model="selectedWarehouse"
                    :provider-code="selectedProviderCode"
                    :method-code="selectedShippingCode"
                    :city-external-id="selectedSettlement.external_id"
                    :checkout-session-id="checkoutSession.checkoutId.value || ''"
                  />
                </div>

                <!-- Selected Warehouse Summary -->
                <div v-if="selectedWarehouse" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div class="flex items-start gap-3">
                    <MapPin class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p class="font-medium text-green-800 dark:text-green-200">{{ selectedWarehouse.name }}</p>
                      <p class="text-sm text-green-600 dark:text-green-400">{{ selectedWarehouse.address }}</p>
                      <p v-if="selectedWarehouse.schedule" class="text-xs text-green-500 dark:text-green-500 mt-1">
                        {{ selectedWarehouse.schedule }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 4: Payment Method -->
          <section class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <CreditCard class="h-5 w-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Method</h2>
            </div>
            <div class="p-6">
              <div v-if="loading && !paymentProviders.length" class="flex items-center justify-center py-8">
                <UiSpinner size="md" />
              </div>
              <div v-else-if="paymentProviders.length" class="space-y-3">
                <label
                  v-for="provider in paymentProviders"
                  :key="provider.code"
                  class="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                  :class="[
                    selectedPaymentCode === provider.code 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  ]"
                >
                  <input
                    v-model="selectedPaymentCode"
                    type="radio"
                    :value="provider.code"
                    class="text-indigo-600 focus:ring-indigo-500"
                    @change="selectPayment(provider.code)"
                  >
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ provider.name }}</p>
                    <p v-if="provider.instructions" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ provider.instructions }}
                    </p>
                  </div>
                  <span 
                    class="text-xs px-2 py-1 rounded-full"
                    :class="[
                      provider.type === 'online' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    ]"
                  >
                    {{ provider.type === 'online' ? 'Online' : 'Offline' }}
                  </span>
                </label>
              </div>
              <p v-else class="text-gray-500 dark:text-gray-400 text-center py-4">
                No payment methods available
              </p>
            </div>
          </section>

          <!-- Section 5: Loyalty Points (Authenticated Users Only) -->
          <section 
            v-if="isAuthenticated && canApplyLoyalty" 
            class="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Gift class="h-5 w-5 text-gray-400" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Loyalty Points</h2>
            </div>
            <div class="p-6">
              <div v-if="availableLoyaltyPoints !== null" class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Available Points</span>
                  <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ (availableLoyaltyPoints / 100).toFixed(2) }}
                  </span>
                </div>

                <div v-if="!loyaltyPointsApplied" class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Points to Apply
                  </label>
                  <div class="flex gap-3">
                    <input
                      v-model="loyaltyPointsInput"
                      type="number"
                      :min="0"
                      :max="availableLoyaltyPoints ? (availableLoyaltyPoints / 100) : 0"
                      step="0.01"
                      placeholder="0.00"
                      class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                    <button
                      type="button"
                      :disabled="!loyaltyPointsInput || isApplyingLoyalty || loading"
                      class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="applyLoyaltyPoints"
                    >
                      <UiSpinner v-if="isApplyingLoyalty" size="sm" />
                      <span v-else>Apply</span>
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Maximum: {{ availableLoyaltyPoints ? (availableLoyaltyPoints / 100).toFixed(2) : '0.00' }} points
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <div class="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div>
                      <p class="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        Applied Points
                      </p>
                      <p class="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                        {{ (loyaltyPointsApplied / 100).toFixed(2) }} points
                      </p>
                    </div>
                    <button
                      type="button"
                      :disabled="isApplyingLoyalty || loading"
                      class="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                      @click="removeLoyaltyPoints"
                    >
                      <UiSpinner v-if="isApplyingLoyalty" size="sm" />
                      <span v-else>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Loading loyalty points...
              </div>
            </div>
          </section>

          <!-- Place Order Button -->
          <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <button
              class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canPlaceOrder"
              @click="placeOrder"
            >
              <UiSpinner v-if="isProcessing" size="sm" />
              <Lock v-else class="h-5 w-5" />
              <span>Place Order</span>
            </button>

            <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>

            <!-- Validation hints -->
            <div v-if="!canPlaceOrder && !isProcessing" class="mt-4 text-sm text-amber-600 dark:text-amber-400">
              <p v-if="!isAddressValid">• Please fill in all required address fields</p>
              <p v-if="!isShippingSelected">• Please select a shipping method</p>
              <p v-if="isWarehouseMethod && !selectedWarehouse">• Please select a pickup location</p>
              <p v-if="!isPaymentSelected">• Please select a payment method</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
