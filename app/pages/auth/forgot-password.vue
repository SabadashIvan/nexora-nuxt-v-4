<script setup lang="ts">
/**
 * Forgot password page
 */
import { Mail, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  ssr: false,
})

const authStore = useAuthStore()

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Locale-aware navigation
const localePath = useLocalePath()

const email = ref('')
const isSubmitting = ref(false)

const error = computed(() => authStore.error)
const status = computed(() => authStore.passwordResetStatus)

async function handleSubmit() {
  isSubmitting.value = true
  await authStore.forgotPassword({ email: email.value })
  isSubmitting.value = false
}

// Watch for success messages and show toast
watch(status, (newStatus) => {
  if (newStatus === 'sent') {
    $toast.success('Check your email', {
      description: `We've sent a password reset link to ${email.value}`,
    })
  }
})

// Watch for error messages and show toast
watch(error, (newError) => {
  if (newError) {
    $toast.error(newError)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink :to="localePath('/')" class="text-3xl font-bold text-primary-600 dark:text-primary-400">
          Nexora
        </NuxtLink>
        <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reset your password
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        <form v-if="status !== 'sent'" class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting || status === 'sent'"
            class="w-full flex items-center justify-center py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UiSpinner v-if="isSubmitting" size="sm" class="mr-2" />
            {{ status === 'sent' ? 'Email Sent' : 'Send Reset Link' }}
          </button>
        </form>

        <!-- Back to login -->
        <NuxtLink
          :to="localePath('/auth/login')"
          class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Sign In
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
