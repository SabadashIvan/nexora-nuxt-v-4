<script setup lang="ts">
/**
 * Contact Us page
 * Two-column layout: locations list (left) and contact form (right)
 * SSR enabled for locations, CSR for form submission
 */
import { Mail, User, MessageSquare, MapPin, Phone, Clock, ExternalLink } from 'lucide-vue-next'
import type { SupportRequestPayload, LocationSchedule } from '~/types'

// SEO
useHead({
  title: 'Contact Us',
  meta: [
    { name: 'description', content: 'Get in touch with our support team. We are here to help you with questions or concerns.' },
  ],
})

// Locale-aware navigation
const localePath = useLocalePath()
const { t } = useI18n()

// Fetch locations with SSR
const { data: locations, pending: locationsPending } = await useAsyncData(
  'contact-locations',
  async () => {
    const systemStore = useSystemStore()
    return await systemStore.fetchLocations()
  },
  {
    server: true, // SSR for SEO
    lazy: false,
  }
)

// Store access (safe for CSR)
const supportStore = useSupportStore()

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Form state (simplified: name, email, message only)
const form = reactive({
  name: '',
  email: '',
  message: '',
  consent: false,
})

// Form validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => form.email.trim() !== '' && emailRegex.test(form.email.trim()))
const isMessageValid = computed(() => form.message.trim().length >= 10)
const isFormValid = computed(() => 
  form.name.trim() !== '' &&
  isEmailValid.value &&
  isMessageValid.value &&
  form.consent
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

// Format schedule for display
function formatSchedule(schedule: LocationSchedule): { day: string; hours: string; key: string }[] {
  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  return days.map(({ key, label }) => ({
    day: label,
    hours: schedule[key as keyof LocationSchedule] ?? 'Closed',
    key,
  }))
}

// Get today's day for highlighting
const today = computed(() => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
})

// Extract safe map URL from iframe HTML provided by backend
function extractMapSrc(iframeHtml?: string | null): string {
  if (!iframeHtml) return ''
  const match = iframeHtml.match(/src="([^"]+)"/i)
  return match?.[1] ?? ''
}

// Form submission
async function handleSubmit() {
  if (!isFormValid.value) return

  // Get user agent (client-side only) - server route will override with real headers
  const userAgent = import.meta.client ? navigator.userAgent : ''

  // IP address will be extracted by server route from request headers
  // For now, send placeholder - server route will replace it
  const ipAddress = '127.0.0.1'

  // Auto-generate subject (required by API but not shown in UI)
  const payload: SupportRequestPayload = {
    name: form.name.trim(),
    email: form.email.trim(),
    subject: 'Contact Form Submission', // Auto-generated
    message: form.message.trim(),
    ip_address: ipAddress,
    user_agent: userAgent,
    source: 'contact_page',
  }

  const success = await supportStore.submitRequest(payload)

  if (success) {
    // Reset form on success
    form.name = ''
    form.email = ''
    form.message = ''
    form.consent = false
  }
}
</script>

<template>
  <div class="relative overflow-hidden bg-white dark:bg-gray-950">
    <div class="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
      <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <UiBreadcrumbs :items="[{ label: $t('contact.title') }]" class="mb-6" />
        
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {{ $t('contact.title') }}
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            {{ $t('contact.description') }}
          </p>
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Left Column: Locations List -->
          <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {{ $t('contact.locations.title') }}
            </h2>

            <!-- Loading state -->
            <div v-if="locationsPending" class="space-y-6">
              <div v-for="i in 2" :key="i" class="bg-gray-100 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
            </div>

            <!-- Locations list -->
            <div v-else-if="locations && locations.length > 0" class="space-y-6">
              <article
                v-for="location in locations"
                :key="location.id"
                class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <!-- Image -->
                <div v-if="location.image" class="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <NuxtImg
                    :src="location.image"
                    :alt="location.title"
                    class="h-full w-full object-cover"
                  />
                </div>

                <div class="p-6">
                  <!-- Title -->
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {{ location.title }}
                  </h3>

                  <!-- Address -->
                  <div class="mt-4 flex items-start gap-3">
                    <MapPin class="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p class="text-gray-700 dark:text-gray-300">
                        {{ location.address }}
                      </p>
                      <a
                        v-if="location.address_link"
                        :href="location.address_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {{ $t('contact.locations.viewOnMap') }}
                        <ExternalLink class="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <!-- Phones -->
                  <div v-if="location.phones && location.phones.length > 0" class="mt-4 flex items-start gap-3">
                    <Phone class="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div class="space-y-1">
                      <a
                        v-for="(phone, index) in location.phones"
                        :key="index"
                        :href="`tel:${phone.replace(/\D/g, '')}`"
                        class="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {{ phone }}
                      </a>
                    </div>
                  </div>

                  <!-- Schedule -->
                  <div class="mt-4 flex items-start gap-3">
                    <Clock class="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div class="w-full">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {{ $t('contact.locations.workingHours') }}
                      </p>
                      <div class="space-y-1 text-sm">
                        <div
                          v-for="{ day, hours, key } in formatSchedule(location.schedule)"
                          :key="key"
                          class="flex justify-between py-1"
                          :class="{
                            'text-primary-600 dark:text-primary-400 font-medium': today === key,
                            'text-gray-600 dark:text-gray-400': today !== key
                          }"
                        >
                          <span>{{ day }}</span>
                          <span>{{ hours }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Website link -->
                  <a
                    v-if="location.website_link"
                    :href="location.website_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {{ $t('contact.locations.visitWebsite') }}
                    <ExternalLink class="h-3.5 w-3.5" />
                  </a>

                  <!-- Map iframe -->
                  <iframe
                    v-if="location.map_iframe"
                    class="mt-6 w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                    :src="extractMapSrc(location.map_iframe)"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            </div>

            <!-- Empty state -->
            <UiEmptyState
              v-else
              :title="$t('contact.locations.emptyTitle')"
              :description="$t('contact.locations.emptyDescription')"
              :icon="MapPin"
            />
          </div>

          <!-- Right Column: Contact Form -->
          <div>
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 sticky top-8">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {{ $t('contact.form.title') }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {{ $t('contact.form.subtitle') }}
              </p>

              <form class="space-y-5" @submit.prevent="handleSubmit">
                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ $t('contact.form.fullName') }}
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
                    {{ $t('contact.form.email') }}
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

                <!-- Message -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    * {{ $t('contact.form.message') }}
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
                </div>

                <!-- Consent checkbox -->
                <div>
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      v-model="form.consent"
                      type="checkbox"
                      required
                      class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    >
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ $t('contact.form.consent') }}
                      <NuxtLink
                        :to="localePath('/pages/terms')"
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                      >
                        {{ $t('footer.bottomBar.termsOfService') }}
                      </NuxtLink>
                    </span>
                  </label>
                  <p v-if="!form.consent && form.name && form.email && form.message && isMessageValid" class="mt-1 text-sm text-red-500">
                    {{ $t('contact.form.consentRequired') }}
                  </p>
                </div>

                <!-- Submit -->
                <button
                  type="submit"
                  :disabled="!isFormValid || storeLoading || (storeRetryAfter !== null && retryCountdown !== null && retryCountdown > 0)"
                  class="w-full flex items-center justify-center py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UiSpinner v-if="storeLoading" size="sm" class="mr-2" />
                  <span v-if="storeLoading">{{ $t('contact.form.submitting') }}</span>
                  <span v-else>{{ $t('contact.form.submit') }}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure map iframes are responsive */
iframe {
  width: 100%;
  height: 200px;
  border: 0;
}
</style>
