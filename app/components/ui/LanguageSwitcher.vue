<script setup lang="ts">
/**
 * Language Switcher Component
 * Displays current language and allows switching between available languages
 */

import { ChevronDown } from 'lucide-vue-next'
import { useSystemStore } from '~/stores/system.store'

const isOpen = ref(false)
const systemStore = useSystemStore()

// useI18n composables must be called at the top level of setup
const i18n = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

// Access stores inside computed properties (lazy evaluation)
const currentLocale = computed(() => {
  // Prioritize i18n locale (from URL) as source of truth
  // Fallback to store locale if i18n is not available yet
  if (i18n?.locale?.value) {
    return i18n.locale.value as string
  }
  return systemStore.currentLocale || 'ru'
})

const availableLanguages = computed(() => {
  try {
    return systemStore.locales || []
  } catch {
    return []
  }
})

const currentLanguage = computed(() => {
  return availableLanguages.value.find(lang => lang.code === currentLocale.value) || {
    code: currentLocale.value,
    title: currentLocale.value.toUpperCase(),
  }
})

// Close dropdown when clicking outside
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-language-switcher]')) {
        isOpen.value = false
      }
    })
  }
})

async function switchLanguage(localeCode: string) {
  if (localeCode === currentLocale.value) {
    isOpen.value = false
    return
  }

  try {
    // Get the new path with locale prefix for current route
    // switchLocalePath(locale) automatically uses current route
    const newPath = switchLocalePath(localeCode as string)
    const currentPath = route.path

    // Update store first (updates state and cookie synchronously)
    // Cookie will be immediately available for Accept-Language header in API requests
    systemStore.setLocale(localeCode)

    // Update i18n locale
    if (i18n) {
      await i18n.setLocale(localeCode as string)
    }

    // Navigate to new locale path if it changed
    // This will update the URL with the locale prefix
    if (newPath && newPath !== currentPath) {
      await navigateTo(newPath)
    }

    // Refresh all page data with new locale
    // This ensures useAsyncData refetches with new Accept-Language header
    await refreshNuxtData()

    // Wait for locale change updates (SEO, etc.)
    await systemStore.onLocaleChange()

    isOpen.value = false
  } catch (error) {
    console.error('Failed to switch language:', error)
    isOpen.value = false
  }
}
</script>

<template>
  <div class="relative" data-language-switcher>
    <button
      type="button"
      class="flex items-center text-gray-700 hover:text-gray-800 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span class="block text-sm font-medium">{{ currentLanguage.title }}</span>
      <ChevronDown
        class="ml-1 h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
      <span class="sr-only">, change language</span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <button
          v-for="language in availableLanguages"
          :key="language.code"
          type="button"
          class="block w-full px-4 py-2 text-left text-sm transition-colors"
          :class="
            language.code === currentLocale
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          "
          @click="switchLanguage(language.code)"
        >
          <div class="flex items-center justify-between">
            <span>{{ language.title }}</span>
            <span class="text-xs text-gray-500">{{ language.code.toUpperCase() }}</span>
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

