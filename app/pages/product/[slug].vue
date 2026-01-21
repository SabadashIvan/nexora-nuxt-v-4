<script setup lang="ts">
/* eslint-disable vue/no-v-html */
/**
 * Product detail page - SSR for SEO
 */
import { Heart, ShoppingCart, Share2, GitCompare, Phone } from 'lucide-vue-next'
import { useProductStore } from '~/stores/product.store'
import { useCartStore } from '~/stores/cart.store'
import { useFavoritesStore } from '~/stores/favorites.store'
import { useComparisonStore } from '~/stores/comparison.store'
import { useSystemStore } from '~/stores/system.store'
import type { Product } from '~/types'
import type { ProductPrice } from '~/types/catalog'

const route = useRoute()

// Locale-aware navigation
const localePath = useLocalePath()

// Get locale and currency for cache key
const i18n = useI18n()
const locale = computed(() => i18n.locale.value)
const systemStore = useSystemStore()
const currency = computed(() => systemStore.currentCurrency)

const slug = computed(() => route.params.slug as string)

// Fetch product with SSR + client-side navigation support
// Using useAsyncData with proper watch to ensure data loads on navigation
// routeRules with swr: 3600 handles SSR caching at the route level
// Include currency in key and watch array since products have prices
const { data: product, pending, error, refresh } = await useAsyncData(
  () => `product-${slug.value}-${locale.value}-${currency.value}`,
  async () => {
    const productStore = useProductStore()
    return await productStore.fetch(slug.value)
  },
  {
    watch: [() => route.params.slug, locale, currency],
    server: true,
    // Don't use getCachedData - it can return stale data with wrong locale/currency
    // Let Nuxt handle caching based on the key which includes locale and currency
    default: () => null,
  }
)

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
    console.log('[Client] Product value on mount:', product.value)
    console.log('[Client] Product value type:', typeof product.value)
    console.log('[Client] Product value keys:', product.value ? Object.keys(product.value) : 'null')
    
    // Check if product.value is wrapped in { data: ... }
    if (product.value && typeof product.value === 'object' && 'data' in product.value) {
      console.warn('[Client] Product value is wrapped in data object! Unwrapping...')
      // This shouldn't happen, but if it does, we need to handle it
    }
    
    watch(() => product.value, (newProduct) => {
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
watch([product, pending, error], ([prod, isPending, err]) => {
  if (!isPending && !prod && !err) {
    console.warn('[SSR/CSR] Product not found, throwing 404')
    throw createError({
      statusCode: 404,
      statusMessage: 'Product Not Found',
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

// Helper to compute selected options from product data (for SSR/initial render consistency)
const computeSelectedOptionsFromProduct = (): Record<string, string> => {
  const options: Record<string, string> = {}
  if (product.value?.attribute_values && product.value.attribute_values.length > 0) {
    product.value.attribute_values.forEach(attr => {
      options[attr.attribute.code] = attr.code
    })
  }
  return options
}

const selectedOptions = computed(() => {
  // Always compute from product data during SSR and initial client render (before mount)
  // This ensures hydration consistency
  if (import.meta.server || !isMounted.value) {
    return computeSelectedOptionsFromProduct()
  }
  // After mount, use store (which may have been modified by user interactions)
  try {
    const storeOptions = useProductStore().selectedOptions
    // Merge with product data to ensure we have all options
    const productOptions = computeSelectedOptionsFromProduct()
    return { ...productOptions, ...storeOptions }
  } catch {
    return computeSelectedOptionsFromProduct()
  }
})
// Helper to compute available options from product data (for SSR/initial render consistency)
const computeAvailableOptionsFromProduct = () => {
  if (!product.value) return []
  
  // New structure: variant_options
  if (product.value.variant_options) {
    const currentAttributeValues = product.value.attribute_values || []
    
    return product.value.variant_options.axes.map(axis => {
      return {
        code: axis.code,
        name: axis.title,
        values: (product.value!.variant_options?.options[axis.code] || []).map(opt => {
          const matchingAttr = currentAttributeValues.find(av => 
            av.attribute.code === axis.code && 
            av.label.toLowerCase() === opt.label.toLowerCase()
          )
          
          return {
            value: matchingAttr?.code || opt.label,
            label: opt.label,
            is_available: opt.is_in_stock,
            slug: opt.slug,
            value_id: opt.value_id,
          }
        }),
      }
    })
  }
  
  // Legacy structure: options
  return product.value.options || []
}

const availableOptions = computed(() => {
  // Always compute from product data during SSR and initial client render (before mount)
  // This ensures hydration consistency
  if (import.meta.server || !isMounted.value) {
    return computeAvailableOptionsFromProduct()
  }
  // After mount, use store (which may have computed values)
  try {
    return useProductStore().availableOptions
  } catch {
    return computeAvailableOptionsFromProduct()
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
    { label: t('product.page.categories'), to: localePath('/categories') },
  ]
  
  // Add category breadcrumbs if available
  if (product.value?.product?.categories && product.value.product.categories.length > 0) {
    const mainCategory = product.value.product.categories[0]
    if (mainCategory?.slug) {
      items.push({ 
        label: mainCategory.title || mainCategory.name || t('product.page.category'), 
        to: localePath(`/categories/${mainCategory.slug}`) 
      })
    }
  }
  
  // Add brand if available
  if (product.value?.product?.brand?.slug) {
    items.push({ 
      label: product.value.product.brand.title || t('product.page.brand'), 
      to: localePath(`/categories?brand=${product.value.product.brand.slug}`) 
    })
  }
  
  // Last item - always add product title (or placeholder)
  items.push({ 
    label: product.value?.title || product.value?.name || t('product.page.product'), 
    to: '#' 
  })
  
  return items
})

// Methods
async function addToCart() {
  if (!currentVariant.value || !inStock.value) return
  
  isAddingToCart.value = true
  const cartStore = useCartStore()
  await cartStore.addItem(currentVariant.value.id, quantity.value)
  isAddingToCart.value = false
}

async function toggleFavorite() {
  if (!product.value) return
  const favoritesStore = useFavoritesStore()
  await favoritesStore.toggleFavorite(product.value.id)
}

async function toggleComparison() {
  if (!product.value) return
  const comparisonStore = useComparisonStore()
  await comparisonStore.toggleComparison(product.value.id)
}

function _incrementQuantity() {
  quantity.value++
}

function _decrementQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function selectOption(code: string, value: string) {
  const productStore = useProductStore()
  productStore.selectOption(code, value)
}

// Helper to get option value safely
function getOptionValue(optionValue: { value?: string; value_id?: number; label?: string }): string {
  if ('value' in optionValue && optionValue.value) {
    return optionValue.value
  }
  if ('value_id' in optionValue && optionValue.value_id) {
    return optionValue.value_id.toString()
  }
  return optionValue.label || ''
}

// Helper to check if option is available
function isOptionAvailable(optionValue: { is_available?: boolean; is_in_stock?: boolean }): boolean {
  if ('is_available' in optionValue) {
    return optionValue.is_available ?? true
  }
  if ('is_in_stock' in optionValue) {
    return optionValue.is_in_stock ?? true
  }
  return true
}

// Helper to check if an option is a color option (for styling)
function isColorOption(optionCode: string, optionName: string): boolean {
  const colorKeywords = ['color', 'colour', 'couleur']
  const code = optionCode.toLowerCase()
  const name = optionName.toLowerCase()
  return colorKeywords.some(keyword => code.includes(keyword) || name.includes(keyword))
}

// Helper to get color class from value (try to extract color from label/value)
function getColorClass(value: { label?: string; value?: string }): string {
  const label = (value.label || '').toLowerCase()
  const valueStr = (value.value || '').toLowerCase()
  
  // Map common color names to Tailwind classes
  const colorMap: Record<string, string> = {
    'white': 'bg-white checked:outline-gray-400',
    'black': 'bg-gray-900 checked:outline-gray-900',
    'gray': 'bg-gray-200 checked:outline-gray-400',
    'grey': 'bg-gray-200 checked:outline-gray-400',
    'red': 'bg-red-500 checked:outline-red-600',
    'blue': 'bg-blue-500 checked:outline-blue-600',
    'green': 'bg-green-500 checked:outline-green-600',
    'yellow': 'bg-yellow-500 checked:outline-yellow-600',
    'purple': 'bg-purple-500 checked:outline-purple-600',
    'pink': 'bg-pink-500 checked:outline-pink-600',
    'orange': 'bg-orange-500 checked:outline-orange-600',
  }
  
  for (const [key, className] of Object.entries(colorMap)) {
    if (label.includes(key) || valueStr.includes(key)) {
      return className
    }
  }
  
  // Default to gray if no match
  return 'bg-gray-200 checked:outline-gray-400'
}

// Get first 4 images for grid layout
const gridImages = computed(() => {
  const allImages = images.value
  if (allImages.length <= 1) return []
  return allImages.slice(0, 4)
})
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
        <div class="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div class="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{{ productTitle }}</h1>
          </div>

          <!-- Options -->
          <div class="mt-4 lg:row-span-3 lg:mt-0">
            <h2 class="sr-only">{{ $t('product.page.productInformation') }}</h2>
            
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

            <!-- Reviews -->
            <div v-if="productRating > 0 || reviewsCount > 0" class="mt-6">
              <h3 class="sr-only">Reviews</h3>
              <UiRating :rating="productRating" :reviews-count="reviewsCount" />
            </div>

            <form class="mt-10" @submit.prevent="addToCart">
              <!-- Options -->
              <div v-for="option in availableOptions" :key="option.code" :class="option.code !== availableOptions[0]?.code ? 'mt-10' : ''">
                <!-- Color options -->
                <template v-if="isColorOption(option.code, option.name)">
                  <h3 class="text-sm font-medium text-gray-900">{{ option.name }}</h3>
                  <fieldset aria-label="Choose a color" class="mt-4">
                    <div class="flex items-center gap-x-3">
                      <div
                        v-for="value in option.values"
                        :key="getOptionValue(value)"
                        class="flex rounded-full outline -outline-offset-1 outline-black/10"
                      >
                        <input
                          :aria-label="value.label"
                          type="radio"
                          :name="`option-${option.code}`"
                          :value="getOptionValue(value)"
                          :checked="selectedOptions[option.code] === getOptionValue(value)"
                          :disabled="!isOptionAvailable(value)"
                          :class="[
                            getColorClass(value),
                            'size-8 appearance-none rounded-full forced-color-adjust-none checked:outline-2 checked:outline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-3 disabled:opacity-25 disabled:cursor-not-allowed'
                          ]"
                          @change="selectOption(option.code, getOptionValue(value))"
                        >
                      </div>
                    </div>
                  </fieldset>
                </template>
                
                <!-- Size or other options -->
                <template v-else>
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900">{{ option.name }}</h3>
                    <a v-if="option.code.toLowerCase().includes('size')" href="#" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Size guide</a>
                  </div>
                  <fieldset :aria-label="`Choose a ${option.name}`" class="mt-4">
                    <div class="grid grid-cols-4 gap-3">
                      <label
                        v-for="value in option.values"
                        :key="getOptionValue(value)"
                        :aria-label="value.label"
                        :class="[
                          'group relative flex items-center justify-center rounded-md border border-gray-300 bg-white p-3 text-sm font-medium uppercase',
                          selectedOptions[option.code] === getOptionValue(value)
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'text-gray-900 hover:border-gray-400',
                          !isOptionAvailable(value) && 'border-gray-400 bg-gray-200 opacity-25 cursor-not-allowed'
                        ]"
                      >
                        <input
                          type="radio"
                          :name="`option-${option.code}`"
                          :value="getOptionValue(value)"
                          :checked="selectedOptions[option.code] === getOptionValue(value)"
                          :disabled="!isOptionAvailable(value)"
                          class="absolute inset-0 appearance-none focus:outline-none disabled:cursor-not-allowed"
                          @change="selectOption(option.code, getOptionValue(value))"
                        >
                        <span>{{ value.label }}</span>
                      </label>
                    </div>
                  </fieldset>
                </template>
              </div>

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
            </form>
          </div>

          <!-- Description and details -->
          <div class="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            <!-- Description -->
            <div>
              <h3 class="sr-only">Description</h3>
              <div class="space-y-6">
                <p v-if="product.short_description || product.product?.description" class="text-base text-gray-900">
                  {{ product.short_description || product.product?.description }}
                </p>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                  v-if="product.description"
                  class="prose max-w-none text-base text-gray-900"
                  v-html="product.description"
                />
              </div>
            </div>

            <!-- Highlights (if available) -->
            <div v-if="product.product?.description && !product.short_description" class="mt-10">
              <h3 class="text-sm font-medium text-gray-900">Highlights</h3>
              <div class="mt-4">
                <ul role="list" class="list-disc space-y-2 pl-4 text-sm">
                  <li
                    v-for="(highlight, index) in (product.product.description.match(/[^.!?]+[.!?]+/g) || []).slice(0, 4)"
                    :key="index"
                    class="text-gray-400"
                  >
                    <span class="text-gray-600">{{ highlight.trim() }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Details -->
            <div v-if="product.description || product.product?.description" class="mt-10">
              <h2 class="text-sm font-medium text-gray-900">Details</h2>
              <div class="mt-4 space-y-6">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                  v-if="product.description"
                  class="prose max-w-none text-sm text-gray-600"
                  v-html="product.description"
                />
                <p v-else-if="product.product?.description" class="text-sm text-gray-600">
                  {{ product.product.description }}
                </p>
              </div>
            </div>

            <!-- Specifications -->
            <div v-if="product.specifications?.length" class="mt-10">
              <h2 class="text-sm font-medium text-gray-900">Specifications</h2>
              <div class="mt-4 bg-white rounded-lg overflow-hidden border border-gray-200">
                <table class="w-full">
                  <tbody>
                    <template v-for="(spec, index) in product.specifications" :key="index">
                      <tr
                        v-for="item in spec.items"
                        :key="item.name"
                        class="border-b border-gray-200 last:border-0"
                      >
                        <td class="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">
                          {{ item.name }}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900">
                          {{ item.value }}
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Reviews Section -->
        <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 pb-16">
          <ClientOnly>
            <ProductReviews :product-id="product.product_id" />
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
