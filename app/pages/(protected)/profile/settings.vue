<script setup lang="ts">
/**
 * Profile settings page
 */
import { Github, Key, Mail, CheckCircle, AlertCircle, Loader2, Phone, MessageCircle, ExternalLink } from 'lucide-vue-next'
import type { ChangePasswordRequestPayload, ChangeEmailRequestPayload } from '~/types'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const { t } = useI18n()
const authStore = shallowRef<ReturnType<typeof useAuthStore> | null>(null)
const linkingProvider = ref<string | null>(null)
const oauthPollTimer = ref<ReturnType<typeof setInterval> | null>(null)

const userSession = useUserSession()

// Password change form state
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})
const passwordSubmitting = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref<string | null>(null)
const passwordFieldErrors = ref<Record<string, string>>({})

// Email change form state
const emailForm = reactive({
  email: '',
})
const emailSubmitting = ref(false)
const emailSuccess = ref(false)
const emailError = ref<string | null>(null)
const emailFieldErrors = ref<Record<string, string>>({})

// Contact channels state
const phoneForm = reactive({
  phone: '',
})
const phoneLinking = ref(false)
const telegramLinking = ref(false)
const channelSuccess = ref<string | null>(null)
const channelError = ref<string | null>(null)
const telegramDeeplink = ref<string | null>(null)

onMounted(() => {
  authStore.value = useAuthStore()
})

// Password validation
const isPasswordValid = computed(() => {
  return (
    passwordForm.current_password.length >= 1 &&
    passwordForm.new_password.length >= 8 &&
    passwordForm.new_password === passwordForm.new_password_confirmation
  )
})

// Email validation
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(emailForm.email)
})

// Handle password change request
async function handlePasswordChange() {
  if (!authStore.value || !isPasswordValid.value || passwordSubmitting.value) return

  passwordSubmitting.value = true
  passwordSuccess.value = false
  passwordError.value = null
  passwordFieldErrors.value = {}

  const payload: ChangePasswordRequestPayload = {
    current_password: passwordForm.current_password,
    new_password: passwordForm.new_password,
    new_password_confirmation: passwordForm.new_password_confirmation,
  }

  const success = await authStore.value.requestPasswordChange(payload)

  if (success) {
    passwordSuccess.value = true
    // Reset form
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirmation = ''
  } else {
    passwordError.value = authStore.value.error
    passwordFieldErrors.value = authStore.value.fieldErrors
  }

  passwordSubmitting.value = false
}

// Handle email change request
async function handleEmailChange() {
  if (!authStore.value || !isEmailValid.value || emailSubmitting.value) return

  emailSubmitting.value = true
  emailSuccess.value = false
  emailError.value = null
  emailFieldErrors.value = {}

  const payload: ChangeEmailRequestPayload = {
    new_email: emailForm.email,
  }

  const success = await authStore.value.requestEmailChange(payload)

  if (success) {
    emailSuccess.value = true
    // Reset form
    emailForm.email = ''
  } else {
    emailError.value = authStore.value.error
    emailFieldErrors.value = authStore.value.fieldErrors
  }

  emailSubmitting.value = false
}

const linkedProviders = computed(() => {
  const user = authStore.value?.user
  return {
    github: !!user?.githubId,
    google: !!user?.googleId,
  }
})

async function handleLink(provider: 'github' | 'google') {
  if (linkingProvider.value) return
  const store = useAuthStore()
  const existingUser = store.user

  try {
    store.setLinking()
    linkingProvider.value = provider
    userSession.openInPopup(`/auth/${provider}`)
    startOAuthPolling()
  } catch (error) {
    console.error('OAuth linking failed:', error)
  } finally {
    linkingProvider.value = null
    if (store.state === 'linking' && existingUser) {
      store.setAuthenticated(existingUser)
    }
  }
}

