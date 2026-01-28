<script setup lang="ts">
/**
 * Product detail page - SSR for SEO
 */
import { Heart, ShoppingCart, Share2, GitCompare, Phone, CheckCircle2 } from 'lucide-vue-next'
import { useProductStore } from '~/stores/product.store'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'
import { useComparisonStore } from '~/stores/comparison.store'
import { useCatalogStore } from '~/stores/catalog.store'
import { useVariantAxes } from '~/composables/useVariantAxes'
import { ERROR_CODES } from '~/utils/errors'
import { TOKEN_KEYS } from '~/utils/tokens'
import type { Category, Product } from '~/types'
import type { ProductPrice } from '~/types/catalog'

const route = useRoute()

// Locale-aware navigation
const localePath = useLocalePath()

// Get locale and currency for cache key
const i18n = useI18n()
const locale = computed(() => i18n.locale.value)
const { t } = i18n

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Use useCookie for SSR/client consistent currency reading
// This is critical for cache key consistency - useCookie handles hydration correctly
// Options must match how the cookie is set in tokens.ts for proper SSR reading
const currencyCookie = useCookie<string>(TOKEN_KEYS.CURRENCY, {
  default: () => 'USD',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})
const currency = computed(() => currencyCookie.value)

const slug = computed(() => route.params.slug as string)

const productErrorStatus = computed(() => {
  try {
    return useProductStore().errorStatus
  } catch {
    return null
  }
})

const didClientRefetch = ref(false)

// Fetch product with SSR + client-side navigation support
// Using useAsyncData with proper watch to ensure data loads on navigation
// routeRules with swr: 3600 handles SSR caching at the route level
// Uses currency computed backed by useCookie for SSR/client consistency
const { data: asyncProduct, pending, error, status, refresh } = await useAsyncData(
  () => `product-${slug.value}-${locale.value}-${currency.value}`,
  async () => {
    // Access store and api inside callback to preserve SSR context
    const api = useApi()
    const productStore = useProductStore()
    const prod = await productStore.fetch(slug.value, api)

    // TODO(backend): Ideally the backend should return the full category ancestor path
    // for product categories (or include it in the product response). Today we fetch the
    // entire categories tree to build hierarchical breadcrumbs (Home → root → … → category).
    const catalogStore = useCatalogStore()
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories(api)
    }

    return prod
  },
  {
    watch: [() => route.params.slug, locale, currency],
    server: true,
    // Don't use getCachedData - it can return stale data with wrong locale/currency
    // Let Nuxt handle caching based on the key which includes locale and currency
    default: () => null,
  }
)

const storeProduct = computed(() => {
  try {
    return useProductStore().product
  } catch {
    return null
  }
})

const product = computed(() => asyncProduct.value ?? storeProduct.value)

const variantOptions = computed(() => product.value?.variant_options)
const { remainingAxes } = useVariantAxes(variantOptions)

// Watch for route changes to ensure we refetch on client-side navigation
// This is a backup to ensure data loads even if watch in useAsyncData doesn't trigger
watch(() => route.params.slug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug && import.meta.client) {
    console.log('[Route] Slug changed on client, refreshing data:', { oldSlug, newSlug })
    await refresh()
  }
}, { immediate: false })

// Watch for locale/currency changes to refetch product with new language/prices
// This is a backup to ensure data refreshes even if useAsyncData watch doesn't trigger
watch([locale, currency], async ([newLocale, newCurrency], [oldLocale, oldCurrency]) => {
  if (import.meta.client && (newLocale !== oldLocale || newCurrency !== oldCurrency)) {
    console.log('[Locale/Currency] Changed, refreshing product:', { newLocale, newCurrency })
    await refresh()
  }
}, { immediate: false })

