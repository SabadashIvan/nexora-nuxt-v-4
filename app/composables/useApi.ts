/**
 * Core API composable for all network requests
 * Handles session-based auth, CSRF tokens, SSR/CSR context, and error processing
 */

import {
  useNuxtApp,
  useRouter,
  useRuntimeConfig,
  useCookie,
  useRequestEvent,
  useRequestHeaders,
} from '#app'
import { getCookie } from 'h3'
import type { FetchOptions } from 'ofetch'
import { parseApiError, isAuthError } from '~/utils/errors'
import { generateUUID } from '~/utils/tokens'
import { useAuthStore } from '~/stores/auth.store'
import { useCartStore } from '~/stores/cart.store'

// API base URL from runtime config
const API_PREFIX = '/api/v1'

// Endpoints that are NOT prefixed with /api/v1 (Laravel Sanctum SPA auth endpoints)
const NON_PREFIXED_ENDPOINTS = [
  '/sanctum/csrf-cookie',
  '/login',
  '/register',
  '/logout',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/email',
]

export interface UseApiOptions {
  /** Include session credentials (cookies) - default true for auth */
  credentials?: boolean
  /** Include cart token */
  cart?: boolean
  /** Include guest token */
  guest?: boolean
  /** Include comparison token */
  comparison?: boolean
  /** Custom headers */
  headers?: Record<string, string>
  /** Skip API prefix (for non-standard endpoints) */
  raw?: boolean
  /** Force idempotent behavior (adds Idempotency-Key) */
  idempotent?: boolean
}

export interface ApiRequestOptions extends UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | string[] | undefined>
}

interface ApiFetchOptions extends FetchOptions {
  idempotent?: boolean
  _retry409Count?: number
  _retry419Count?: number
  _idempotencyKey?: string
}

/**
 * Check if endpoint should skip /api/v1 prefix
 */
function shouldSkipPrefix(endpoint: string): boolean {
  return NON_PREFIXED_ENDPOINTS.some(prefix => endpoint.startsWith(prefix))
}

/**
 * Get XSRF token from cookie for CSRF protection
 */
function getXsrfToken(): string | null {
  if (import.meta.server) return null

  // Laravel stores XSRF token in a cookie named XSRF-TOKEN
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  if (match && match[1]) {
    // The cookie value is URL-encoded
    return decodeURIComponent(match[1])
  }
  return null
}

function isRetryableBody(body: unknown): boolean {
  if (!body) return true
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return false
  return true
}

function cloneFetchOptions(options: ApiFetchOptions): ApiFetchOptions {
  const headers = new Headers(options.headers ?? {})
  return {
    ...options,
    headers,
  }
}

function normalizeRequestPath(request: string | Request): string {
  const raw = typeof request === 'string' ? request : request.url
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname
    } catch {
      return raw
    }
  }
  return raw
}

function isCartMutation(requestPath: string, method: string): boolean {
  return method !== 'GET' && requestPath.startsWith('/api/v1/cart')
}

/**
 * Main API composable
 */
