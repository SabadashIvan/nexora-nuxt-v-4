<script setup lang="ts">
/**
 * Home page - SSR for SEO
 */
import { Truck, Award, Shirt } from 'lucide-vue-next'
import { useCatalogStore } from '~/stores/catalog.store'
import { useSystemStore } from '~/stores/system.store'
import { getToken, TOKEN_KEYS } from '~/utils/tokens'
import { getImageUrl } from '~/utils'
import type { BannersResponse } from '~/types'

// Locale-aware navigation
const localePath = useLocalePath()

// Get locale and currency for cache keys
const i18n = useI18n()
const { t } = useI18n()
const locale = computed(() => i18n.locale.value)
const systemStore = useSystemStore()
// Use cookie-based currency for reactivity (store updates from cookies)
const currency = computed(() => systemStore.currentCurrency)

// Get currency directly from cookie for cache key consistency between SSR and client
const getCurrencyForCacheKey = (): string => {
  return getToken(TOKEN_KEYS.CURRENCY) || 'USD'
}

// Fetch banners on SSR (locale-dependent only, no prices)
const { data: bannersResponse } = await useAsyncData(
  () => `home-banners-${locale.value}`,
  async () => {
    const api = useApi()
    try {
      const response = await api.get<BannersResponse>('/banners/homepage')
      return response
    } catch (error) {
      // Handle errors gracefully - return empty array
      console.warn('Failed to fetch banners:', error)
      return { data: [] } as BannersResponse
    }
  },
  {
    watch: [locale],
  }
)

const banners = computed(() => bannersResponse.value?.data || [])

// Fetch featured products and categories on SSR
// Access store inside callbacks to ensure Pinia is initialized
// Use getCurrencyForCacheKey() for cache key to ensure SSR/client consistency
const { data: featuredProducts, pending: productsLoading } = await useAsyncData(
  () => `home-featured-products-${locale.value}-${getCurrencyForCacheKey()}`,
  async () => {
    const catalogStore = useCatalogStore()
    await catalogStore.fetchProducts({ per_page: 8, sort: 'newest' })
    return catalogStore.products
  },
  {
    watch: [locale, currency],
  }
)

// Categories don't have prices, but names are locale-dependent
const { data: categories, refresh: refreshCategories } = await useAsyncData(
  () => `home-categories-${locale.value}`,
  async () => {
    const catalogStore = useCatalogStore()
    await catalogStore.fetchCategories()
    return catalogStore.rootCategories
  },
  {
    watch: [locale],
  }
)

// Watch for locale/currency changes to refetch data with new language/prices
// This is a backup to ensure data refreshes even if useAsyncData watch doesn't trigger
watch([locale, currency], async ([newLocale, newCurrency], [oldLocale, oldCurrency]) => {
  if (import.meta.client && (newLocale !== oldLocale || newCurrency !== oldCurrency)) {
    // Refresh all data when locale or currency changes
    await refreshNuxtData()
  }
}, { immediate: false })

const features = computed(() => [
  { icon: Truck, title: t('home.features.freeShipping.title'), description: t('home.features.freeShipping.description') },
  { icon: Award, title: t('home.features.warranty.title'), description: t('home.features.warranty.description') },
  { icon: Shirt, title: t('home.features.exchanges.title'), description: t('home.features.exchanges.description') },
])
</script>

<template>
  <div>
    <!-- Banners Slideshow -->
    <BannerSlideshow :banners="banners" />

    <!-- Features Section -->
    <div class="relative overflow-hidden bg-white">
      <div class="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
        <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
          <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div class="lg:pr-8 lg:pt-4">
              <div class="lg:max-w-lg">
                <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{{ $t('home.hero.title') }}</h2>
                <p class="mt-6 text-lg leading-8 text-gray-600">{{ $t('home.hero.description') }}</p>
              </div>
            </div>
            <div class="flex items-end justify-end lg:order-first">
              <img
                src="https://tailwindcss.com/plus-assets/img/ecommerce-images/incentives-07-hero.jpg"
                alt="Product screenshot"
                class="w-[48rem] max-w-full rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
              >
            </div>
          </div>
          <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div v-for="feature in features" :key="feature.title" class="relative pl-16">
                <dt class="text-base font-semibold leading-7 text-gray-900">
                  <div class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <component :is="feature.icon" class="h-6 w-6 text-white" />
                  </div>
                  {{ feature.title }}
                </dt>
                <dd class="mt-2 text-base leading-7 text-gray-600">{{ feature.description }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="relative overflow-hidden bg-white">
      <div class="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
        <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
          <div class="flex items-baseline justify-between border-b border-gray-200 pb-6">
            <h2 class="text-4xl font-bold tracking-tight text-gray-900">
              {{ $t('catalog.shopByCategory') }}
            </h2>
            <NuxtLink 
              :to="localePath('/categories')" 
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {{ $t('catalog.viewAll') }}
            </NuxtLink>
          </div>

          <div class="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <NuxtLink
              v-for="category in categories"
              :key="category.id"
              :to="localePath(`/categories/${category.slug}`)"
              class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              <NuxtImg
                v-if="getImageUrl(category.image)"
                :src="getImageUrl(category.image)"
                :alt="category.name || category.title"
                class="h-full w-full object-cover object-center group-hover:opacity-75"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div class="absolute inset-0 flex items-end p-4">
                <div>
                  <h3 class="text-lg font-semibold text-white">{{ category.title || category.name }}</h3>
                  <p v-if="category.products_count" class="text-sm text-gray-300">
                    {{ $t('catalog.productsCount', { count: category.products_count }) }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Products -->
    <div class="relative overflow-hidden bg-white">
      <div class="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
        <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
          <div class="flex items-baseline justify-between border-b border-gray-200 pb-6">
            <h2 class="text-4xl font-bold tracking-tight text-gray-900">
              Featured Products
            </h2>
            <NuxtLink 
              :to="localePath('/categories?sort=newest')" 
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View All
            </NuxtLink>
          </div>

          <div class="mt-12">
            <CatalogProductGrid 
              :products="featuredProducts || []" 
              :loading="productsLoading" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Newsletter Section -->
    <div class="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <div class="max-w-xl lg:max-w-lg">
            <h2 class="text-4xl font-semibold tracking-tight text-white">Subscribe to our newsletter</h2>
            <p class="mt-4 text-lg text-gray-300">Nostrud amet eu ullamco nisi aute in ad minim nostrud adipisicing velit quis. Duis tempor incididunt dolore.</p>
            <div class="mt-6">
              <AudienceNewsletterForm source="home_form" variant="horizontal" />
            </div>
          </div>
          <dl class="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
            <div class="flex flex-col items-start">
              <div class="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 text-white">
                  <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <dt class="mt-4 text-base font-semibold text-white">Weekly articles</dt>
              <dd class="mt-2 text-base/7 text-gray-400">Non laboris consequat cupidatat laborum magna. Eiusmod non irure cupidatat duis commodo amet.</dd>
            </div>
            <div class="flex flex-col items-start">
              <div class="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 text-white">
                  <path d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <dt class="mt-4 text-base font-semibold text-white">No spam</dt>
              <dd class="mt-2 text-base/7 text-gray-400">Officia excepteur ullamco ut sint duis proident non adipisicing. Voluptate incididunt anim.</dd>
            </div>
          </dl>
        </div>
      </div>
      <div aria-hidden="true" class="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-6">
        <div style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" class="aspect-1155/678 w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" />
      </div>
    </div>
  </div>
</template>

