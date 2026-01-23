<script setup lang="ts">
/**
 * Product card for catalog listings
 */
import { Heart, ShoppingCart, Eye } from 'lucide-vue-next'
import type { ProductListItem } from '~/types'
import { getImageUrl } from '~/utils'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Get i18n for translations
const { t } = useI18n()

interface Props {
  product: ProductListItem
}

const props = defineProps<Props>()

// Locale-aware navigation
const localePath = useLocalePath()

const isAddingToCart = ref(false)
const isTogglingFavorite = ref(false)

const productImage = computed(() => {
  return getImageUrl(props.product.image) || props.product.images?.[0]?.url
})

const formattedPrice = computed(() => {
  if (!props.product.price) return ''
  // Use the effective price (formatted string from API)
  return props.product.price.effective_minor || ''
})

// Access stores inside computed
const isFavorite = computed(() => {
  try {
    return useFavoritesStore().isFavorite(props.product.id)
  } catch {
    return false
  }
})

async function addToCart() {
  isAddingToCart.value = true
  const cartStore = useCartStore()
  const success = await cartStore.addItem(props.product.id, 1)
  isAddingToCart.value = false
  
  if (success) {
    $toast.success(t('cart.itemAdded') || 'Item added to cart')
  } else if (cartStore.error) {
    $toast.error(cartStore.error)
  }
}

async function toggleFavorite() {
  isTogglingFavorite.value = true
  const favoritesStore = useFavoritesStore()
  await favoritesStore.toggleFavorite(props.product.id)
  isTogglingFavorite.value = false
}

// Prefetch product data on hover for instant navigation (SWR-like behavior)
let prefetchPromise: Promise<any> | null = null

function prefetchProduct() {
  if (import.meta.client && !prefetchPromise) {
    // Prefetch product data only once per card
    // Use different key to avoid conflicts with page's useAsyncData
    prefetchPromise = useAsyncData(
      `prefetch-product-${props.product.slug}`, 
      () => {
        const api = useApi()
        return api.get(`/catalog/variants/${props.product.slug}`)
      }, 
      { 
        server: false, // Only prefetch on client
        lazy: true, // Don't block navigation
      }
    ).catch(() => {
      // Ignore prefetch errors - reset promise so we can try again
      prefetchPromise = null
    })
  }
}
</script>

<template>
  <NuxtLink 
    :to="localePath(`/product/${product.slug}`)" 
    class="group"
    @mouseenter="prefetchProduct"
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
    <p class="mt-1 text-lg font-bold text-black">{{ formattedPrice }}</p>
  </NuxtLink>
</template>

