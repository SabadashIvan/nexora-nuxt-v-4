<script setup lang="ts">
/**
 * Quick Buy Modal Component
 * Modal form for quick buy/callback requests
 * Uses leads store for submission
 */
import { X, Phone, Loader2 } from 'lucide-vue-next'
import { useLeadsStore } from '~/stores/leads.store'
import { useSystemStore } from '~/stores/system.store'

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Get i18n for translations
const { t } = useI18n()

interface ProductInfo {
  variantId: number
  title: string
  price?: string
}

const props = defineProps<{
  isOpen: boolean
  product: ProductInfo
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

function getLeadsStore() {
  return useLeadsStore()
}

function getSystemStore() {
  return useSystemStore()
}

// Form state
const form = reactive({
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  comment: '',
})

// Form validation
const isNameValid = computed(() => form.customer_name.trim().length >= 2)
const isPhoneValid = computed(() => {
  const phone = form.customer_phone.replace(/\D/g, '')
  return phone.length >= 10
})
const isFormValid = computed(() => isNameValid.value && isPhoneValid.value)

// Store state
const loading = computed(() => getLeadsStore().loading)
const success = computed(() => getLeadsStore().success)
const error = computed(() => getLeadsStore().error)
const fieldErrors = computed(() => getLeadsStore().fieldErrors)
const isRateLimited = computed(() => getLeadsStore().isRateLimited)
const retryAfter = computed(() => getLeadsStore().retryAfter)

// Methods
function close() {
  emit('update:isOpen', false)
  // Reset form after animation
  setTimeout(() => {
    resetForm()
  }, 200)
}

function resetForm() {
  form.customer_name = ''
  form.customer_phone = ''
  form.customer_email = ''
  form.comment = ''
  getLeadsStore().reset()
}

async function handleSubmit() {
  if (!isFormValid.value || loading.value) return

  const systemStore = getSystemStore()
  const payload = {
    items: [{ variant_id: props.product.variantId, qty: 1 }],
    customer_name: form.customer_name.trim(),
    customer_phone: form.customer_phone.trim(),
    customer_email: form.customer_email.trim() || undefined,
    comment: form.comment.trim() || undefined,
    currency: systemStore.currentCurrency,
    locale: systemStore.currentLocale,
    source: 'product_page',
  }

  const result = await getLeadsStore().createLead(payload)

  if (result) {
    // Close after success message is shown
    setTimeout(() => {
      close()
    }, 2000)
  }
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// Watch for success messages and show toast
watch(success, (newSuccess) => {
  if (newSuccess) {
    $toast.success(t('product.quickBuy.success'))
  }
})

// Watch for error messages and show toast
watch([error, retryAfter], ([newError, newRetryAfter]) => {
  if (newError && !newRetryAfter) {
    $toast.error(newError)
  }
})

// Track if rate limit toast was shown
const rateLimitToastShown = ref(false)

// Watch for rate limit errors and show toast (only once)
watch(retryAfter, (newRetryAfter) => {
  if (newRetryAfter && newRetryAfter > 0 && !rateLimitToastShown.value) {
    rateLimitToastShown.value = true
    $toast.error(
      `${t('product.quickBuy.retryAfter', { seconds: newRetryAfter })}`,
      {
        duration: newRetryAfter * 1000, // Show for the duration of the rate limit
      }
    )
  } else if (!newRetryAfter || newRetryAfter === 0) {
    rateLimitToastShown.value = false
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50"
          @click="close"
        />

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="relative w-full max-w-md bg-white rounded-xl shadow-xl"
            >
              <!-- Header -->
              <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div class="flex items-center gap-2">
                  <Phone class="h-5 w-5 text-indigo-600" />
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ $t('product.quickBuy.title') }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="-m-2 p-2 text-gray-400 hover:text-gray-500 transition-colors"
                  @click="close"
                >
                  <span class="sr-only">{{ $t('common.actions.close') }}</span>
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="px-6 py-4">
                <!-- Product Info -->
                <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm font-medium text-gray-900 line-clamp-2">
                    {{ product.title }}
                  </p>
                  <p v-if="product.price" class="mt-1 text-sm text-indigo-600 font-semibold">
                    {{ product.price }}
                  </p>
                </div>

                <!-- Form -->
                <form v-if="!success" class="space-y-4" @submit.prevent="handleSubmit">
                  <!-- Name -->
                  <div>
                    <label for="quick-buy-name" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('product.quickBuy.name') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="quick-buy-name"
                      v-model="form.customer_name"
                      type="text"
                      :placeholder="$t('product.quickBuy.namePlaceholder')"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': fieldErrors.customer_name }"
                    >
                    <p v-if="fieldErrors.customer_name" class="mt-1 text-xs text-red-600">
                      {{ fieldErrors.customer_name }}
                    </p>
                  </div>

                  <!-- Phone -->
                  <div>
                    <label for="quick-buy-phone" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('product.quickBuy.phone') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="quick-buy-phone"
                      v-model="form.customer_phone"
                      type="tel"
                      :placeholder="$t('product.quickBuy.phonePlaceholder')"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': fieldErrors.customer_phone }"
                    >
                    <p v-if="fieldErrors.customer_phone" class="mt-1 text-xs text-red-600">
                      {{ fieldErrors.customer_phone }}
                    </p>
                  </div>

                  <!-- Email (Optional) -->
                  <div>
                    <label for="quick-buy-email" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('product.quickBuy.email') }}
                      <span class="text-gray-400 font-normal">({{ $t('common.labels.optional') }})</span>
                    </label>
                    <input
                      id="quick-buy-email"
                      v-model="form.customer_email"
                      type="email"
                      :placeholder="$t('product.quickBuy.emailPlaceholder')"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': fieldErrors.customer_email }"
                    >
                    <p v-if="fieldErrors.customer_email" class="mt-1 text-xs text-red-600">
                      {{ fieldErrors.customer_email }}
                    </p>
                  </div>

                  <!-- Comment (Optional) -->
                  <div>
                    <label for="quick-buy-comment" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('product.quickBuy.comment') }}
                      <span class="text-gray-400 font-normal">({{ $t('common.labels.optional') }})</span>
                    </label>
                    <textarea
                      id="quick-buy-comment"
                      v-model="form.comment"
                      rows="2"
                      :placeholder="$t('product.quickBuy.commentPlaceholder')"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
                    />
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    :disabled="!isFormValid || loading"
                    class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                    <Phone v-else class="h-4 w-4" />
                    {{ $t('product.quickBuy.submit') }}
                  </button>
                </form>
              </div>

              <!-- Footer -->
              <div class="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-xl">
                <p class="text-xs text-gray-500 text-center">
                  {{ $t('product.quickBuy.privacyNote') }}
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
