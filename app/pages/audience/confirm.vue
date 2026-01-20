<script setup lang="ts">
/**
 * Audience Email Confirmation Page
 * Displays success/error message based on redirect status from backend
 * URL: /audience/confirm?status=success or ?status=error&message=...
 */
import { CheckCircle, XCircle, Mail } from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
  ssr: false,
})

const route = useRoute()
const localePath = useLocalePath()

// Read status from URL query params (set by backend redirect)
const status = computed(() => route.query.status as string | undefined)
const errorMessage = computed(() => route.query.message as string | undefined)

const isSuccess = computed(() => status.value === 'success')
const isError = computed(() => status.value === 'error' || (!status.value && !isSuccess.value))
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Success State -->
      <div v-if="isSuccess">
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle class="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('audience.confirm.successTitle') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('audience.confirm.successMessage') }}
        </p>
        <div class="mt-8">
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {{ $t('audience.confirm.continueShopping') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="isError">
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900">
          <XCircle class="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('audience.confirm.errorTitle') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ errorMessage || $t('audience.confirm.errorMessage') }}
        </p>
        <div class="mt-8 space-y-4">
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {{ $t('audience.confirm.backToHome') }}
          </NuxtLink>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('audience.confirm.needHelp') }}
            <NuxtLink :to="localePath('/contact')" class="text-indigo-600 dark:text-indigo-400 hover:underline">
              {{ $t('audience.confirm.contactUs') }}
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Default/Loading State -->
      <div v-else>
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900">
          <Mail class="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ $t('audience.confirm.title') }}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('audience.confirm.processing') }}
        </p>
      </div>
    </div>
  </div>
</template>