function startOAuthPolling() {
  const store = useAuthStore()
  let attempts = 0
  if (oauthPollTimer.value) {
    clearInterval(oauthPollTimer.value)
  }
  oauthPollTimer.value = setInterval(async () => {
    attempts += 1
    await userSession.fetch()
    if (userSession.loggedIn.value && userSession.user.value) {
      store.setAuthenticated(userSession.user.value)
    }
    if (store.user?.githubId || store.user?.googleId || store.state === 'auth' || attempts >= 12) {
      if (oauthPollTimer.value) {
        clearInterval(oauthPollTimer.value)
        oauthPollTimer.value = null
      }
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (oauthPollTimer.value) {
    clearInterval(oauthPollTimer.value)
  }
})

// Contact channel validation
const isPhoneValid = computed(() => {
  const phone = phoneForm.phone.replace(/\D/g, '')
  return phone.length >= 10
})

// Handle phone linking
async function handlePhoneLink() {
  if (!authStore.value || !isPhoneValid.value || phoneLinking.value) return

  phoneLinking.value = true
  channelSuccess.value = null
  channelError.value = null

  const result = await authStore.value.linkContactChannel('phone', phoneForm.phone)

  if (result !== undefined) {
    // Phone linking returns null on success (204 No Content)
    channelSuccess.value = t('profile.settings.phoneLinkSuccess')
    phoneForm.phone = ''
  } else if (authStore.value.error) {
    channelError.value = authStore.value.error
  }

  phoneLinking.value = false
}

// Handle phone unlinking (reserved for unlink UI)
async function _handlePhoneUnlink() {
  if (!authStore.value || phoneLinking.value) return

  phoneLinking.value = true
  channelSuccess.value = null
  channelError.value = null

  const success = await authStore.value.unlinkContactChannel('phone')

  if (success) {
    channelSuccess.value = t('profile.settings.phoneUnlinkSuccess')
  } else if (authStore.value.error) {
    channelError.value = authStore.value.error
  }

  phoneLinking.value = false
}

// Handle Telegram linking
async function handleTelegramLink() {
  if (!authStore.value || telegramLinking.value) return

  telegramLinking.value = true
  channelSuccess.value = null
  channelError.value = null
  telegramDeeplink.value = null

  const result = await authStore.value.linkContactChannel('telegram')

  if (result?.deeplink) {
    telegramDeeplink.value = result.deeplink
    // Open deeplink in new window
    window.open(result.deeplink, '_blank')
  } else if (authStore.value.error) {
    channelError.value = authStore.value.error
  }

  telegramLinking.value = false
}

// Handle Telegram unlinking (reserved for unlink UI)
async function _handleTelegramUnlink() {
  if (!authStore.value || telegramLinking.value) return

  telegramLinking.value = true
  channelSuccess.value = null
  channelError.value = null
  telegramDeeplink.value = null

  const success = await authStore.value.unlinkContactChannel('telegram')

  if (success) {
    channelSuccess.value = t('profile.settings.telegramUnlinkSuccess')
  } else if (authStore.value.error) {
    channelError.value = authStore.value.error
  }

  telegramLinking.value = false
}
</script>

<template>
  <div class="space-y-8">
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Account settings</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Manage your connected accounts and authentication methods.
      </p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Linked accounts</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Link OAuth providers to sign in faster next time.
      </p>

      <div class="mt-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <Github class="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">GitHub</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ linkedProviders.github ? 'Linked' : 'Not linked' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="linkedProviders.github || linkingProvider === 'github'"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleLink('github')"
          >
            <UiSpinner v-if="linkingProvider === 'github'" size="sm" class="mr-2" />
            {{ linkedProviders.github ? 'Linked' : 'Link GitHub' }}
          </button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <span class="h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              G
            </span>
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Google</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ linkedProviders.google ? 'Linked' : 'Not linked' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="linkedProviders.google || linkingProvider === 'google'"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleLink('google')"
          >
            <UiSpinner v-if="linkingProvider === 'google'" size="sm" class="mr-2" />
            {{ linkedProviders.google ? 'Linked' : 'Link Google' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contact Channels Section -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ $t('profile.settings.contactChannels') }}</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ $t('profile.settings.contactChannelsDescription') }}
      </p>

      <!-- Success/Error Messages -->
      <div
        v-if="channelSuccess"
        class="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <div class="flex">
          <CheckCircle class="h-5 w-5 text-green-400" />
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-400">{{ channelSuccess }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="channelError"
        class="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4"
      >
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-400">{{ channelError }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-4">
        <!-- Telegram Channel -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <MessageCircle class="h-6 w-6 text-blue-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Telegram</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('profile.settings.telegramDescription') }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="telegramLinking"
              class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleTelegramLink"
            >
              <Loader2 v-if="telegramLinking" class="h-4 w-4 animate-spin mr-2" />
              <ExternalLink v-else class="h-4 w-4 mr-2" />
              {{ $t('profile.settings.linkTelegram') }}
            </button>
          </div>
        </div>

        <!-- Telegram Deeplink (shown after linking request) -->
        <div
          v-if="telegramDeeplink"
          class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <p class="text-sm text-blue-700 dark:text-blue-300 mb-2">
            {{ $t('profile.settings.telegramDeeplinkInfo') }}
          </p>
          <a
            :href="telegramDeeplink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ $t('profile.settings.openTelegram') }}
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </div>

        <!-- Phone Channel -->
        <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div class="flex items-center gap-3 mb-4">
            <Phone class="h-6 w-6 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ $t('profile.settings.phoneChannel') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('profile.settings.phoneDescription') }}
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <input
                v-model="phoneForm.phone"
                type="tel"
                :placeholder="$t('profile.settings.phonePlaceholder')"
                :disabled="phoneLinking"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              >
            </div>
            <button
              type="button"
              :disabled="!isPhoneValid || phoneLinking"
              class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-transparent text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handlePhoneLink"
            >
              <Loader2 v-if="phoneLinking" class="h-4 w-4 animate-spin mr-2" />
              {{ $t('profile.settings.linkPhone') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Section -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <Key class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ $t('profile.settings.changePassword') }}</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ $t('profile.settings.changePasswordDescription') }}
      </p>

      <!-- Success Message -->
      <div
        v-if="passwordSuccess"
        class="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <div class="flex">
          <CheckCircle class="h-5 w-5 text-green-400" />
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-400">
              {{ $t('profile.settings.passwordChangeEmailSent') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="passwordError"
        class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4"
      >
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-400">{{ passwordError }}</p>
          </div>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="handlePasswordChange">
        <div>
          <label for="current_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('profile.settings.currentPassword') }}
          </label>
          <input
            id="current_password"
            v-model="passwordForm.current_password"
            type="password"
            required
            :disabled="passwordSubmitting"
            :class="[
              'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
              passwordFieldErrors.current_password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            ]"
          >
          <p v-if="passwordFieldErrors.current_password" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ passwordFieldErrors.current_password }}
          </p>
        </div>

        <div>
          <label for="new_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('profile.settings.newPassword') }}
          </label>
          <input
            id="new_password"
            v-model="passwordForm.new_password"
            type="password"
            required
            minlength="8"
            :disabled="passwordSubmitting"
            :class="[
              'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
              passwordFieldErrors.new_password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            ]"
          >
          <p v-if="passwordFieldErrors.new_password" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ passwordFieldErrors.new_password }}
          </p>
          <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ $t('profile.settings.passwordMinLength') }}
          </p>
        </div>

        <div>
          <label for="new_password_confirmation" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('profile.settings.confirmNewPassword') }}
          </label>
          <input
            id="new_password_confirmation"
            v-model="passwordForm.new_password_confirmation"
            type="password"
            required
            :disabled="passwordSubmitting"
            :class="[
              'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
              passwordFieldErrors.new_password_confirmation ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            ]"
          >
          <p v-if="passwordFieldErrors.new_password_confirmation" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ passwordFieldErrors.new_password_confirmation }}
          </p>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="!isPasswordValid || passwordSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="passwordSubmitting" class="h-4 w-4 animate-spin mr-2" />
            {{ $t('profile.settings.changePasswordButton') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Change Email Section -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <Mail class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ $t('profile.settings.changeEmail') }}</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {{ $t('profile.settings.changeEmailDescription') }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {{ $t('profile.settings.currentEmail') }}: <strong>{{ authStore?.user?.email ?? '-' }}</strong>
      </p>

      <!-- Success Message -->
      <div
        v-if="emailSuccess"
        class="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <div class="flex">
          <CheckCircle class="h-5 w-5 text-green-400" />
          <div class="ml-3">
            <p class="text-sm text-green-700 dark:text-green-400">
              {{ $t('profile.settings.emailChangeEmailSent') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="emailError"
        class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4"
      >
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-400">{{ emailError }}</p>
          </div>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="handleEmailChange">
        <div>
          <label for="new_email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('profile.settings.newEmail') }}
          </label>
          <input
            id="new_email"
            v-model="emailForm.email"
            type="email"
            required
            :disabled="emailSubmitting"
            :class="[
              'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
              emailFieldErrors.new_email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            ]"
          >
          <p v-if="emailFieldErrors.new_email" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ emailFieldErrors.new_email }}
          </p>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="!isEmailValid || emailSubmitting"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="emailSubmitting" class="h-4 w-4 animate-spin mr-2" />
            {{ $t('profile.settings.changeEmailButton') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
