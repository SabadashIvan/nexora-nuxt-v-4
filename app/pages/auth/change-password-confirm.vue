<script setup lang="ts">
/**
 * Password Change Confirmation Page
 * Confirms password change using token from email link
 * URL: /auth/change-password-confirm?token=xxx
 */
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const authStore = shallowRef<ReturnType<typeof useAuthStore> | null>(null)
const token = computed(() => route.query.token as string | undefined)
const email = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

onMounted(() => {
  authStore.value = useAuthStore()

  if (!token.value) {
    status.value = 'error'
    if (authStore.value) {
      authStore.value.error = t('auth.changePassword.invalidToken')
    }
  }
})

const loading = computed(() => authStore.value?.loading ?? false)
const error = computed(() => authStore.value?.error ?? null)
const fieldErrors = computed(() => authStore.value?.fieldErrors ?? {})

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

async function handleConfirm() {
  if (!authStore.value || !token.value || !isEmailValid.value) return

  status.value = 'loading'
  const success = await authStore.value.confirmPasswordChange(token.value, {
    email: email.value,
  })

  if (success) {
    status.value = 'success'
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push(localePath('/auth/login'))
    }, 3000)
  } else {
    status.value = 'error'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Success State -->
      <div v-if="status === 'success'" class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle class="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('auth.changePassword.success') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.changePassword.successMessage') }}
        </p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">
          {{ $t('auth.changePassword.redirecting') }}
        </p>
        <NuxtLink
          :to="localePath('/auth/login')"
          class="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          {{ $t('auth.changePassword.loginNow') }}
        </NuxtLink>
      </div>

      <!-- Error State (no token) -->
      <div v-else-if="status === 'error' && !token" class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
          <XCircle class="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('auth.changePassword.invalidToken') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.changePassword.invalidTokenMessage') }}
        </p>
        <NuxtLink
          :to="localePath('/profile/settings')"
          class="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          {{ $t('auth.changePassword.backToSettings') }}
        </NuxtLink>
      </div>

      <!-- Confirmation Form -->
      <div v-else>
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900">
            <Mail class="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ $t('auth.changePassword.confirmTitle') }}
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{ $t('auth.changePassword.confirmMessage') }}
          </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleConfirm">
          <!-- Error Alert -->
          <div
            v-if="error"
            class="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
          >
            <div class="flex">
              <XCircle class="h-5 w-5 text-red-400" />
              <div class="ml-3">
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('auth.changePassword.emailLabel') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :disabled="loading"
              :class="[
                'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
                fieldErrors.email
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
              :placeholder="$t('auth.changePassword.emailPlaceholder')"
            />
            <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !isEmailValid"
            class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
            {{ $t('auth.changePassword.confirmButton') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
