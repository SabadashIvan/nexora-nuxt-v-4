<script setup lang="ts">
/**
 * Auth layout for authentication-related pages
 * Uses the same header/footer structure as the default layout.
 */
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <LayoutAppHeader />

    <main class="flex-1 flex items-center justify-center">
      <slot />
    </main>

    <LayoutAppFooter />
  </div>
</template>

