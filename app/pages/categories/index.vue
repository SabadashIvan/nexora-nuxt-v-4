<script setup lang="ts">
/**
 * Categories page - SSR for SEO
 */
import { useCatalogStore } from '~/stores/catalog.store'
import { TOKEN_KEYS } from '~/utils/tokens'
import type { ProductFilter } from '~/types'

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

// Create a computed for route query to use in watch
const routeQuery = computed(() => route.query)

// Build cache key from route query, locale, and currency for SWR-like caching
// Products have prices, so include currency in the key
const buildCacheKey = (query: Record<string, unknown>, currentLocale: string, currentCurrency: string) => {
  const sortedQuery = Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      acc[key] = query[key]
      return acc
    }, {} as Record<string, unknown>)
  return `catalog-products-${currentLocale}-${currentCurrency}-${JSON.stringify(sortedQuery)}`
}

// Fetch products with lazy loading + SWR caching
// useLazyAsyncData allows instant navigation with skeleton loading
// Uses currency computed backed by useCookie for SSR/client consistency
const { data: productsData, pending, refresh, error: _error } = await useLazyAsyncData(
  () => buildCacheKey(route.query, locale.value, currency.value),
  async () => {
    const catalogStore = useCatalogStore()
    
    // Get query params directly from route inside async callback
    const query = route.query
    const initialFilters = {
      q: query.q as string | undefined,
      sort: query.sort as string | undefined,
      page: query.page ? parseInt(query.page as string) : 1,
      categories: query.categories as string | undefined,
      brands: query.brands as string | undefined,
      price_min: query.price_min ? Number(query.price_min) : undefined,
      price_max: query.price_max ? Number(query.price_max) : undefined,
      attributes: query.attributes ? (query.attributes as string).split(',') : undefined,
    }
    
    // Build filters object from URL params only
    // On /categories page, we don't add categories filter unless explicitly in URL
    interface CatalogFiltersPayload {
      page: number
      filters?: {
        q?: string
        categories?: string
        brands?: string
        price_min?: number
        price_max?: number
        attributes?: string[]
      }
    }
    
    const filters: CatalogFiltersPayload = {
      page: initialFilters.page,
      // Explicitly set filters to empty object to prevent old category filters from being merged
      // This ensures that when navigating from /categories/[category] to /categories/, 
      // old category filters are not preserved
      filters: {},
    }
    
    // Only add filter values if they exist in URL
    if (initialFilters.q) {
      filters.filters!.q = initialFilters.q
    }
    // Only add categories if explicitly in URL - don't add by default on /categories
    if (initialFilters.categories) {
      filters.filters!.categories = initialFilters.categories
    }
    if (initialFilters.brands) {
      filters.filters!.brands = initialFilters.brands
    }
    if (initialFilters.price_min !== undefined) {
      filters.filters!.price_min = initialFilters.price_min
    }
    if (initialFilters.price_max !== undefined) {
      filters.filters!.price_max = initialFilters.price_max
    }
    if (initialFilters.attributes && initialFilters.attributes.length > 0) {
      filters.filters!.attributes = initialFilters.attributes
    }
    
    // If no filters in URL, remove empty filters object to avoid sending it to API
    if (filters.filters && Object.keys(filters.filters).length === 0) {
      filters.filters = undefined
    }
    
    // Clear category filters from store if not in URL (to avoid showing category products on main catalog page)
    // This prevents old category filters from being merged in fetchProducts
    if (!initialFilters.categories && catalogStore.filters.filters?.categories) {
      // Remove categories from existing filters in store before fetching
      const cleanedFilters = { ...catalogStore.filters }
      if (cleanedFilters.filters) {
        delete cleanedFilters.filters.categories
        // If filters object becomes empty after removing categories, remove it
        if (Object.keys(cleanedFilters.filters).length === 0) {
          cleanedFilters.filters = undefined
        }
      }
      catalogStore.filters = cleanedFilters
    }
    
    await catalogStore.fetchProducts(filters)

    // Apply filters to store so they're available for ActiveFilters component
    // Only set filters if they exist - don't preserve old filters from store
    catalogStore.filters = filters

    let sorting: 'newest' | 'price_asc' | 'price_desc' = 'newest'
    if (initialFilters.sort) {
      // Validate sort value before setting
      const validSorts = ['newest', 'price_asc', 'price_desc']
      const sortValue = initialFilters.sort
      if (validSorts.includes(sortValue)) {
        sorting = sortValue as 'newest' | 'price_asc' | 'price_desc'
        catalogStore.sorting = sorting
      }
    } else {
      // Reset to default if no sort in URL
      catalogStore.sorting = 'newest'
    }

    // Return all data needed for rendering
    return {
      products: catalogStore.products,
      pagination: catalogStore.pagination,
      availableFilters: catalogStore.availableFilters,
      sorting: sorting,
      filters: filters,
    }
  },
  {
    // Watch locale and currency to refetch when they change
    watch: [locale, currency],
    // SWR-like behavior: show cached data immediately, then refresh in background
    getCachedData: (_key) => {
      // Don't return cached data from store - it might be from a different page
      // Let useAsyncData handle caching through its built-in mechanism
      // The key includes all query params (including page), locale, and currency, so cache will be correct
      return undefined
    },
    // Server-side: always fetch fresh data for SEO
    server: true,
    // Client-side: use cached data if available, then refresh
    default: () => ({
      products: [],
      pagination: { page: 1, perPage: 20, total: 0, lastPage: 1 },
      availableFilters: {},
      sorting: 'newest' as const,
      filters: { page: 1 },
    }),
  }
)

