<script setup lang="ts">
/**
 * Contact Us page
 * CSR-only page for submitting customer support requests
 */
import { Mail, User, Phone, MessageSquare, FileText } from 'lucide-vue-next'
import type { SupportRequestPayload } from '~/types'

// SEO
useHead({
  title: 'Contact Us',
  meta: [
    { name: 'description', content: 'Get in touch with our support team. We are here to help you with any questions or concerns.' },
  ],
})

// Store access (safe for CSR)
const supportStore = useSupportStore()

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Get i18n for translations
const { t } = useI18n()

// Fetch request types on mount
onMounted(async () => {
  if (supportStore.requestTypes.length === 0) {
    await supportStore.fetchRequestTypes()
  }
})

// Form state (only user-input fields)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  type_id: null as number | null,
})

// Form validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => form.email.trim() !== '' && emailRegex.test(form.email.trim()))
const isMessageValid = computed(() => form.message.trim().length >= 10)
const isFormValid = computed(() => 
  form.name.trim() !== '' &&
  isEmailValid.value &&
  form.subject.trim() !== '' &&
  isMessageValid.value
)

// Computed properties for store state (safe for SSR)
const storeLoading = computed(() => {
  try {
    return supportStore.loading
  } catch {
    return false
  }
})

const storeError = computed(() => {
  try {
    return supportStore.error
  } catch {
    return null
  }
})

const storeMessage = computed(() => {
  try {
    return supportStore.message
  } catch {
    return null
  }
})

const storeSuccess = computed(() => {
  try {
    return supportStore.success
  } catch {
    return false
  }
})

const storeFieldErrors = computed(() => {
  try {
    return supportStore.fieldErrors
  } catch {
    return {}
  }
})

const storeRetryAfter = computed(() => {
  try {
    return supportStore.retryAfter
  } catch {
    return null
  }
})

const storeRequestTypes = computed(() => {
  try {
    return supportStore.requestTypes
  } catch {
    return []
  }
})

const storeRequestTypesLoading = computed(() => {
  try {
    return supportStore.requestTypesLoading
  } catch {
    return false
  }
})

// Rate limit countdown
const retryCountdown = ref<number | null>(null)

watch(storeRetryAfter, (newVal) => {
  if (newVal && newVal > 0) {
    retryCountdown.value = newVal
    const interval = setInterval(() => {
      if (retryCountdown.value !== null && retryCountdown.value > 0) {
        retryCountdown.value--
      } else {
        clearInterval(interval)
        retryCountdown.value = null
      }
    }, 1000)
  } else {
    retryCountdown.value = null
  }
})

// Watch for success messages and show toast
watch([storeSuccess, storeMessage], ([success, message]) => {
  if (success && message) {
    $toast.success(message)
  }
})

// Watch for error messages and show toast
watch([storeError, storeRetryAfter], ([error, retryAfter]) => {
  if (error && !retryAfter) {
    $toast.error(error)
  }
})

// Track if rate limit toast was shown
const rateLimitToastShown = ref(false)

// Watch for rate limit errors and show toast (only once)
watch(storeRetryAfter, (retryAfter) => {
  if (retryAfter && retryAfter > 0 && !rateLimitToastShown.value) {
    rateLimitToastShown.value = true
    $toast.error(
      `${t('contact.errors.rateLimit')} ${t('contact.errors.tryAgain')} ${retryAfter} ${retryAfter === 1 ? t('contact.errors.second') : t('contact.errors.seconds')}.`,
      {
        duration: retryAfter * 1000, // Show for the duration of the rate limit
      }
    )
  } else if (!retryAfter || retryAfter === 0) {
    rateLimitToastShown.value = false
  }
})

// Get field error
function getFieldError(field: keyof SupportRequestPayload): string | undefined {
  return storeFieldErrors.value[field]
}

