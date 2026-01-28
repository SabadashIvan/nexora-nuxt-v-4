<script setup lang="ts">
/**
 * Category page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'
import { TOKEN_KEYS } from '~/utils/tokens'
import { ERROR_CODES } from '~/utils/errors'
import type { Category, ProductFilter, ProductListItem } from '~/types'
import { toRaw } from 'vue'

// Call composables at top level of setup
const route = useRoute()

// Get locale and currency for cache key
const i18n = useI18n()
const locale = computed(() => i18n.locale.value)

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

// Helpers for reactive route access
const categorySlug = computed(() => (route.params.category as string) || '')

const categoryErrorStatus = computed(() => {
  try {
    return useCatalogStore().errorStatus
  } catch {
    return null
  }
})

const didClientRefetch = ref(false)

// Build cache key for category page with filters, locale, and currency
// Products have prices, so include currency in the key
const buildCategoryCacheKey = (slug: string, query: Record<string, unknown>, currentLocale: string, currentCurrency: string) => {
  const sortedQuery = Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      const value = query[key]
      // Convert null to undefined and filter out null values
      acc[key] = value === null ? undefined : value
      return acc
    }, {} as Record<string, unknown>)
  return `category-${slug}-${currentLocale}-${currentCurrency}-${JSON.stringify(sortedQuery)}`
}

const serialize = <T,>(value: T): T => {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

// Define return type for category data
interface CategoryPageData {
  category: Category | null
  products: ReturnType<typeof useCatalogStore>['products']
  pagination: ReturnType<typeof useCatalogStore>['pagination']
  availableFilters: ReturnType<typeof useCatalogStore>['availableFilters']
  sorting: ReturnType<typeof useCatalogStore>['sorting']
  filters: ReturnType<typeof useCatalogStore>['filters']
}

const payloadCategoryData = computed(() => {
  const key = buildCategoryCacheKey(categorySlug.value, route.query, locale.value, currency.value)
  const nuxtData = useNuxtData<CategoryPageData>(key)
  return nuxtData.data.value
})

// Build cache key for useAsyncData - must be consistent between SSR and client
// Uses currency computed which is backed by useCookie for SSR/client consistency
const getCacheKey = () => buildCategoryCacheKey(categorySlug.value, route.query, locale.value, currency.value)

// Fetch category and products with SSR data hydration
// Use getter function for cache key to ensure SSR/client consistency (matching product page pattern)
// Access store and api INSIDE the callback to preserve SSR context
const { data: asyncCategoryData, pending, error, status, refresh } = await useAsyncData<CategoryPageData>(
  getCacheKey,
  async () => {
    // Access store and api inside callback to preserve SSR context
    const api = useApi()
    const catalogStore = useCatalogStore()

    const slug = categorySlug.value
    const query = route.query
    const filters = {
      q: query.q as string | undefined,
      sort: query.sort as string | undefined,
      page: query.page ? parseInt(query.page as string) : 1,
      categories: query.categories as string | undefined,
      brands: query.brands as string | undefined,
      price_min: query.price_min ? Number(query.price_min) : undefined,
      price_max: query.price_max ? Number(query.price_max) : undefined,
      attributes: query.attributes ? (query.attributes as string).split(',') : undefined,
      raw_suggest: query.raw_suggest as string | undefined,
    }
    // Pass API instance to preserve context
    const cat = await catalogStore.fetchCategory(slug, false, api)

    // TODO(backend): The backend should return the full ancestor path for a category
    // (e.g. `ancestors`/`path`) in `/catalog/categories/{slug}`. Today we fetch the
    // entire categories tree to build breadcrumbs (Home → root → … → current).
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories(api)
    }

    let sorting: 'newest' | 'price_asc' | 'price_desc' = 'newest'
    let appliedFilters: ProductFilter = { page: 1 }

    if (cat && cat.id) {
      // Build filters object from URL params
      // Always include current category ID in filters
      const filterParams: ProductFilter = {
        page: filters.page,
        filters: {
          // Always filter by current category ID
          categories: String(cat.id),
        },
      }

      // Add raw_suggest if present (confirmed search from suggest/history)
      if (filters.raw_suggest) {
        filterParams.raw_suggest = filters.raw_suggest
      }

      // Add additional filters from URL params
      // filterParams.filters is guaranteed to be defined above
      if (filters.q) {
        filterParams.filters!.q = filters.q
      }

      // If URL has categories param, merge with current category ID
      if (filters.categories) {
        const urlCategoryIds = filters.categories.split(',')
        // Ensure current category ID is included
        if (!urlCategoryIds.includes(String(cat.id))) {
          urlCategoryIds.push(String(cat.id))
        }
        filterParams.filters!.categories = urlCategoryIds.join(',')
      }

      if (filters.brands) {
        filterParams.filters!.brands = filters.brands
      }
      if (filters.price_min !== undefined) {
        filterParams.filters!.price_min = filters.price_min
      }
      if (filters.price_max !== undefined) {
        filterParams.filters!.price_max = filters.price_max
      }
      if (filters.attributes && filters.attributes.length > 0) {
        filterParams.filters!.attributes = filters.attributes
      }

      // Pass API instance to preserve context after await
      await catalogStore.fetchProducts(filterParams, api)

      // Apply filters to store so they're available for ActiveFilters component
      catalogStore.filters = { ...catalogStore.filters, ...filterParams }
      appliedFilters = { ...catalogStore.filters }

      if (filters.sort) {
        // Validate sort value before setting
        const validSorts = ['newest', 'price_asc', 'price_desc']
        const sortValue = filters.sort
        if (validSorts.includes(sortValue)) {
          sorting = sortValue as 'newest' | 'price_asc' | 'price_desc'
          catalogStore.sorting = sorting
        }
      }
    }

    // Return all data needed for rendering (not just category)
    return {
      category: cat ? serialize(toRaw(cat)) : null,
      products: serialize(toRaw(catalogStore.products)) ?? [],
      pagination: serialize(toRaw(catalogStore.pagination)),
      availableFilters: serialize(toRaw(catalogStore.availableFilters)),
      sorting: sorting,
      filters: serialize(toRaw(appliedFilters)),
    }
  },
  {
    server: true,
    default: () => ({
      category: null,
      products: [],
      pagination: { page: 1, perPage: 20, total: 0, lastPage: 1 },
      availableFilters: {},
      sorting: 'newest' as const,
      filters: { page: 1 },
    }),
    // Watch locale and currency to refetch when they change
    watch: [locale, currency],
    // Don't use getCachedData - it can return stale data with wrong locale/currency
    // Let Nuxt handle caching based on the key which includes locale and currency
  }
)

const storeCategory = computed(() => {
  try {
    return useCatalogStore().currentCategory
  } catch {
    return null
  }
})

const storeProducts = computed(() => {
  try {
    return useCatalogStore().products
  } catch {
    return []
  }
})

const storePagination = computed(() => {
  try {
    return useCatalogStore().pagination
  } catch {
    return { page: 1, perPage: 20, total: 0, lastPage: 1 }
  }
})

const storeAvailableFilters = computed(() => {
  try {
    return useCatalogStore().availableFilters
  } catch {
    return {}
  }
})

const storeSorting = computed(() => {
  try {
    return useCatalogStore().sorting
  } catch {
    return 'newest'
  }
})

const storeFilters = computed(() => {
  try {
    return useCatalogStore().filters
  } catch {
    return { page: 1 }
  }
})

const lastProducts = ref<ProductListItem[]>([])
const lastPagination = ref(storePagination.value)

// Watch route changes and refresh data (Nuxt 4 compatible)
watch(() => route.fullPath, () => {
  refresh()
})

// Watch for locale/currency changes to refetch data with new language/prices
watch([locale, currency], async ([newLocale, newCurrency], [oldLocale, oldCurrency]) => {
  if (import.meta.client && (newLocale !== oldLocale || newCurrency !== oldCurrency)) {
    await refresh()
  }
}, { immediate: false })

onMounted(() => {
  if (!didClientRefetch.value && !category.value && (error.value || status.value === 'error')) {
    didClientRefetch.value = true
    refresh()
  }
})

// Computed values - use data returned from useAsyncData
const category = computed(() => asyncCategoryData.value?.category || payloadCategoryData.value?.category || storeCategory.value || null)
const products = computed(() => {
  const productsList = asyncCategoryData.value?.products ?? payloadCategoryData.value?.products ?? storeProducts.value
  return productsList.length > 0 ? productsList : lastProducts.value
})
const pagination = computed(() => {
  const paginationData = asyncCategoryData.value?.pagination ?? payloadCategoryData.value?.pagination ?? storePagination.value
  return paginationData.total > 0 ? paginationData : lastPagination.value
})
const sorting = computed(() => asyncCategoryData.value?.sorting ?? payloadCategoryData.value?.sorting ?? storeSorting.value)
const availableFilters = computed(() => asyncCategoryData.value?.availableFilters ?? payloadCategoryData.value?.availableFilters ?? storeAvailableFilters.value)
const activeFilters = computed(() => asyncCategoryData.value?.filters ?? payloadCategoryData.value?.filters ?? storeFilters.value)

const excludedCategoryIds = computed(() => {
  return category.value?.id ? [String(category.value.id)] : []
})

watchEffect(() => {
  const productsList = asyncCategoryData.value?.products ?? payloadCategoryData.value?.products ?? storeProducts.value
  if (productsList.length > 0) {
    lastProducts.value = productsList
  }

  const paginationData = asyncCategoryData.value?.pagination ?? payloadCategoryData.value?.pagination ?? storePagination.value
  if (paginationData.total > 0) {
    lastPagination.value = paginationData
  }
})

// Handle 404 - check after data loads
watch([status, category, error, categoryErrorStatus], ([currentStatus, cat, err, errorStatus]) => {
  if (currentStatus === 'success' && !cat && !err && errorStatus === ERROR_CODES.NOT_FOUND) {
    throw createError({
      status: 404,
      statusText: 'Category Not Found',
    })
  }
})

// Breadcrumbs
const breadcrumbs = computed(() => {
  // UiBreadcrumbs already prepends Home. We only provide the category hierarchy.
  const items: Array<{ label: string; to?: string }> = []

  const cat = category.value
  if (!cat) return items

  // Prefer full path from categories tree (supports unlimited depth).
  // Fallback to just the current category if the tree isn't available.
  let path: Category[] = []
  try {
    const store = useCatalogStore()
    path = store.getCategoryPathBySlug(cat.slug) || []
  } catch {
    path = []
  }

  const effectivePath = path.length > 0 ? path : [cat]

  for (const node of effectivePath) {
    const label = node.title || node.name || 'Category'
    // If slug is missing, still show label (no link)
    const to = node.slug ? `/categories/${node.slug}` : undefined
    items.push({ label, to })
  }

  return items
})

// Get category image URL
function getCategoryImageUrl(image: Category['image']): string | undefined {
  if (!image || image === null) return undefined
  if (typeof image === 'string') return image
  if (typeof image === 'object' && 'url' in image) {
    return image.url || undefined
  }
  return undefined
}

// Get category icon URL
function getCategoryIconUrl(icon: Category['icon']): string | undefined {
  if (!icon || icon === null) return undefined
  if (typeof icon === 'string') return icon
  if (typeof icon === 'object' && 'url' in icon) {
    return icon.url || undefined
  }
  return undefined
}

// Get category display name
const categoryName = computed(() => {
  if (!category.value) return ''
  return category.value.title || category.value.name || 'Category'
})

// Build query object from filter state
function buildFilterQuery(filters: ProductFilter, currentCategoryId?: number, currentSorting?: string, currentPage?: number): Record<string, string> {
  const query: Record<string, string> = {}

  // Search
  if (filters.filters?.q) {
    query.q = filters.filters.q
  }

  // Preserve raw_suggest from current route if present (confirmed search from suggest/history)
  if (filters.raw_suggest) {
    query.raw_suggest = filters.raw_suggest
  }

  // Sort
  if (currentSorting && currentSorting !== 'newest') {
    query.sort = currentSorting
  }

  // Categories - only add to URL if there are multiple categories (not just current one)
  if (filters.filters?.categories) {
    const categoryIds = filters.filters.categories.split(',')
    if (currentCategoryId) {
      const currentCategoryIdStr = String(currentCategoryId)
      const otherCategories = categoryIds.filter(id => id !== currentCategoryIdStr)
      if (otherCategories.length > 0) {
        // Include all categories in URL (current + others)
        query.categories = filters.filters.categories
      }
      // If only current category, don't add to URL (it's already in the path)
    } else {
      query.categories = filters.filters.categories
    }
  }

  // Brands
  if (filters.filters?.brands) {
    query.brands = filters.filters.brands
  }

  // Price range
  if (filters.filters?.price_min !== undefined) {
    query.price_min = String(filters.filters.price_min)
  }
  if (filters.filters?.price_max !== undefined) {
    query.price_max = String(filters.filters.price_max)
  }

  // Attributes
  if (filters.filters?.attributes && filters.filters.attributes.length > 0) {
    query.attributes = filters.filters.attributes.join(',')
  }

  // Page
  const page = currentPage ?? filters.page ?? 1
  if (page > 1) {
    query.page = page.toString()
  }

  return query
}

// Handle filter changes - update URL immediately, let route watcher handle data fetching
function handleFilterChange(filters: ProductFilter) {
  // Ensure current category ID is always included
  const updatedFilters = { ...filters }
  if (!updatedFilters.filters) {
    updatedFilters.filters = {}
  }

  // Always include current category ID
  if (category.value?.id) {
    const currentCategoryId = String(category.value.id)
    if (updatedFilters.filters.categories) {
      const categoryIds = updatedFilters.filters.categories.split(',')
      if (!categoryIds.includes(currentCategoryId)) {
        categoryIds.push(currentCategoryId)
        updatedFilters.filters.categories = categoryIds.join(',')
      }
    } else {
      updatedFilters.filters.categories = currentCategoryId
    }
  }

  // Reset page to 1 when filters change
  updatedFilters.page = 1

  // Build query and update URL immediately
  const query = buildFilterQuery(updatedFilters, category.value?.id, sorting.value, 1)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle sort change - update URL immediately, let route watcher handle data fetching
function handleSortChange(sort: string) {
  // Build query with new sort value
  const query = buildFilterQuery(activeFilters.value, category.value?.id, sort, pagination.value.page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle page change - update URL immediately, let route watcher handle data fetching
function handlePageChange(page: number) {
  // Build query with new page number
  const query = buildFilterQuery(activeFilters.value, category.value?.id, sorting.value, page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
  
  // Scroll to top
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Handle remove single filter - update URL immediately, let route watcher handle data fetching
function handleRemoveFilter(type: string, value: string) {
  const currentFilters = { ...activeFilters.value }

  if (!currentFilters.filters) {
    currentFilters.filters = {}
  }

  switch (type) {
    case 'categories': {
      // Don't allow removing current category ID
      if (category.value && String(category.value.id) === value) {
        return // Can't remove current category
      }

      const categories = currentFilters.filters.categories?.split(',') || []
      const filtered = categories.filter(id => id !== value)

      // Always ensure current category ID is included
      if (category.value && !filtered.includes(String(category.value.id))) {
        filtered.push(String(category.value.id))
      }

      if (filtered.length > 0) {
        currentFilters.filters.categories = filtered.join(',')
      } else if (category.value) {
        // If no other categories, keep only current category
        currentFilters.filters.categories = String(category.value.id)
      } else {
        delete currentFilters.filters.categories
      }
      break
    }
    case 'brands': {
      const brands = currentFilters.filters.brands?.split(',') || []
      const filtered = brands.filter(id => id !== value)
      if (filtered.length > 0) {
        currentFilters.filters.brands = filtered.join(',')
      } else {
        delete currentFilters.filters.brands
      }
      break
    }
    case 'price': {
      delete currentFilters.filters.price_min
      delete currentFilters.filters.price_max
      break
    }
    case 'attributes': {
      const [attrCode, attrValueId] = value.split(':')
      if (currentFilters.filters.attributes) {
        const updatedAttributes = currentFilters.filters.attributes.map((attrGroup, index) => {
          const attrDef = availableFilters.value.attributes?.[index]
          if (attrDef && attrDef.code === attrCode) {
            const valueIds = attrGroup.split(',')
            const filtered = valueIds.filter(id => id !== attrValueId)
            return filtered.length > 0 ? filtered.join(',') : null
          }
          return attrGroup
        }).filter(Boolean) as string[]

        if (updatedAttributes.length > 0) {
          currentFilters.filters.attributes = updatedAttributes
        } else {
          delete currentFilters.filters.attributes
        }
      }
      break
    }
  }

  // Always ensure current category ID is included
  if (category.value?.id && currentFilters.filters) {
    const currentCategoryId = String(category.value.id)
    if (currentFilters.filters.categories) {
      const categoryIds = currentFilters.filters.categories.split(',')
      if (!categoryIds.includes(currentCategoryId)) {
        categoryIds.push(currentCategoryId)
        currentFilters.filters.categories = categoryIds.join(',')
      }
    } else {
      currentFilters.filters.categories = currentCategoryId
    }
  }

  // Remove filters object if empty (but keep categories if we have a category)
  if (Object.keys(currentFilters.filters).length === 0 && !category.value?.id) {
    currentFilters.filters = undefined
  }

  // Reset page to 1 when removing filters
  currentFilters.page = 1

  // Build query and update URL immediately
  const query = buildFilterQuery(currentFilters, category.value?.id, sorting.value, 1)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle reset - navigate to clean URL, let route watcher handle data fetching
function handleReset() {
  // Navigate to category page without any query params (except keep category slug in path)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query: {} }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Update URL with current filters (used by handlePageChange)
function _updateUrl() {
  const query = buildFilterQuery(activeFilters.value, category.value?.id, sorting.value, pagination.value.page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath(`/categories/${categorySlug.value}`), query }, { replace: true })
}
</script>

<template>
  <div class="bg-white">
    <!-- Breadcrumbs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <UiBreadcrumbs 
        :items="breadcrumbs" 
        class="mb-6"
      />
    </div>

    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    <!-- Loading -->
    <div v-if="pending" class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
      <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Content -->
    <template v-else-if="category">
      <!-- Category Header with Image -->
      <div class="mb-8">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
          <!-- Category Image -->
          <div v-if="getCategoryImageUrl(category.image)" class="w-full lg:w-64 flex-shrink-0">
            <div class="aspect-video lg:aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              <NuxtImg
                :src="getCategoryImageUrl(category.image)"
                :alt="categoryName"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Category Info -->
          <div class="flex-1">
            <div class="flex items-start gap-4 mb-4">
              <!-- Category Icon -->
              <div v-if="getCategoryIconUrl(category.icon)" class="flex-shrink-0">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <NuxtImg
                    :src="getCategoryIconUrl(category.icon)"
                    :alt="categoryName"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div class="flex-1">
                <p v-if="category.description" class="text-gray-500 dark:text-gray-400">
                  {{ category.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subcategories -->
      <div v-if="category.children && category.children.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Subcategories
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink
            v-for="subcategory in category.children"
            :key="subcategory.id"
            :to="`/categories/${subcategory.slug}`"
            class="group flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <!-- Subcategory Icon or Image -->
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 flex items-center justify-center">
              <NuxtImg
                v-if="getCategoryIconUrl(subcategory.icon) || getCategoryImageUrl(subcategory.image)"
                :src="getCategoryIconUrl(subcategory.icon) || getCategoryImageUrl(subcategory.image)"
                :alt="subcategory.title || subcategory.name || 'Subcategory'"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100 text-center group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ subcategory.title || subcategory.name || 'Subcategory' }}
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Header with Filters -->
      <div class="flex items-baseline justify-between border-b border-gray-200 pt-24 pb-6">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ categoryName }}</h1>

        <div class="flex items-center">
          <CatalogSortDropdown
            :model-value="sorting"
            @update:model-value="handleSortChange"
          />

          <CatalogFiltersSidebar
            :filters="availableFilters"
            :active-filters="activeFilters"
            :excluded-category-ids="excludedCategoryIds"
            mobile-only
            @update:filters="handleFilterChange"
            @reset="handleReset"
          />
        </div>
      </div>

      <!-- Active Filters -->
      <CatalogActiveFilters
        :active-filters="activeFilters"
        :available-filters="availableFilters"
        :excluded-category-ids="excludedCategoryIds"
        @remove-filter="handleRemoveFilter"
        @reset="handleReset"
      />

      <!-- Main content -->
      <section aria-labelledby="products-heading" class="pt-6 pb-24">
        <h2 id="products-heading" class="sr-only">Products</h2>

        <div class="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
          <!-- Filters -->
          <div class="hidden lg:block">
            <CatalogFiltersSidebar
              :filters="availableFilters"
              :active-filters="activeFilters"
              :excluded-category-ids="excludedCategoryIds"
              @update:filters="handleFilterChange"
              @reset="handleReset"
            />
          </div>

          <!-- Product grid -->
          <div class="lg:col-span-3">
            <CatalogProductGrid :products="products" />

            <!-- Pagination -->
            <div v-if="pagination.lastPage > 1" class="mt-8">
              <UiPagination
                :current-page="pagination.page"
                :total-pages="pagination.lastPage"
                @update:current-page="handlePageChange"
              />
            </div>
          </div>
        </div>
      </section>
    </template>
    </main>
  </div>
</template>