// Debug logging (only on client, after mount to avoid hydration issues)
onMounted(() => {
  isMounted.value = true
  if (import.meta.client) {
    if (!didClientRefetch.value && !asyncProduct.value && (error.value || status.value === 'error')) {
      didClientRefetch.value = true
      refresh()
    }
    console.log('[Client] Product value on mount:', asyncProduct.value)
    console.log('[Client] Product value type:', typeof asyncProduct.value)
    console.log('[Client] Product value keys:', asyncProduct.value ? Object.keys(asyncProduct.value) : 'null')
    
    // Check if product.value is wrapped in { data: ... }
    if (asyncProduct.value && typeof asyncProduct.value === 'object' && 'data' in asyncProduct.value) {
      console.warn('[Client] Product value is wrapped in data object! Unwrapping...')
      // This shouldn't happen, but if it does, we need to handle it
    }
    
    watch(() => asyncProduct.value, (newProduct) => {
      console.log('[Client] Product value changed:', newProduct)
      if (newProduct) {
        // Check if it's wrapped in { data: ... }
        let actualProduct: Product | null = null
        if (typeof newProduct === 'object' && newProduct !== null) {
          if ('data' in newProduct && newProduct.data) {
            console.warn('[Client] Product value is wrapped in data object! Unwrapping...')
            actualProduct = newProduct.data as Product
          } else if ('id' in newProduct || 'title' in newProduct) {
            actualProduct = newProduct as Product
          }
        }
        if (actualProduct) {
          console.log('[Client] Product loaded:', {
            id: actualProduct.id,
            title: actualProduct.title,
            hasPrice: !!actualProduct.price,
          })
        } else {
          console.warn('[Client] Could not extract product from:', newProduct)
        }
      } else {
        console.warn('[Client] Product is null or undefined')
      }
    }, { immediate: true })
    
    // Log product state for debugging
    watchEffect(() => {
      console.log('[Client WatchEffect] Product state:', {
        hasProduct: !!product.value,
        productId: product.value?.id,
        productTitle: product.value?.title,
        pending: pending.value,
        error: error.value,
      })
    })
  }
})

// Handle 404 - but only after we're sure data is loaded
// Use watch to handle 404 after data loads (both SSR and CSR)
watch([status, product, error, productErrorStatus], ([currentStatus, prod, err, errorStatus]) => {
  if (currentStatus === 'success' && !prod && !err && errorStatus === ERROR_CODES.NOT_FOUND) {
    console.warn('[SSR/CSR] Product not found, throwing 404')
    throw createError({
      status: 404,
      statusText: 'Product Not Found',
    })
  }
}, { immediate: true })

// Local state
const quantity = ref(1)
const selectedImageIndex = ref(0)
const isAddingToCart = ref(false)
const isMounted = ref(false)
const showQuickBuyModal = ref(false)

// Computed - use product.value directly (from useAsyncData)
const currentVariant = computed(() => product.value)
const images = computed(() => product.value?.images || [])
const currentImage = computed(() => images.value[selectedImageIndex.value]?.url)
const inStock = computed(() => {
  if (!product.value) return false
  return product.value.is_in_stock ?? product.value.in_stock ?? false
})
const _hasDiscount = computed(() => {
  if (!product.value) return false
  if (typeof product.value.price === 'object' && product.value.price !== null) {
    const list = parseFloat(product.value.price.list_minor.replace(/[^0-9.]/g, '')) || 0
    const effective = parseFloat(product.value.price.effective_minor.replace(/[^0-9.]/g, '')) || 0
    return effective < list
  }
  return (product.value.effective_price || 0) < (typeof product.value.price === 'number' ? product.value.price : 0)
})
const isFavorite = computed(() => {
  // During SSR, only use product data to ensure hydration consistency
  if (product.value?.is_favorite !== undefined) {
    return product.value.is_favorite
  }
  // On client, check favorites store
  if (import.meta.client) {
    try {
      return useFavoritesStore().isFavorite(product.value?.id || 0)
    } catch {
      return false
    }
  }
  return false
})

const isInComparison = computed(() => {
  // On client, check comparison store
  if (import.meta.client) {
    try {
      return useComparisonStore().isInComparison(product.value?.id || 0)
    } catch {
      return false
    }
  }
  return false
})

// Computed for QuickBuyModal product info
const quickBuyProductInfo = computed(() => {
  if (!product.value) return null
  return {
    variantId: product.value.id,
    title: product.value.title,
    price: product.value.price?.formatted?.effective || undefined,
  }
})

