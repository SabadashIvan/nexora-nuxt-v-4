<script setup lang="ts">
/**
 * Store locations page
 * Displays physical store/office locations
 * SSR enabled for SEO
 */
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-vue-next'
import type { SiteLocation, LocationSchedule } from '~/types'

definePageMeta({
  layout: 'default',
})

// Fetch locations with SSR
const { data: locations, pending } = await useAsyncData(
  'site-locations',
  async () => {
    const systemStore = useSystemStore()
    return await systemStore.fetchLocations()
  },
  {
    server: true,
    lazy: false,
  }
)

// Format schedule for display
function formatSchedule(schedule: LocationSchedule): { day: string; hours: string }[] {
  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  return days
    .map(({ key, label }) => ({
      day: label,
      hours: schedule[key as keyof LocationSchedule] || 'Closed',
    }))
    .filter(item => item.hours !== 'Closed' || true) // Show all days
}

// Get today's day for highlighting
const today = computed(() => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
})
</script>

<template>
  <div class="bg-white dark:bg-gray-950">
    <!-- Header -->
    <div class="bg-indigo-600 py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-white">
          {{ $t('stores.title') }}
        </h1>
        <p class="mt-2 text-lg text-indigo-100">
          {{ $t('stores.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Loading -->
      <div v-if="pending" class="grid gap-8 md:grid-cols-2">
        <div v-for="i in 2" :key="i" class="bg-gray-100 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
      </div>

      <!-- Locations grid -->
      <div v-else-if="locations && locations.length > 0" class="grid gap-8 md:grid-cols-2">
        <article
          v-for="location in locations"
          :key="location.id"
          class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <!-- Image -->
          <div v-if="location.image" class="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <NuxtImg
              :src="location.image"
              :alt="location.title"
              class="h-full w-full object-cover"
            />
          </div>

          <div class="p-6">
            <!-- Title -->
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ location.title }}
            </h2>

            <!-- Address -->
            <div class="mt-4 flex items-start gap-3">
              <MapPin class="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-gray-700 dark:text-gray-300">
                  {{ location.address }}
                </p>
                <a
                  v-if="location.address_link"
                  :href="location.address_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {{ $t('stores.viewOnMap') }}
                  <ExternalLink class="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <!-- Phones -->
            <div v-if="location.phones && location.phones.length > 0" class="mt-4 flex items-start gap-3">
              <Phone class="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div class="space-y-1">
                <a
                  v-for="(phone, index) in location.phones"
                  :key="index"
                  :href="`tel:${phone.replace(/\D/g, '')}`"
                  class="block text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {{ phone }}
                </a>
              </div>
            </div>

            <!-- Schedule -->
            <div class="mt-4 flex items-start gap-3">
              <Clock class="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div class="w-full">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {{ $t('stores.workingHours') }}
                </p>
                <div class="space-y-1 text-sm">
                  <div
                    v-for="{ day, hours } in formatSchedule(location.schedule)"
                    :key="day"
                    class="flex justify-between py-1"
                    :class="{
                      'text-indigo-600 dark:text-indigo-400 font-medium': today === day.toLowerCase(),
                      'text-gray-600 dark:text-gray-400': today !== day.toLowerCase()
                    }"
                  >
                    <span>{{ day }}</span>
                    <span>{{ hours }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Website link -->
            <a
              v-if="location.website_link"
              :href="location.website_link"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {{ $t('stores.visitWebsite') }}
              <ExternalLink class="h-3.5 w-3.5" />
            </a>

            <!-- Map iframe -->
            <div
              v-if="location.map_iframe"
              class="mt-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              v-html="location.map_iframe"
            />
          </div>
        </article>
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else
        :title="$t('stores.emptyTitle')"
        :description="$t('stores.emptyDescription')"
        :icon="MapPin"
      />
    </div>
  </div>
</template>

<style scoped>
/* Ensure map iframes are responsive */
:deep(iframe) {
  width: 100%;
  height: 200px;
  border: 0;
}
</style>
