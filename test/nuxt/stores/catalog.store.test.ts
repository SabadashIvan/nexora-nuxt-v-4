/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore } from '~/stores/catalog.store'
import type { Category, ProductListItem } from '~/types'
import { useApi } from '~/composables/useApi'

// Mock useApi
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetchCsrfCookie: vi.fn(),
    buildHeaders: vi.fn(),
    buildUrl: vi.fn(),
  })),
}))

describe('catalog store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = useCatalogStore()
      expect(store.categories).toEqual([])
      expect(store.products).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories: Category[] = [
        {
          id: 1,
          slug: 'electronics',
          title: 'Electronics',
          name: 'Electronics',
        },
        {
          id: 2,
          slug: 'clothing',
          title: 'Clothing',
          name: 'Clothing',
        },
      ]
      
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCategories),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      await store.fetchCategories()
      
      expect(store.categories).toEqual(mockCategories)
      expect(store.loading).toBe(false)
    })

    it('should handle wrapped response format', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              slug: 'electronics',
              title: 'Electronics',
              name: 'Electronics',
            },
          ],
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      await store.fetchCategories()
      
      expect(store.categories.length).toBe(1)
    })
  })

  describe('fetchCategory', () => {
    it('should fetch single category by slug', async () => {
      const mockCategory: Category = {
        id: 1,
        slug: 'electronics',
        title: 'Electronics',
        name: 'Electronics',
      }
      
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockCategory),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      const result = await store.fetchCategory('electronics')
      
      expect(result).toEqual(mockCategory)
      expect(store.currentCategory).toEqual(mockCategory)
    })

    it('should handle wrapped response', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            slug: 'electronics',
            title: 'Electronics',
            name: 'Electronics',
          },
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      const result = await store.fetchCategory('electronics')
      
      expect(result).toBeTruthy()
      expect(result?.slug).toBe('electronics')
    })
  })

  describe('fetchProducts', () => {
    it('should fetch products with filters', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 1,
              sku: 'PROD-001',
              title: 'Test Product',
            },
          ] as ProductListItem[],
          facets: {
            categories: [],
            brands: [],
            attributes: [],
          },
        },
        meta: {
          pagination: {
            current_page: 1,
            per_page: 20,
            total: 1,
            last_page: 1,
          },
        },
      }
      
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      await store.fetchProducts()
      
      expect(store.products.length).toBe(1)
      expect(store.pagination.page).toBe(1)
      expect(store.pagination.total).toBe(1)
    })

    it('should apply filters correctly', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: { items: [], facets: {} },
          meta: { pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 } },
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      await store.fetchProducts({
        filters: {
          q: 'test',
          price_min: 1000,
          price_max: 5000,
        },
      })
      
      expect(mockApi.get).toHaveBeenCalled()
      const callArgs = mockApi.get.mock.calls[0]
      expect(callArgs?.[1]).toHaveProperty('filters[q]', 'test')
    })
  })

  describe('getters', () => {
    it('should filter root categories', () => {
      const store = useCatalogStore()
      store.categories = [
        {
          id: 1,
          slug: 'root1',
          title: 'Root 1',
          name: 'Root 1',
          parent_id: null,
        },
        {
          id: 2,
          slug: 'child1',
          title: 'Child 1',
          name: 'Child 1',
          parent_id: 1,
        },
      ]
      
      expect(store.rootCategories.length).toBe(1)
      expect(store.rootCategories[0]?.id).toBe(1)
    })

    it('should check if has products', () => {
      const store = useCatalogStore()
      expect(store.hasProducts).toBe(false)
      
      store.products = [{ id: 1 } as ProductListItem]
      expect(store.hasProducts).toBe(true)
    })

    it('should check active filters', () => {
      const store = useCatalogStore()
      expect(store.hasActiveFilters).toBe(false)
      
      store.filters = {
        filters: {
          q: 'test',
        },
      }
      expect(store.hasActiveFilters).toBe(true)
    })

    it('should count active filters', () => {
      const store = useCatalogStore()
      expect(store.activeFilterCount).toBe(0)
      
      store.filters = {
        filters: {
          q: 'test',
          price_min: 1000,
          price_max: 5000,
          brands: '1,2',
          attributes: ['attr1', 'attr2'],
        },
      }
      // q=1, price_min+price_max=1 (counted together), brands=1, attributes=2 = 5 total
      expect(store.activeFilterCount).toBe(5)
    })
  })

  describe('applyFilters', () => {
    it('should apply filters and reset pagination', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: { items: [], facets: {} },
          meta: { pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 } },
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      store.pagination.page = 3
      
      await store.applyFilters({
        filters: {
          q: 'test',
        },
      })
      
      expect(store.filters.filters?.q).toBe('test')
      expect(store.pagination.page).toBe(1)
    })
  })

  describe('applySorting', () => {
    it('should apply sorting and reset pagination', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: { items: [], facets: {} },
          meta: { pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 } },
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      store.pagination.page = 2
      
      await store.applySorting('price_asc')
      
      expect(store.sorting).toBe('price_asc')
      expect(store.pagination.page).toBe(1)
    })

    it('should normalize invalid sort values', async () => {
      const mockApi = {
        request: vi.fn(),
        get: vi.fn().mockResolvedValue({
          data: { items: [], facets: {} },
          meta: { pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 } },
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        fetchCsrfCookie: vi.fn(),
        buildHeaders: vi.fn(),
        buildUrl: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useCatalogStore()
      await store.applySorting('invalid_sort')
      
      expect(store.sorting).toBe('newest')
    })
  })

  describe('resetFilters', () => {
    it('should reset all filters', () => {
      const store = useCatalogStore()
      store.filters = {
        filters: {
          q: 'test',
          price_min: 1000,
        },
      }
      store.sorting = 'price_asc'
      store.pagination.page = 3
      
      store.resetFilters()
      
      expect(store.filters).toEqual({})
      expect(store.sorting).toBe('newest')
      expect(store.pagination.page).toBe(1)
    })
  })
})
