/**
 * Nitro Request Coalescing & TTL Cache
 * 
 * Reduces upstream provider load by:
 * - Coalescing in-flight identical requests (single upstream call shared by many clients)
 * - Short TTL caching for repeated requests
 * 
 * Instance-local only (best effort per Nitro instance)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface InFlightRequest<T> {
  promise: Promise<T>
  timestamp: number
}

// Instance-local cache and in-flight tracking
const cache = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, InFlightRequest<unknown>>()

// Default TTL (5-30 seconds as per plan)
const DEFAULT_TTL = 10 * 1000 // 10 seconds

/**
 * Normalize request parameters to a stable cache key
 */
export function normalizeCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | string[] | undefined>
): string {
  const sortedParams = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}=${value.sort().join(',')}`
          }
          return `${key}=${String(value)}`
        })
        .join('&')
    : ''

  return `${endpoint}?${sortedParams}`
}

/**
 * Get cached response if available and not expired
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const age = Date.now() - entry.timestamp
  if (age > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Set cache entry with TTL
 */
function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Clean up expired cache entries (call periodically)
 */
export function cleanupCache(): void {
  const now = Date.now()
  for (const key of Array.from(cache.keys())) {
    const entry = cache.get(key)
    if (entry) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        cache.delete(key)
      }
    }
  }

  // Clean up stale in-flight requests (older than 30 seconds)
  for (const key of Array.from(inFlight.keys())) {
    const request = inFlight.get(key)
    if (request) {
      const age = now - request.timestamp
      if (age > 30 * 1000) {
        inFlight.delete(key)
      }
    }
  }
}

/**
 * Coalesce and cache a request
 * 
 * @param key - Cache key (from normalizeCacheKey)
 * @param fetcher - Function that fetches data from upstream
 * @param ttl - Optional TTL in milliseconds (default: 10s)
 * @returns Cached or coalesced response
 */
export async function coalesceRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check cache first
  const cached = getCached<T>(key)
  if (cached !== null) {
    return cached
  }

  // Check if request is in-flight
  const existingRequest = inFlight.get(key) as InFlightRequest<T> | undefined
  if (existingRequest) {
    // Wait for existing request
    return existingRequest.promise
  }

  // Create new request
  const promise = fetcher()
    .then((data) => {
      // Cache the response
      setCache(key, data, ttl)
      // Remove from in-flight
      inFlight.delete(key)
      return data
    })
    .catch((error) => {
      // Remove from in-flight on error
      inFlight.delete(key)
      throw error
    })

  // Track in-flight request
  inFlight.set(key, {
    promise,
    timestamp: Date.now(),
  })

  return promise
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
    inFlight.delete(key)
  } else {
    cache.clear()
    inFlight.clear()
  }
}

// Periodic cleanup (every 30 seconds)
// Note: This runs on server-side only (Nitro)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 30 * 1000)
}
