<script setup lang="ts">
/**
 * Email Change Confirmation Page
 * Confirms email change using token from email link
 * URL: /auth/change-email-confirm?token=xxx&email=user%40example.com
 */
import { CheckCircle, XCircle, Loader2 } from 'lucide-vue-next'

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
const queryEmail = computed(() => route.query.email as string | undefined)
const status = ref<'loading' | 'success' | 'error'>('loading')

onMounted(async () => {
  authStore.value = useAuthStore()

  if (!token.value) {
    status.value = 'error'
    if (authStore.value) {
      authStore.value.error = t('auth.changeEmail.invalidLink')
    }
    return
  }

  // Auto-confirm on mount
  const email = queryEmail.value ?? authStore.value?.user?.email

  if (!email) {
    status.value = 'error'
    if (authStore.value) {
      authStore.value.error = t('auth.changeEmail.invalidLink')
    }
    return
  }

  const success = await authStore.value.confirmEmailChange(token.value, email)

  if (success) {
    status.value = 'success'
    // Redirect to profile after 3 seconds
    setTimeout(() => {
      router.push(localePath('/profile'))
    }, 3000)
  } else {
    status.value = 'error'
  }
})

const error = computed(() => authStore.value?.error ?? null)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Loading State -->
      <div v-if="status === 'loading'" class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900">
          <Loader2 class="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('auth.changeEmail.verifying') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.changeEmail.verifyingMessage') }}
        </p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle class="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('auth.changeEmail.success') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.changeEmail.successMessage') }}
        </p>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-500">
          {{ $t('auth.changeEmail.redirecting') }}
        </p>
        <NuxtLink
          :to="localePath('/profile')"
          class="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          {{ $t('auth.changeEmail.goToProfile') }}
        </NuxtLink>
      </div>

      <!-- Error State -->
      <div v-else class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
          <XCircle class="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('auth.changeEmail.error') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ error || $t('auth.changeEmail.errorMessage') }}
        </p>
        <div class="mt-6 space-y-3">
          <NuxtLink
            :to="localePath('/profile/settings')"
            class="block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            {{ $t('auth.changeEmail.tryAgain') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/contact')"
            class="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {{ $t('auth.changeEmail.contactSupport') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