// Watch route query changes and refresh data (Nuxt 4 compatible)
watch(routeQuery, () => {
  refresh()
}, { deep: true })

// Watch for locale/currency changes to refetch data with new language/prices
watch([locale, currency], async ([newLocale, newCurrency], [oldLocale, oldCurrency]) => {
  if (import.meta.client && (newLocale !== oldLocale || newCurrency !== oldCurrency)) {
    await refresh()
  }
}, { immediate: false })

// Fetch categories with lazy loading + caching
// Categories change rarely, so we can cache them aggressively
const { data: _categoriesData } = await useLazyAsyncData(
  () => `catalog-categories-${locale.value}`,
  async () => {
    const catalogStore = useCatalogStore()
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories()
    }
    return catalogStore.categories || []
  },
  {
    // Watch locale to refetch when language changes
    watch: [locale],
    // Cache categories for 5 minutes (they change rarely)
    getCachedData: (_key) => {
      try {
        const catalogStore = useCatalogStore()
        if (catalogStore.categories && catalogStore.categories.length > 0) {
          return catalogStore.categories
        }
      } catch {
        // Store not available
      }
      return undefined
    },
    server: true,
    default: () => [],
  }
)

// Computed values - use data returned from useLazyAsyncData
const products = computed(() => productsData.value?.products || [])
const pagination = computed(() => productsData.value?.pagination || { page: 1, perPage: 20, total: 0, lastPage: 1 })
const sorting = computed(() => productsData.value?.sorting || 'newest')
const availableFilters = computed(() => productsData.value?.availableFilters as ReturnType<typeof useCatalogStore>['availableFilters'] || {})
const activeFilters = computed(() => productsData.value?.filters || { page: 1 })