const productTitle = computed(() => {
  return product.value?.title || product.value?.name || 'Product'
})
const productRating = computed(() => {
  if (product.value?.rating && typeof product.value.rating === 'object') {
    return product.value.rating.value || 0
  }
  // Legacy support: rating as number
  return typeof product.value?.rating === 'number' ? product.value.rating : 0
})
const reviewsCount = computed(() => {
  if (product.value?.rating && typeof product.value.rating === 'object') {
    return product.value.rating.count || 0
  }
  // Legacy support
  return (product.value as Product & { reviews_count?: number })?.reviews_count || 0
})
const productPrice = computed((): ProductPrice | null => {
  if (!product.value) return null
  // Check if price is an object (ProductPrice type) with required properties
  const price = product.value.price
  if (price && typeof price === 'object' && price !== null && 'currency' in price && 'effective_minor' in price) {
    return price as ProductPrice
  }
  return null
})
const legacyPriceValue = computed((): number | null => {
  if (!product.value) return null
  // Return numeric price if available, otherwise effective_price
  if (typeof product.value.price === 'number' && product.value.price > 0) {
    return product.value.price
  }
  if (typeof product.value.effective_price === 'number' && product.value.effective_price > 0) {
    return product.value.effective_price
  }
  return null
})
const priceToDisplay = computed((): ProductPrice | number | null => {
  // Return ProductPrice object if available
  if (productPrice.value !== null) {
    return productPrice.value
  }
  // Return numeric price if available
  if (legacyPriceValue.value !== null) {
    return legacyPriceValue.value
  }
  return null
})
const _productBrand = computed(() => {
  return product.value?.product?.brand
})
const _productCategories = computed(() => {
  return product.value?.product?.categories || []
})

// Breadcrumbs - ensure stable structure for SSR hydration
// Always return at least Catalog + Product to ensure consistent DOM structure
const breadcrumbs = computed(() => {
  const { t } = useI18n()
  const items: Array<{ label: string; to?: string }> = [
    { label: t('breadcrumbs.home'), to: localePath('/') },
  ]

  // Prefer hierarchical category path (root → … → category) and choose the deepest category
  // when a product belongs to multiple categories.
  const productCategories = product.value?.product?.categories || []
  let bestPath: Category[] = []

  if (productCategories.length > 0) {
    try {
      const catalogStore = useCatalogStore()
      for (const cat of productCategories) {
        if (!cat?.slug) continue
        const path = catalogStore.getCategoryPathBySlug(cat.slug) || []

        // If the tree doesn't contain this category, treat it as depth 1 fallback.
        const effectivePath = path.length > 0 ? path : [cat as Category]
        if (effectivePath.length > bestPath.length) {
          bestPath = effectivePath
        }
      }
    } catch {
      // Store not available; fallback handled below
    }
  }

  if (bestPath.length === 0 && productCategories.length > 0) {
    // Fallback to first category if we couldn't derive a path
    const first = productCategories[0]
    if (first) bestPath = [first as Category]
  }

  for (const node of bestPath) {
    const label = node.title || node.name || t('product.page.category')
    const to = node.slug ? localePath(`/categories/${node.slug}`) : undefined
    items.push({ label, to })
  }

  // Last item - always add product title (or placeholder). No brand crumb.
  items.push({
    label: product.value?.title || product.value?.name || t('product.page.product'),
    to: '#',
  })

  return items
})

// Methods
async function addToCart() {
  if (!currentVariant.value || !inStock.value) return
  
  isAddingToCart.value = true
  const cartStore = useCartStore()
  const success = await cartStore.addItem(currentVariant.value.id, quantity.value)
  isAddingToCart.value = false
  
  if (success) {
    $toast.success(t('cart.itemAdded') || 'Item added to cart')
  } else if (cartStore.error) {
    $toast.error(cartStore.error)
  }
}

async function toggleFavorite() {
  if (!product.value) return
  const favoritesStore = useFavoritesStore()
  const wasFavorite = isFavorite.value
  const success = await favoritesStore.toggleFavorite(product.value.id)
  
  if (success) {
    if (wasFavorite) {
      $toast.success(t('favorites.removedFromWishlist') || 'Removed from wishlist')
    } else {
      $toast.success(t('favorites.addedToWishlist') || 'Added to wishlist')
    }
  } else if (favoritesStore.error) {
    $toast.error(favoritesStore.error || t('favorites.error') || 'Failed to update wishlist')
  }
}

async function toggleComparison() {
  if (!product.value) return
  const comparisonStore = useComparisonStore()
  const wasInComparison = isInComparison.value
  
  // Check if comparison is full before adding
  if (!wasInComparison && comparisonStore.isFull) {
    $toast.error(
      t('comparison.maxItemsReached', { count: comparisonStore.maxItems }) || 
      `Maximum ${comparisonStore.maxItems} items can be compared`
    )
    return
  }
  
  const success = await comparisonStore.toggleComparison(product.value.id)
  
  if (success) {
    if (wasInComparison) {
      $toast.success(t('comparison.removedFromComparison') || 'Removed from comparison')
    } else {
      $toast.success(t('comparison.addedToComparison') || 'Added to comparison')
    }
  } else if (comparisonStore.error) {
    $toast.error(comparisonStore.error || t('comparison.error') || 'Failed to update comparison')
  }
}

