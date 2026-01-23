<script setup lang="ts">
/**
 * Newsletter Subscription Form Component
 * Reusable form for subscribing to newsletter with honeypot protection
 */
import { useAudienceStore } from '~/stores/audience.store'
import type { AudienceSubscribePayload } from '~/types'

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

interface Props {
  /** Source identifier for tracking (e.g., "home_form", "footer_form") */
  source?: string
  /** Variant for different styling */
  variant?: 'default' | 'compact' | 'horizontal'
  /** Whether to show name field */
  showName?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  source: 'home_form',
  variant: 'horizontal',
  showName: false,
})

// Form state
const email = ref('')
const name = ref('')
const consent = ref(false)
const website = ref('') // Honeypot field - must remain empty

// Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => email.value.trim() !== '' && emailRegex.test(email.value.trim()))
const isFormValid = computed(() => isEmailValid.value && consent.value && website.value === '')

// Access store inside computed properties (safe for SSR)
const storeLoading = computed(() => {
  try {
    return useAudienceStore().loading
  } catch {
    return false
  }
})

const storeError = computed(() => {
  try {
    return useAudienceStore().error
  } catch {
    return null
  }
})

const storeMessage = computed(() => {
  try {
    return useAudienceStore().message
  } catch {
    return null
  }
})

// Form submission
async function handleSubmit() {
  if (!isFormValid.value) return

  const payload: AudienceSubscribePayload = {
    email: email.value.trim(),
    consent: consent.value,
    source: props.source,
    website: website.value, // Honeypot - should be empty
  }

  // Add name if provided
  if (props.showName && name.value.trim()) {
    payload.name = name.value.trim()
  }

  try {
    const audienceStore = useAudienceStore()
    const success = await audienceStore.subscribe(payload)

    if (success) {
      // Reset form on success
      email.value = ''
      name.value = ''
      consent.value = false
      website.value = ''
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
  }
}

// Watch for success messages and show toast
watch(storeMessage, (message) => {
  if (message && !storeError.value) {
    $toast.success(message)
  }
})

// Watch for error messages and show toast
watch(storeError, (error) => {
  if (error) {
    $toast.error(error)
  }
})
</script>

<template>
  <form :class="variant === 'horizontal' ? 'space-y-3' : 'space-y-4'" @submit.prevent="handleSubmit">
    <!-- Horizontal layout (original design) -->
    <template v-if="variant === 'horizontal'">
      <div class="flex max-w-md gap-x-4">
        <label for="newsletter-email" class="sr-only">Email address</label>
        <input
          id="newsletter-email"
          v-model="email"
          type="email"
          name="email"
          required
          placeholder="Enter your email"
          autocomplete="email"
          class="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
          :aria-invalid="email && !isEmailValid ? 'true' : undefined"
          aria-describedby="email-error"
        >
        <button
          type="submit"
          :disabled="!isFormValid || storeLoading"
          class="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="storeLoading">...</span>
          <span v-else>Subscribe</span>
        </button>
      </div>

      <!-- Consent checkbox below email/button -->
      <div class="flex items-start gap-3">
        <UiCheckbox
          id="newsletter-consent"
          v-model="consent"
          name="consent"
          required
          class="mt-0.5"
        />
        <label
          for="newsletter-consent"
          class="text-sm text-gray-300 cursor-pointer"
        >
          I agree to receive newsletter emails
          <span class="text-red-400" aria-label="required">*</span>
        </label>
      </div>
    </template>

    <!-- Vertical layout (default) -->
    <template v-else>
      <!-- Email field -->
      <div>
        <label for="newsletter-email" class="sr-only">Email address</label>
        <input
          id="newsletter-email"
          v-model="email"
          type="email"
          name="email"
          required
          placeholder="Enter your email"
          autocomplete="email"
          :class="[
            'w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6',
            variant === 'compact' ? 'text-sm' : ''
          ]"
          :aria-invalid="email && !isEmailValid ? 'true' : undefined"
          aria-describedby="email-error"
        >
        <p
          v-if="email && !isEmailValid"
          id="email-error"
          class="mt-1 text-sm text-red-400"
          role="alert"
        >
          Please enter a valid email address
        </p>
      </div>

      <!-- Name field (optional) -->
      <div v-if="showName">
        <label for="newsletter-name" class="sr-only">Name</label>
        <input
          id="newsletter-name"
          v-model="name"
          type="text"
          name="name"
          placeholder="Your name (optional)"
          autocomplete="name"
          :class="[
            'w-full rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6',
            variant === 'compact' ? 'text-sm' : ''
          ]"
        >
      </div>

      <!-- Consent checkbox -->
      <div class="flex items-start gap-3">
        <UiCheckbox
          id="newsletter-consent"
          v-model="consent"
          name="consent"
          required
          class="mt-0.5"
        />
        <label
          for="newsletter-consent"
          class="text-sm text-gray-300 cursor-pointer"
        >
          {{ $t('newsletter.consent') }}
          <span class="text-red-400" aria-label="required">*</span>
        </label>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="!isFormValid || storeLoading"
        :class="[
          'w-full rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          variant === 'compact' ? 'px-3 py-2 text-xs' : ''
        ]"
      >
        <span v-if="storeLoading">{{ $t('newsletter.subscribing') }}</span>
        <span v-else>{{ $t('newsletter.subscribe') }}</span>
      </button>
    </template>

    <!-- Honeypot field (hidden from users and screen readers) -->
    <input
      v-model="website"
      type="text"
      name="website"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
      style="position: absolute; left: -9999px;"
    >
  </form>
</template>