// Build query object from filter state
function buildFilterQuery(filters: ProductFilter, currentSorting?: string, currentPage?: number): Record<string, string> {
  const query: Record<string, string> = {}

  // Search
  if (filters.filters?.q) {
    query.q = filters.filters.q
  }

  // Sort
  if (currentSorting && currentSorting !== 'newest') {
    query.sort = currentSorting
  }

  // Categories
  if (filters.filters?.categories) {
    query.categories = filters.filters.categories
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
  // Reset page to 1 when filters change
  const updatedFilters = { ...filters, page: 1 }

  // Build query and update URL immediately
  const query = buildFilterQuery(updatedFilters, sorting.value, 1)
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle sort change - update URL immediately, let route watcher handle data fetching
function handleSortChange(sort: string) {
  // Build query with new sort value
  const query = buildFilterQuery(activeFilters.value, sort, pagination.value.page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle page change - update URL immediately, let route watcher handle data fetching
function handlePageChange(page: number) {
  // Build query with new page number
  const query = buildFilterQuery(activeFilters.value, sorting.value, page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
  
  // Scroll to top
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Handle remove single filter - update URL immediately, let route watcher handle data fetching
function handleRemoveFilter(type: string, value: string) {
  const sourceFilters = activeFilters.value
  // Type guard: check if filters property exists
  const sourceFiltersWithFilters = 'filters' in sourceFilters ? sourceFilters : null
  const currentFilters: ProductFilter = { 
    page: sourceFilters.page ?? 1,
    filters: sourceFiltersWithFilters?.filters ? { ...sourceFiltersWithFilters.filters } : {}
  }
  
  if (!currentFilters.filters) {
    currentFilters.filters = {}
  }
  
  switch (type) {
    case 'categories': {
      const categories = currentFilters.filters.categories?.split(',') || []
      const filtered = categories.filter((id: string) => id !== value)
      if (filtered.length > 0) {
        currentFilters.filters.categories = filtered.join(',')
      } else {
        delete currentFilters.filters.categories
      }
      break
    }
    case 'brands': {
      const brands = currentFilters.filters.brands?.split(',') || []
      const filtered = brands.filter((id: string) => id !== value)
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
        const updatedAttributes = currentFilters.filters.attributes.map((attrGroup: string, index: number) => {
          const attrDef = availableFilters.value.attributes?.[index]
          if (attrDef && attrDef.code === attrCode) {
            const valueIds = attrGroup.split(',')
            const filtered = valueIds.filter((id: string) => id !== attrValueId)
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
  
  // Remove filters object if empty
  if (currentFilters.filters && Object.keys(currentFilters.filters).length === 0) {
    currentFilters.filters = undefined
  }

  // Reset page to 1 when removing filters
  currentFilters.page = 1

  // Build query and update URL immediately
  const query = buildFilterQuery(currentFilters, sorting.value, 1)
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Handle reset - navigate to clean URL, let route watcher handle data fetching
function handleReset() {
  // Navigate to categories page without any query params
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query: {} }, { replace: true })
  
  // Route watcher will detect URL change and trigger refresh() which fetches data
}

// Update URL with current filters (kept for potential future use, but handlers now update URL directly)
function _updateUrl() {
  const query = buildFilterQuery(activeFilters.value, sorting.value, pagination.value.page)
  const localePath = useLocalePath()
  navigateTo({ path: localePath('/categories'), query }, { replace: true })
}
</script>

<template>
  <div class="bg-white">
    <!-- Breadcrumbs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <UiBreadcrumbs 
        :items="[{ label: 'Categories' }]" 
        class="mb-6"
      />
    </div>

    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex items-baseline justify-between border-b border-gray-200 pt-24 pb-6">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">All Products</h1>

        <div class="flex items-center">
          <CatalogSortDropdown
            :model-value="sorting"
            @update:model-value="handleSortChange"
          />

          <CatalogFiltersSidebar
            :filters="availableFilters"
            :active-filters="activeFilters"
            :loading="pending"
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
              :loading="pending"
              @update:filters="handleFilterChange"
              @reset="handleReset"
            />
          </div>

          <!-- Product grid -->
          <div class="lg:col-span-3">
            <CatalogProductGrid 
              :products="products" 
              :loading="pending" 
            />

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
    </main>
  </div>
</template>

