<script setup lang="ts">
/**
 * Root application component
 */

import { useAuthStore } from '~/stores/auth.store'

// Get current locale for page key - forces remount on language change
const { locale } = useI18n()

// Initialize on client
onMounted(async () => {
  // Access stores inside onMounted to ensure Pinia is initialized
  const authStore = useAuthStore()

  // Try to restore user session from token
  await authStore.initialize()
})
</script>

<template>
  <div>
    <Toaster position="top-right" richColors />
    <NuxtLayout>
      <!-- Key by locale to force page remount on language change -->
      <NuxtPage :key="locale" />
    </NuxtLayout>
  </div>
</template>

<style>
/* Global styles - Nuxt UI handles most styling */
html {
  scroll-behavior: smooth;
}
</style>