export function useApi() {
  // Capture Nuxt context at the start of setup
  const nuxtApp = useNuxtApp()
  type ApiClient = ReturnType<typeof $fetch.create>
  const nuxtAppWithClient = nuxtApp as typeof nuxtApp & { $apiClient?: ApiClient }
  const config = useRuntimeConfig()
  const router = useRouter()

  // Lazy cookie access - only access cookies when needed and only on client
  // This prevents cookie writes during SSR/SWR cache handling
  function getCookieValue(key: string): string | null {
    if (import.meta.server) {
      // During SSR, use getCookie() which only reads, doesn't write
      try {
        const event = useRequestEvent()
        if (event) {
          return getCookie(event, key) || null
        }
      } catch {
        // If we can't get the event (e.g., during SWR cache handling),
        // return null instead of using useCookie() which would trigger writes
        return null
      }
      return null
    }
    // On client, read document.cookie to avoid stale cached refs in browsers
    // without cookieStore/BroadcastChannel support.
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
      return match && match[1] ? decodeURIComponent(match[1]) : null
    } catch {
      return null
    }
  }

  function setCookieValue(key: string, value: string): void {
    // Only set cookies on client side to avoid header issues during SSR/SWR
    if (import.meta.client) {
      try {
        const cookie = useCookie(key)
        cookie.value = value
      } catch (error) {
        if (import.meta.dev) {
          console.warn(`Failed to set cookie ${key}:`, error)
        }
      }
    }
  }

  /**
   * Get the base URL for API requests
   * - SSR: Use full backend URL (server-to-server)
   * - CSR: Use full backend URL from public config
   */
  function getBaseUrl(): string {
    return import.meta.server
      ? (config.apiBackendUrl as string || 'http://localhost:8000')
      : (config.public.apiBackendUrl as string || 'http://localhost:8000')
  }

  /**
   * Fetch CSRF cookie from Laravel Sanctum
   * Must be called before login/register requests
   * Goes through Nuxt server route to avoid CORS
   */
  async function fetchCsrfCookie(): Promise<void> {
    const baseUrl = getBaseUrl()

    return nuxtApp.runWithContext(async () => {
      await $fetch(`${baseUrl}/sanctum/csrf-cookie`, {
        credentials: 'include',
      })
    })
  }

  /**
   * Build request headers with tokens
   * Reads cookies per request to avoid stale locale/currency values in some browsers
   * Falls back to getCookieValue for SSR compatibility
   */
  function buildHeaders(options: UseApiOptions = {}): Record<string, string> {
    const locale = getCookieValue('locale') || 'en'
    const currency = getCookieValue('currency') || 'USD'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': locale,
      'Accept-Currency': currency,
    }

    // Add XSRF token for CSRF protection (Laravel Sanctum)
    const xsrfToken = getXsrfToken()
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }

    // Add cart token - use lazy cookie access to avoid context issues
    if (options.cart) {
      let cartToken = getCookieValue('cart_token')
      if (!cartToken) {
        // Generate new token if doesn't exist
        cartToken = generateUUID()
        setCookieValue('cart_token', cartToken)
      }
      headers['X-Cart-Token'] = cartToken
    }

    // Add guest token - use lazy cookie access to avoid context issues
    if (options.guest) {
      let guestToken = getCookieValue('guest_id')
      if (!guestToken) {
        // Generate new token if doesn't exist
        guestToken = generateUUID()
        setCookieValue('guest_id', guestToken)
      }
      headers['X-Guest-Id'] = guestToken
    }

    // Add comparison token - use lazy cookie access to avoid context issues
    if (options.comparison) {
      let comparisonToken = getCookieValue('comparison_token')
      if (!comparisonToken) {
        // Generate new token if doesn't exist
        comparisonToken = generateUUID()
        setCookieValue('comparison_token', comparisonToken)
      }
      headers['X-Comparison-Token'] = comparisonToken
    }

    // Merge custom headers
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    return headers
  }

  /**
   * Build full URL with query params
   */
  function buildUrl(
    endpoint: string,
    query?: Record<string, string | number | boolean | string[] | undefined>,
    options?: UseApiOptions
  ): string {
    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    // Determine if we should add the /api/v1 prefix
    let path: string
    if (options?.raw || shouldSkipPrefix(normalizedEndpoint) || normalizedEndpoint.startsWith('/api/v1')) {
      path = normalizedEndpoint
    } else {
      path = `${API_PREFIX}${normalizedEndpoint}`
    }

    // Build query string
    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays for filters[attributes][] format
          if (Array.isArray(value)) {
            value.forEach((item) => {
              params.append(key, String(item))
            })
          } else {
            params.append(key, String(value))
          }
        }
      })
      let queryString = params.toString()
      // Decode square brackets in keys (filters[price_min] should not be filters%5Bprice_min%5D)
      if (queryString) {
        queryString = queryString.replace(/%5B/g, '[').replace(/%5D/g, ']')
        path = `${path}?${queryString}`
      }
    }

    return path
  }

  function getApiClient() {
    const baseUrl = getBaseUrl()

    const createClient = () => $fetch.create({
      baseURL: baseUrl,
      credentials: 'include',
      async onRequest({ request, options }) {
        const method = (options.method || 'GET').toString().toUpperCase()
        const requestPath = normalizeRequestPath(request)
        const headers = new Headers(options.headers ?? {})

        if (import.meta.server) {
          const forwarded = useRequestHeaders(['cookie'])
          for (const [key, value] of Object.entries(forwarded)) {
            if (value) headers.set(key, value as string)
          }
        }

        const isCartRequest = isCartMutation(requestPath, method)
        if (isCartRequest && options.idempotent === undefined) {
          options.idempotent = true
        }

        if (options.idempotent) {
          const existingKey = headers.get('Idempotency-Key')
          const idempotencyKey = options._idempotencyKey || existingKey || generateUUID()
          options._idempotencyKey = idempotencyKey
          if (!existingKey) {
            headers.set('Idempotency-Key', idempotencyKey)
          }
        }

        if (isCartRequest && import.meta.client && nuxtApp.$pinia) {
          const cartStore = useCartStore(nuxtApp.$pinia)
          const cartVersion = await cartStore.ensureCartVersion()
          if (cartVersion !== null && !headers.has('If-Match')) {
            headers.set('If-Match', String(cartVersion))
          }
        }

        options.headers = headers
      },
      async onResponseError({ request, response, options, error }) {
        const requestPath = normalizeRequestPath(request)
        const method = (options.method || 'GET').toString().toUpperCase()
        const isCartRequest = isCartMutation(requestPath, method)
        const canRetryBody = isRetryableBody(options.body)
        const canRetryRequest = method === 'GET' || options.idempotent === true
        const headers = new Headers(options.headers ?? {})

        if (response?.status === 409 && isCartRequest) {
          const idempotencyKey = headers.get('Idempotency-Key') || options._idempotencyKey
          if (!idempotencyKey || !canRetryBody) {
            throw parseApiError(error)
          }

          const retryCount = options._retry409Count ?? 0
          if (retryCount < 3) {
            if (import.meta.client && nuxtApp.$pinia) {
              const cartStore = useCartStore(nuxtApp.$pinia)
              await cartStore.loadCart()
            }

            const nextOptions = cloneFetchOptions(options)
            nextOptions._retry409Count = retryCount + 1
            return getApiClient()(request, nextOptions)
          }
        }

        if (response?.status === 419 && canRetryBody && canRetryRequest) {
          const retryCount = options._retry419Count ?? 0
          if (retryCount < 1) {
            await fetchCsrfCookie()
            const nextOptions = cloneFetchOptions(options)
            nextOptions._retry419Count = retryCount + 1
            return getApiClient()(request, nextOptions)
          }
        }

        const apiError = parseApiError(error)
        const isAuthEndpoint = ['/login', '/register', '/logout', '/forgot-password', '/reset-password'].some(
          authPath => requestPath.startsWith(authPath) || requestPath.includes(authPath)
        )

        if (isAuthError(apiError) && !isAuthEndpoint && import.meta.client) {
          try {
            if (nuxtApp.$pinia) {
              const authStore = useAuthStore(nuxtApp.$pinia)
              await authStore.logout()
              router.push('/auth/login' as any)
            }
          } catch (storeError) {
            console.warn('Could not access auth store for auto-logout:', storeError)
          }
        }

        throw apiError
      },
    })

    if (import.meta.server) {
      // SSR: create per-request instances to avoid cross-user leakage.
      return createClient()
    }

    if (!nuxtAppWithClient.$apiClient) {
      nuxtAppWithClient.$apiClient = createClient()
    }

    return nuxtAppWithClient.$apiClient
  }

  /**
   * Core fetch function with automatic CSRF retry
   */
  async function request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, query, credentials = true, ...headerOptions } = options
    const isMutationRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

    // For ALL modifying requests (POST, PUT, PATCH, DELETE), ensure CSRF cookie is fetched
    // XSRF is required for: Auth, Identity, Cart, Checkout, Favorites, Comparison, Notifications, Audience
    // Only on client-side and only if XSRF token is not already available
    if (import.meta.client && isMutationRequest) {
      const xsrfToken = getXsrfToken()
      if (!xsrfToken) {
        // Fetch CSRF cookie before making the request
        await nuxtApp.runWithContext(() => fetchCsrfCookie())
      }
    }

    const path = buildUrl(endpoint, query, headerOptions)
    const headers = buildHeaders(headerOptions)

    // For GET requests, XSRF token is not needed
    if (!isMutationRequest) {
      delete headers['X-XSRF-TOKEN']
    }

    return nuxtApp.runWithContext(async () => {
      return getApiClient()<T>(path, {
        method,
        headers,
        body: body ? body : undefined,
        credentials: credentials ? 'include' : 'omit',
        idempotent: headerOptions.idempotent,
      })
    }) as Promise<T>
  }

  /**
   * GET request
   */
  async function get<T>(
    endpoint: string,
    query?: Record<string, string | number | boolean | string[] | undefined>,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET', query })
  }

  /**
   * POST request
   */
  async function post<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  async function put<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH request
   */
  async function patch<T>(
    endpoint: string,
    body?: unknown,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  async function del<T>(
    endpoint: string,
    options?: UseApiOptions
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    fetchCsrfCookie,
    buildHeaders,
    buildUrl,
  }
}

/**
 * SSR-safe async data fetching
 * Use for SSR pages that need SEO
 */
export function useApiData<T>(
  key: string,
  endpoint: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined>
    apiOptions?: UseApiOptions
    transform?: (data: T) => T
    default?: () => T
    lazy?: boolean
    server?: boolean
    immediate?: boolean
  }
) {
  const api = useApi()

  return useAsyncData<T>(
    key,
    () => api.get<T>(endpoint, options?.query, options?.apiOptions),
    {
      transform: options?.transform,
      default: options?.default,
      lazy: options?.lazy,
      server: options?.server,
      immediate: options?.immediate,
    }
  )
}
