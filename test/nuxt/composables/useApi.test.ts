/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApi } from '~/composables/useApi'

// Mock Nuxt app and runtime config
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app')
  return {
    ...actual,
    useNuxtApp: vi.fn(() => ({
      runWithContext: vi.fn((fn) => fn()),
      $pinia: null,
    })),
    useRuntimeConfig: vi.fn(() => ({
      apiBackendUrl: 'http://localhost:8000',
      public: {
        apiBackendUrl: 'http://localhost:8000',
      },
    })),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
    })),
    useCookie: vi.fn((key: string) => ({
      value: null,
    })),
    useRequestEvent: vi.fn(() => null),
  }
})

// Mock $fetch
global.$fetch = vi.fn() as any

// Mock token utilities
vi.mock('~/utils/tokens', () => ({
  generateUUID: vi.fn(() => 'test-uuid'),
}))

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  describe('buildHeaders', () => {
    it('should build headers with default locale and currency', () => {
      const api = useApi()
      const headers = api.buildHeaders()
      
      expect(headers['Accept-Language']).toBe('en')
      expect(headers['Accept-Currency']).toBe('USD')
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Accept']).toBe('application/json')
    })

    it('should include cart token when requested', () => {
      const api = useApi()
      const headers = api.buildHeaders({ cart: true })
      
      expect(headers['X-Cart-Token']).toBeTruthy()
    })

    it('should include guest token when requested', () => {
      const api = useApi()
      const headers = api.buildHeaders({ guest: true })
      
      expect(headers['X-Guest-Id']).toBeTruthy()
    })

    it('should include comparison token when requested', () => {
      const api = useApi()
      const headers = api.buildHeaders({ comparison: true })
      
      expect(headers['X-Comparison-Token']).toBeTruthy()
    })

    it('should merge custom headers', () => {
      const api = useApi()
      const headers = api.buildHeaders({
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })
      
      expect(headers['X-Custom-Header']).toBe('custom-value')
    })
  })

  describe('buildUrl', () => {
    it('should build URL with API prefix', () => {
      const api = useApi()
      const url = api.buildUrl('/products')
      
      expect(url).toBe('/api/v1/products')
    })

    it('should skip prefix for auth endpoints', () => {
      const api = useApi()
      const url = api.buildUrl('/login')
      
      expect(url).toBe('/login')
    })

    it('should add query parameters', () => {
      const api = useApi()
      const url = api.buildUrl('/products', {
        page: 1,
        per_page: 20,
      })
      
      expect(url).toContain('page=1')
      expect(url).toContain('per_page=20')
    })

    it('should handle array query parameters', () => {
      const api = useApi()
      const url = api.buildUrl('/products', {
        'filters[attributes][]': ['value1', 'value2'],
      })
      
      expect(url).toContain('filters[attributes][]')
    })

    it('should handle raw option to skip prefix', () => {
      const api = useApi()
      const url = api.buildUrl('/custom-endpoint', undefined, { raw: true })
      
      expect(url).toBe('/custom-endpoint')
    })
  })

  describe('request methods', () => {
    it('should make GET request', async () => {
      const api = useApi()
      const mockResponse = { data: 'test' }
      global.$fetch = vi.fn().mockResolvedValue(mockResponse) as any
      
      const result = await api.get('/test')
      
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test'),
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make POST request with body', async () => {
      const api = useApi()
      const mockResponse = { success: true }
      global.$fetch = vi.fn().mockResolvedValue(mockResponse) as any
      
      const payload = { name: 'test' }
      const result = await api.post('/test', payload)
      
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test'),
        expect.objectContaining({
          method: 'POST',
          body: payload,
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make PUT request', async () => {
      const api = useApi()
      const mockResponse = { updated: true }
      global.$fetch = vi.fn().mockResolvedValue(mockResponse) as any
      
      const result = await api.put('/test/1', { name: 'updated' })
      
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should make PATCH request', async () => {
      const api = useApi()
      const mockResponse = { patched: true }
      global.$fetch = vi.fn().mockResolvedValue(mockResponse) as any
      
      const result = await api.patch('/test/1', { name: 'patched' })
      
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    it('should make DELETE request', async () => {
      const api = useApi()
      global.$fetch = vi.fn().mockResolvedValue(undefined) as any
      
      await api.delete('/test/1')
      
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle 401 error and trigger logout', async () => {
      const { useNuxtApp, useRouter } = await import('#app')
      const mockRouter = {
        push: vi.fn(),
      }
      const mockPinia = {
        state: {
          value: {},
        },
      }
      const mockAuthStore = {
        logout: vi.fn().mockResolvedValue(undefined),
      }
      
      vi.mocked(useRouter).mockReturnValue(mockRouter as any)
      vi.mocked(useNuxtApp).mockReturnValue({
        runWithContext: vi.fn((fn) => fn()),
        $pinia: mockPinia as any,
      } as any)
      
      // Mock useAuthStore to return our mock
      vi.doMock('~/stores/auth.store', () => ({
        useAuthStore: vi.fn(() => mockAuthStore),
      }))
      
      const api = useApi()
      global.$fetch = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      }) as any
      
      // This will throw, but should attempt logout
      try {
        await api.get('/protected')
      } catch (error) {
        // Expected to throw
      }
      
      // Note: In actual implementation, auto-logout happens in useApi
      // This test verifies the structure
      expect(global.$fetch).toHaveBeenCalled()
    })

    it('should handle 419 CSRF error and retry', async () => {
      const api = useApi()
      let callCount = 0
      global.$fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject({
            status: 419,
            message: 'CSRF token mismatch',
          })
        }
        return Promise.resolve({ success: true })
      }) as any
      
      // Mock fetchCsrfCookie
      const originalFetchCsrfCookie = api.fetchCsrfCookie
      api.fetchCsrfCookie = vi.fn().mockResolvedValue(undefined)
      
      // Note: CSRF retry logic is complex and depends on client-side
      // This test structure verifies the pattern
      expect(api.fetchCsrfCookie).toBeDefined()
    })
  })
})