function _incrementQuantity() {
  quantity.value++
}

function _decrementQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}


// Get first 4 images for grid layout
const gridImages = computed(() => {
  const allImages = images.value
  if (allImages.length <= 1) return []
  return allImages.slice(0, 4)
})

// Prefetch product data on hover for instant navigation (SWR-like behavior)
// Note: Prefetching is now handled by ColorSwatchSelector and SizeSelector components
</script>

<template>
  <div class="bg-white">
    <div class="pt-6">
      <!-- Error -->
      <div v-if="error" class="text-center py-12">
        <p class="text-red-600">Error loading product: {{ error }}</p>
      </div>

      <!-- Breadcrumbs -->
      <nav v-if="!error && !pending" aria-label="Breadcrumb" class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <ol role="list" class="flex items-center space-x-2">
          <li v-for="(breadcrumb, index) in breadcrumbs" :key="index">
            <div class="flex items-center">
              <NuxtLink
                v-if="breadcrumb.to && breadcrumb.to !== '#' && index !== breadcrumbs.length - 1"
                :to="breadcrumb.to"
                class="mr-2 text-sm font-medium text-gray-900"
              >
                {{ breadcrumb.label }}
              </NuxtLink>
              <span
                v-else
                class="mr-2 text-sm font-medium"
                :class="index === breadcrumbs.length - 1 ? 'text-gray-500' : 'text-gray-900'"
                :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
              >
                {{ breadcrumb.label }}
              </span>
              <svg
                v-if="index < breadcrumbs.length - 1"
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="currentColor"
                aria-hidden="true"
                class="h-5 w-4 text-gray-300"
              >
                <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
              </svg>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Loading -->
      <div v-if="pending" class="animate-pulse mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="aspect-square bg-gray-200 rounded-xl" />
          <div class="space-y-4">
            <div class="h-8 bg-gray-200 rounded w-3/4" />
            <div class="h-6 bg-gray-200 rounded w-1/2" />
            <div class="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="product">
        <!-- Image gallery -->
        <div class="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
          <!-- Grid layout for multiple images -->
          <template v-if="gridImages.length >= 4 && gridImages[0] && gridImages[1] && gridImages[2] && gridImages[3]">
            <NuxtImg
              :src="gridImages[0].url"
              :alt="gridImages[0].alt || `${productTitle} - Image 1`"
              class="row-span-2 aspect-3/4 size-full rounded-lg object-cover max-lg:hidden"
            />
            <NuxtImg
              :src="gridImages[1].url"
              :alt="gridImages[1].alt || `${productTitle} - Image 2`"
              class="col-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden"
            />
            <NuxtImg
              :src="gridImages[2].url"
              :alt="gridImages[2].alt || `${productTitle} - Image 3`"
              class="col-start-2 row-start-2 aspect-3/2 size-full rounded-lg object-cover max-lg:hidden"
            />
            <NuxtImg
              :src="gridImages[3].url"
              :alt="gridImages[3].alt || `${productTitle} - Image 4`"
              class="row-span-2 aspect-4/5 size-full object-cover sm:rounded-lg lg:aspect-3/4"
            />
          </template>
          
          <!-- Fallback: single main image or carousel -->
          <template v-else>
            <div class="aspect-square bg-white rounded-xl overflow-hidden">
              <NuxtImg
                v-if="currentImage"
                :src="currentImage"
                :alt="productTitle"
                class="w-full h-full object-contain"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            </div>
            
            <!-- Thumbnails -->
            <div v-if="images.length > 1" class="mt-4 flex gap-3 overflow-x-auto pb-2 lg:hidden">
              <button
                v-for="(image, index) in images"
                :key="image.id"
                class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
                :class="[
                  index === selectedImageIndex 
                    ? 'border-indigo-600' 
                    : 'border-transparent hover:border-gray-300'
                ]"
                @click="selectedImageIndex = index"
              >
                <NuxtImg
                  :src="image.url"
                  :alt="`${productTitle} ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </template>
        </div>

        <!-- Product info -->
        <div class="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <!-- Left column: Product title and SKU -->
          <div class="lg:col-span-2 lg:mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{{ productTitle }}</h1>
            <p v-if="product.sku" class="mt-2 text-sm text-gray-500">
              SKU: {{ product.sku }}
            </p>
          </div>

          <!-- Right column: Product details and actions -->
          <div class="mt-8 lg:col-start-2 lg:row-start-2 lg:mt-0">
            <h2 class="sr-only">{{ $t('product.page.productInformation') }}</h2>
            
            <!-- Rating -->
            <div class="flex items-center gap-2">
              <UiRating :rating="productRating" :reviews-count="reviewsCount" :show-count="false" />
              <span class="text-sm text-gray-500">({{ reviewsCount }})</span>
            </div>

            <!-- Price -->
            <div v-if="product && priceToDisplay !== null" class="mt-4">
              <template v-if="productPrice !== null">
                <UiPrice :price="productPrice" size="xl" />
              </template>
              <template v-else-if="legacyPriceValue !== null && typeof legacyPriceValue === 'number'">
                <UiPrice
                  :price="legacyPriceValue"
                  :effective-price="product.effective_price"
                  :currency="product.currency"
                  size="xl"
                />
              </template>
            </div>

            <!-- In Stock indicator -->
            <div v-if="inStock" class="mt-4 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 class="h-5 w-5" />
              <span>{{ $t('product.page.inStock') || 'In Stock' }}</span>
            </div>
            <div v-else class="mt-4 flex items-center gap-2 text-sm text-red-600">
              <span>{{ $t('product.page.outOfStock') || 'Out of Stock' }}</span>
            </div>

            <form class="mt-6" @submit.prevent="addToCart">
              <!-- Color Swatch Selector -->
              <ProductColorSwatchSelector
                v-if="product?.variant_options"
                :product="product"
                :variant-options="product.variant_options"
                class="mt-6"
              />

              <!-- Size Selector -->
              <ProductSizeSelector
                v-if="product?.variant_options"
                :product="product"
                :variant-options="product.variant_options"
                class="mt-6"
              />

              <!-- Other variant axes (e.g. material, length) -->
              <template v-if="product?.variant_options">
                <ProductVariantAxisSelector
                  v-for="axis in remainingAxes"
                  :key="axis.code"
                  :product="product"
                  :variant-options="product.variant_options"
                  :axis="axis"
                  class="mt-6"
                />
              </template>

              <!-- Quantity and Add to Cart -->
              <div class="mt-10 flex items-center gap-4">
                <UiQuantitySelector v-model="quantity" :disabled="!inStock" />
                <button
                  type="submit"
                  :disabled="!inStock || isAddingToCart"
                  class="flex flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UiSpinner v-if="isAddingToCart" size="sm" class="mr-2" />
                  <ShoppingCart v-else class="mr-2 h-5 w-5" />
                  {{ $t('product.page.addToBag') }}
                </button>
              </div>

              <!-- Secondary actions -->
              <div class="mt-4 flex gap-4">
                <button
                  type="button"
                  class="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                  :class="{ 'text-red-500': isFavorite }"
                  @click="toggleFavorite"
                >
                  <Heart class="h-5 w-5" :class="{ 'fill-current': isFavorite }" />
                  <span class="text-sm">{{ isFavorite ? $t('product.page.inWishlist') : $t('product.page.addToWishlist') }}</span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
                  :class="{ 'text-indigo-600': isInComparison }"
                  @click="toggleComparison"
                >
                  <GitCompare class="h-5 w-5" :class="{ 'fill-current': isInComparison }" />
                  <span class="text-sm">{{ isInComparison ? $t('product.page.inComparison') : $t('product.page.addToComparison') }}</span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <Share2 class="h-5 w-5" />
                  <span class="text-sm">{{ $t('product.page.share') }}</span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                  @click="showQuickBuyModal = true"
                >
                  <Phone class="h-5 w-5" />
                  <span class="text-sm">{{ $t('product.page.quickBuy') }}</span>
                </button>
              </div>

              <!-- Guarantees/Services Section -->
              <ProductGuarantees />
            </form>
          </div>
        </div>

        <!-- Product Tabs Section -->
        <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <ProductTabs
            v-if="product"
            :product="product"
            :product-id="product.product_id"
          />
        </div>

        <!-- Recommended Products Section -->
        <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 pb-16">
          <ClientOnly>
            <ProductRecommendations v-if="product?.id" :variant-id="product.id" :limit="8" />
          </ClientOnly>
        </div>

      </div>
    </div>

    <!-- Quick Buy Modal -->
    <ProductQuickBuyModal
      v-if="quickBuyProductInfo"
      v-model:is-open="showQuickBuyModal"
      :product="quickBuyProductInfo"
    />
  </div>
</template>
