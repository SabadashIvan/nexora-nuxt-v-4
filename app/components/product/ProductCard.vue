<script setup lang="ts">
/**
 * Product card for catalog listings
 */
import type { ProductListItem } from '~/types'
import { getImageUrl } from '~/utils'

interface Props {
  product: ProductListItem
}

const props = defineProps<Props>()

// Locale-aware navigation
const localePath = useLocalePath()

const _isAddingToCart = ref(false)
const _isTogglingFavorite = ref(false)

const productImage = computed(() => {
  return getImageUrl(props.product.image) || props.product.images?.[0]?.url
})

const formattedPrice = computed(() => {
  if (!props.product.price) return ''
  // Use the effective price (formatted string from API)
  return props.product.price.effective_minor || ''
})

const ratingCount = computed(() => props.product.rating?.count ?? 0)

const hasVariantOptions = computed(() => {
  const axes = props.product.variant_options?.axes ?? []
  const hasOptions = axes.length > 0 && axes.some(axis => {
    const opts = props.product.variant_options?.options?.[axis.code] ?? []
    return opts.length > 0
  })
  return hasOptions
})

const variantAxes = computed(() => {
  const axes = props.product.variant_options?.axes ?? []
  // Only return axes that have options
  return axes.filter(axis => {
    const opts = props.product.variant_options?.options?.[axis.code] ?? []
    return opts.length > 0
  })
})

function optionsForAxis(axisCode: string) {
  return props.product.variant_options?.options?.[axisCode] ?? []
}

// Debug: log data structure (remove in production)
if (import.meta.dev) {
  watch(() => props.product, (product) => {
    console.log('ProductCard product data:', {
      id: product?.id,
      title: product?.title,
      hasRating: !!product?.rating,
      rating: product?.rating,
      hasVariantOptions: !!product?.variant_options,
      variantOptions: product?.variant_options,
      axesCount: product?.variant_options?.axes?.length ?? 0,
      optionsKeys: product?.variant_options?.options ? Object.keys(product.variant_options.options) : [],
    })
  }, { immediate: true })
}

// Prefetch product data on hover for instant navigation (SWR-like behavior)
const prefetchPromises = new Map<string, Promise<unknown>>()

function prefetchProduct(targetSlug = props.product.slug) {
  if (!import.meta.client) return
  if (!targetSlug) return
  if (prefetchPromises.has(targetSlug)) return

  // Prefetch product data only once per slug
  // Use different key to avoid conflicts with page's useAsyncData
  const promise = useAsyncData(
    `prefetch-product-${targetSlug}`,
    () => {
      const api = useApi()
      return api.get(`/catalog/variants/${targetSlug}`)
    },
    {
      server: false, // Only prefetch on client
      lazy: true, // Don't block navigation
    }
  ).catch(() => {
    // Ignore prefetch errors - allow retry later
    prefetchPromises.delete(targetSlug)
  })

  prefetchPromises.set(targetSlug, promise)
}
</script>

<template>
  <div class="group">
    <!-- Main click target (avoid nested links with option chips below) -->
    <NuxtLink
      :to="localePath(`/product/${product.slug}`)"
      class="block"
      @mouseenter="prefetchProduct(product.slug)"
    >
      <NuxtImg
        v-if="productImage"
        :src="productImage"
        :alt="product.title"
        class="aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-7/8"
        loading="lazy"
        fetchpriority="low"
      />
      <div
        v-else
        class="aspect-square w-full rounded-lg bg-gray-200 flex items-center justify-center xl:aspect-7/8"
      >
        <span class="text-gray-400">{{ $t('product.card.noImage') }}</span>
      </div>

      <h3 class="mt-4 text-sm text-gray-700">{{ product.title }}</h3>

      <!-- Rating preview (always show, including when 0) -->
      <div class="mt-1 flex items-center gap-1.5">
        <UiRating
          :rating="product.rating?.value ?? 0"
          :reviews-count="ratingCount"
          :show-count="false"
          size="sm"
        />
        <span class="text-xs text-gray-500">({{ ratingCount }})</span>
      </div>

      <p class="mt-1 text-lg font-bold text-black">{{ formattedPrice }}</p>
    </NuxtLink>

    <!-- Variant option quick links -->
    <div v-if="hasVariantOptions" class="mt-3 space-y-2.5">
      <div v-for="axis in variantAxes" :key="axis.code" class="space-y-1.5">
        <div class="text-xs font-medium text-gray-600">{{ axis.title }}</div>
        <div class="flex flex-wrap gap-1.5">
          <template v-for="opt in optionsForAxis(axis.code)" :key="opt.value_id">
            <NuxtLink
              v-if="opt.is_in_stock && opt.slug"
              :to="localePath(`/product/${opt.slug}`)"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
              @mouseenter="prefetchProduct(opt.slug)"
            >
              {{ opt.label }}
            </NuxtLink>
            <span
              v-else
              class="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 cursor-not-allowed"
              :title="$t('product.outOfStock')"
            >
              {{ opt.label }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

