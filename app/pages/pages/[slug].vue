<script setup lang="ts">
/* eslint-disable vue/no-v-html */
/**
 * Dynamic static page - SSR for SEO
 * Handles all static pages like /pages/terms, /pages/privacy, etc.
 */
import { useApi } from '~/composables/useApi'
import type { PageResponse } from '~/types'

const route = useRoute()
const api = useApi()

// Get slug from route params
const slug = computed(() => route.params.slug as string)

// Get locale for cache key and watching
const i18n = useI18n()
const locale = computed(() => i18n.locale.value)

// Fetch page with SSR
// Note: useApi() automatically includes Accept-Language header from locale cookie
const { data: pageData, pending, refresh } = await useAsyncData<PageResponse>(
  `static-page-${slug.value}-${locale.value}`,
  async () => {
    const currentSlug = slug.value
    return await api.get<PageResponse>(`/site/pages/${currentSlug}`)
  },
  {
    // Watch locale and slug to refetch when language or page changes
    watch: [slug, locale],
    server: true,
  }
)

const page = computed(() => pageData.value?.data)

// Watch for route changes to ensure we refetch on client-side navigation
watch(() => route.params.slug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug && import.meta.client) {
    await refresh()
  }
}, { immediate: false })

// Handle 404
if (!page.value && !pending.value) {
  throw createError({
    status: 404,
    statusText: 'Page Not Found',
  })
}

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (!page.value) {
    return []
  }
  return [
    { label: page.value.title || 'Page' },
  ]
})

// Determine H1 title
const h1Title = computed(() => {
  if (page.value?.seo?.title_h1) return page.value.seo.title_h1
  return page.value?.title || 'Page'
})

// SEO meta tags
useHead({
  title: page.value?.seo?.title || page.value?.title || 'Page',
  meta: [
    { 
      name: 'description', 
      content: page.value?.seo?.description || page.value?.excerpt || '' 
    },
    ...(page.value?.seo?.keywords ? [{ name: 'keywords', content: page.value.seo.keywords }] : []),
    ...(page.value?.seo?.robots && page.value.seo.robots.trim() 
      ? [{ name: 'robots', content: page.value.seo.robots }] 
      : []),
    ...(page.value?.seo?.og_image && page.value.seo.og_image.trim() 
      ? [{ property: 'og:image', content: page.value.seo.og_image }] 
      : []),
    ...(page.value?.seo?.title 
      ? [{ property: 'og:title', content: page.value.seo.title }] 
      : []),
    ...(page.value?.seo?.description 
      ? [{ property: 'og:description', content: page.value.seo.description }] 
      : []),
  ],
  link: [
    ...(page.value?.seo?.canonical ? [{ rel: 'canonical', href: page.value.seo.canonical }] : []),
  ],
})
</script>

<template>
  <div class="relative overflow-hidden bg-white">
    <div class="pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
      <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <!-- Breadcrumbs -->
        <UiBreadcrumbs :items="breadcrumbs" class="mb-6" />
        
        <!-- Loading -->
        <div v-if="pending" class="animate-pulse space-y-6">
          <div class="h-10 bg-gray-200 rounded w-3/4 max-w-4xl mx-auto" />
          <div class="h-4 bg-gray-200 rounded w-1/2 max-w-4xl mx-auto" />
          <div class="space-y-3 max-w-4xl mx-auto">
            <div class="h-4 bg-gray-200 rounded" />
            <div class="h-4 bg-gray-200 rounded" />
            <div class="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>

        <!-- Content -->
        <div v-else-if="page" class="">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            {{ h1Title }}
          </h1>
          
          <div 
            v-if="page.content"
            class="prose prose-lg dark:prose-invert max-w-none"
            v-html="page.content"
          />
          <div v-else class="prose prose-lg dark:prose-invert max-w-none">
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('emptyStates.noContent') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
