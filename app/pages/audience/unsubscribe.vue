<script setup lang="ts">
/**
 * Audience Unsubscribe Page
 * Displays success/error message based on redirect status from backend
 * URL: /audience/unsubscribe?status=success or ?status=error&message=...
 */
import { CheckCircle, XCircle, MailX, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const route = useRoute()
const localePath = useLocalePath()

const audienceStore = shallowRef<ReturnType<typeof useAudienceStore> | null>(null)

onMounted(() => {
  audienceStore.value = useAudienceStore()
})

// Read status from URL query params (set by backend redirect)
const urlStatus = computed(() => route.query.status as string | undefined)
const errorMessage = computed(() => route.query.message as string | undefined)

const isSuccess = computed(() => urlStatus.value === 'success')
const isError = computed(() => urlStatus.value === 'error')

// Re-subscribe state
const resubscribing = ref(false)
const resubscribeSuccess = ref(false)
const resubscribeError = ref<string | null>(null)

// Check if email was provided in query for re-subscribe
const emailFromQuery = computed(() => route.query.email as string | undefined)
const resubscribeEmail = ref(emailFromQuery.value || '')

// Sync email from query param when available
watch(emailFromQuery, (email) => {
  if (email && !resubscribeEmail.value) {
    resubscribeEmail.value = email
  }
})

async function handleResubscribe() {
  if (!audienceStore.value || !resubscribeEmail.value.trim()) return

  resubscribing.value = true
  resubscribeError.value = null

  const success = await audienceStore.value.subscribe({
    email: resubscribeEmail.value.trim(),
    consent: true,
    website: '', // Honeypot
    source: 'resubscribe_page',
  })

  if (success) {
    resubscribeSuccess.value = true
  } else {
    resubscribeError.value = audienceStore.value.error
  }

  resubscribing.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Success State -->
      <div v-if="isSuccess && !resubscribeSuccess">
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle class="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-black-100">
          {{ $t('audience.unsubscribe.successTitle') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('audience.unsubscribe.successMessage') }}
        </p>

        <!-- Re-subscribe option -->
        <div class="mt-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ $t('audience.unsubscribe.changedMind') }}
          </p>
          <form class="space-y-4" @submit.prevent="handleResubscribe">
            <input
              v-model="resubscribeEmail"
              type="email"
              required
              :placeholder="$t('audience.unsubscribe.emailPlaceholder')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
            <button
              type="submit"
              :disabled="resubscribing || !resubscribeEmail.trim()"
              class="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Loader2 v-if="resubscribing" class="h-4 w-4 animate-spin mr-2" />
              {{ $t('audience.unsubscribe.resubscribeButton') }}
            </button>
            <p v-if="resubscribeError" class="text-sm text-red-600 dark:text-red-400">
              {{ resubscribeError }}
            </p>
          </form>
        </div>

        <div class="mt-6">
          <NuxtLink
            :to="localePath('/')"
            class="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {{ $t('audience.unsubscribe.backToHome') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Re-subscribe Success State -->
      <div v-else-if="resubscribeSuccess">
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle class="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-black-100">
          {{ $t('audience.unsubscribe.resubscribeSuccessTitle') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('audience.unsubscribe.resubscribeSuccessMessage') }}
        </p>
        <div class="mt-8">
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {{ $t('audience.unsubscribe.continueShopping') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="isError">
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900">
          <XCircle class="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-black-100">
          {{ $t('audience.unsubscribe.errorTitle') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ errorMessage || $t('audience.unsubscribe.errorMessage') }}
        </p>
        <div class="mt-8 space-y-4">
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {{ $t('audience.unsubscribe.backToHome') }}
          </NuxtLink>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('audience.unsubscribe.needHelp') }}
            <NuxtLink :to="localePath('/contact')" class="text-indigo-600 dark:text-indigo-400 hover:underline">
              {{ $t('audience.unsubscribe.contactUs') }}
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Default/No Status State -->
      <div v-else>
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800">
          <MailX class="h-12 w-12 text-gray-600 dark:text-gray-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-black-100">
          {{ $t('audience.unsubscribe.title') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('audience.unsubscribe.defaultMessage') }}
        </p>
        <div class="mt-8">
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {{ $t('audience.unsubscribe.backToHome') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