// Form submission
async function handleSubmit() {
  if (!isFormValid.value) return

  // Get user agent (client-side only) - server route will override with real headers
  const userAgent = import.meta.client ? navigator.userAgent : ''

  // IP address will be extracted by server route from request headers
  // For now, send placeholder - server route will replace it
  const ipAddress = '127.0.0.1'

  const payload: SupportRequestPayload = {
    name: form.name.trim(),
    email: form.email.trim(),
    subject: form.subject.trim(),
    message: form.message.trim(),
    ip_address: ipAddress,
    user_agent: userAgent,
    source: 'contact_page',
  }

  // Add phone if provided
  if (form.phone && form.phone.trim()) {
    payload.phone = form.phone.trim()
  }

  // Add type_id if selected
  if (form.type_id !== null) {
    payload.type = String(form.type_id)
  }

  const success = await supportStore.submitRequest(payload)

  if (success) {
    // Reset form on success
    form.name = ''
    form.email = ''
    form.phone = ''
    form.subject = ''
    form.message = ''
    form.type_id = null
  }
}
</script>

<template>
  <div class="relative overflow-hidden bg-white">
    <div class="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
      <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <UiBreadcrumbs :items="[{ label: $t('contact.title') }]" class="mb-6" />
        
        <div class="max-w-2xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">
              {{ $t('contact.title') }}
            </h1>
            <p class="mt-2 text-gray-600">
              {{ $t('contact.description') }}
            </p>
          </div>

          <!-- Form -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.fullName') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                :placeholder="$t('contact.form.placeholders.name')"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': getFieldError('name') }"
              >
            </div>
            <p v-if="getFieldError('name')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('name') }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.email') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                :placeholder="$t('contact.form.placeholders.email')"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': getFieldError('email') || (form.email && !isEmailValid) }"
              >
            </div>
            <p v-if="getFieldError('email')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('email') }}
            </p>
            <p v-else-if="form.email && !isEmailValid" class="mt-1 text-sm text-red-500">
              {{ $t('contact.validation.emailInvalid') }}
            </p>
          </div>

          <!-- Phone (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.phone') }} <span class="text-gray-500 text-xs">({{ $t('common.labels.optional') }})</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.phone"
                type="tel"
                autocomplete="tel"
                :placeholder="$t('contact.form.placeholders.phone')"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': getFieldError('phone') }"
              >
            </div>
            <p v-if="getFieldError('phone')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('phone') }}
            </p>
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.requestType') }} <span class="text-gray-500 text-xs">({{ $t('common.labels.optional') }})</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <select
                v-model="form.type_id"
                :disabled="storeRequestTypesLoading"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option :value="null">{{ $t('contact.form.selectType') }}</option>
                <option
                  v-for="requestType in storeRequestTypes"
                  :key="requestType.id"
                  :value="requestType.id"
                >
                  {{ requestType.title }}
                </option>
              </select>
            </div>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.subject') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.subject"
                type="text"
                required
                :placeholder="$t('contact.form.placeholders.subject')"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': getFieldError('subject') }"
              >
            </div>
            <p v-if="getFieldError('subject')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('subject') }}
            </p>
          </div>

          <!-- Message -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('contact.form.message') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <MessageSquare class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                v-model="form.message"
                required
                rows="6"
                :placeholder="$t('contact.form.placeholders.message')"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                :class="{ 'ring-2 ring-red-500': getFieldError('message') || (form.message && !isMessageValid) }"
              />
            </div>
            <p v-if="getFieldError('message')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('message') }}
            </p>
            <p v-else-if="form.message && !isMessageValid" class="mt-1 text-sm text-red-500">
              {{ $t('contact.validation.messageMinLength') }}
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ $t('contact.validation.messageMinLengthHint') }}
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="!isFormValid || storeLoading || (storeRetryAfter !== null && retryCountdown !== null && retryCountdown > 0)"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="storeLoading" size="sm" class="mr-2" />
            <span v-if="storeLoading">{{ $t('contact.form.submitting') }}</span>
            <span v-else>{{ $t('contact.form.submit') }}</span>
          </button>
        </form>

          <!-- Additional info -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
              {{ $t('contact.form.responseTime') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

