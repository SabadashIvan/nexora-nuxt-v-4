export interface CoalesceOptions {
  ttlMs?: number
  maxSize?: number
  now?: () => number
}

export interface CoalesceCacheEntry<T> {
  ts: number
  data: T
}

export interface Coalescer<T> {
  cache: Map<string, CoalesceCacheEntry<T>>
  inFlight: Map<string, Promise<T>>
  coalesce: (key: unknown, fetcher: () => Promise<T>) => Promise<T>
  normalizeKey: (key: unknown) => string
  purgeExpired: () => void
}

const DEFAULT_TTL_MS = 15000
const DEFAULT_MAX_SIZE = 100

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    const entries = keys.map(key => `${key}:${stableStringify(record[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function normalizeKey(key: unknown): string {
  return typeof key === 'string' ? key : stableStringify(key)
}

function purgeExpired<T>(
  cache: Map<string, CoalesceCacheEntry<T>>,
  ttlMs: number,
  now: () => number
): void {
  const timestamp = now()
  for (const [key, entry] of cache) {
    if (timestamp - entry.ts > ttlMs) {
      cache.delete(key)
    }
  }
}

function enforceMaxSize<T>(
  cache: Map<string, CoalesceCacheEntry<T>>,
  maxSize: number
): void {
  while (cache.size > maxSize) {
    const oldestKey = cache.keys().next().value
    if (oldestKey === undefined) {
      return
    }
    cache.delete(oldestKey)
  }
}

function getCached<T>(
  cache: Map<string, CoalesceCacheEntry<T>>,
  key: string,
  ttlMs: number,
  now: () => number
): { hit: boolean; data?: T } {
  const entry = cache.get(key)
  if (!entry) {
    return { hit: false }
  }

  if (now() - entry.ts > ttlMs) {
    cache.delete(key)
    return { hit: false }
  }

  cache.delete(key)
  cache.set(key, entry)
  return { hit: true, data: entry.data }
}

export function createCoalescer<T>(options: CoalesceOptions = {}): Coalescer<T> {
  const cache = new Map<string, CoalesceCacheEntry<T>>()
  const inFlight = new Map<string, Promise<T>>()
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
  const now = options.now ?? Date.now

  const coalesce = async (keyInput: unknown, fetcher: () => Promise<T>): Promise<T> => {
    const key = normalizeKey(keyInput)
    purgeExpired(cache, ttlMs, now)

    const cached = getCached(cache, key, ttlMs, now)
    if (cached.hit) {
      return cached.data as T
    }

    const inFlightRequest = inFlight.get(key)
    if (inFlightRequest) {
      return inFlightRequest
    }

    const promise = fetcher()
      .then((data) => {
        cache.set(key, { ts: now(), data })
        enforceMaxSize(cache, maxSize)
        return data
      })
      .finally(() => {
        inFlight.delete(key)
      })

    inFlight.set(key, promise)
    return promise
  }

  return {
    cache,
    inFlight,
    coalesce,
    normalizeKey,
    purgeExpired: () => purgeExpired(cache, ttlMs, now),
  }
}
