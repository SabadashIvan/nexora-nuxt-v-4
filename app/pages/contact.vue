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

// Form state (only user-input fields)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  type: 'general' as 'general' | 'technical' | 'billing' | 'other',
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
    type: form.type || '1',
    ip_address: ipAddress,
    user_agent: userAgent,
    source: 'contact_page',
  }

  // Add phone if provided
  if (form.phone && form.phone.trim()) {
    payload.phone = form.phone.trim()
  }

  const success = await supportStore.submitRequest(payload)

  if (success) {
    // Reset form on success
    form.name = ''
    form.email = ''
    form.phone = ''
    form.subject = ''
    form.message = ''
    form.type = 'general'
  }
}
</script>

<template>
  <div class="relative overflow-hidden bg-white">
    <div class="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
      <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <UiBreadcrumbs :items="[{ label: 'Contact Us' }]" class="mb-6" />
        
        <div class="max-w-2xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">
              Contact Us
            </h1>
            <p class="mt-2 text-gray-600">
              Have a question or need help? We're here to assist you.
            </p>
          </div>

          <!-- Form -->
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <!-- Success message -->
        <div 
          v-if="storeSuccess && storeMessage"
          class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p class="text-sm text-green-700 dark:text-green-400">{{ storeMessage }}</p>
        </div>

        <!-- General error message -->
        <div 
          v-if="storeError && !storeRetryAfter"
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-700 dark:text-red-400">{{ storeError }}</p>
        </div>

        <!-- Rate limit error with countdown -->
        <div 
          v-if="storeRetryAfter && retryCountdown !== null"
          class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <p class="text-sm text-yellow-700 dark:text-yellow-400 font-semibold mb-1">
            Too many support request attempts
          </p>
          <p class="text-sm text-yellow-600 dark:text-yellow-500">
            Please try again in 
            <span class="font-mono font-bold">{{ retryCountdown }}</span>
            {{ retryCountdown === 1 ? 'second' : 'seconds' }}.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                placeholder="John Doe"
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
              Email Address <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                :class="{ 'ring-2 ring-red-500': getFieldError('email') || (form.email && !isEmailValid) }"
              >
            </div>
            <p v-if="getFieldError('email')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('email') }}
            </p>
            <p v-else-if="form.email && !isEmailValid" class="mt-1 text-sm text-red-500">
              Please enter a valid email address
            </p>
          </div>

          <!-- Phone (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span class="text-gray-500 text-xs">(optional)</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.phone"
                type="tel"
                autocomplete="tel"
                placeholder="+380501234567"
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
              Request Type <span class="text-gray-500 text-xs">(optional)</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <select
                v-model="form.type"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="form.subject"
                type="text"
                required
                placeholder="What is your question about?"
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
              Message <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <MessageSquare class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                v-model="form.message"
                required
                rows="6"
                placeholder="Please provide details about your question or issue..."
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                :class="{ 'ring-2 ring-red-500': getFieldError('message') || (form.message && !isMessageValid) }"
              />
            </div>
            <p v-if="getFieldError('message')" class="mt-1 text-sm text-red-500">
              {{ getFieldError('message') }}
            </p>
            <p v-else-if="form.message && !isMessageValid" class="mt-1 text-sm text-red-500">
              Message must be at least 10 characters
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum 10 characters required
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="!isFormValid || storeLoading || (storeRetryAfter !== null && retryCountdown !== null && retryCountdown > 0)"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="storeLoading" size="sm" class="mr-2" />
            <span v-if="storeLoading">Submitting...</span>
            <span v-else>Submit Request</span>
          </button>
        </form>

          <!-- Additional info -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
              We typically respond within 24 hours. For urgent matters, please call our support line.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

