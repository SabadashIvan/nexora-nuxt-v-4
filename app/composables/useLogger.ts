import { useNuxtApp } from '#app'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogPayload = {
  category?: string
  data?: Record<string, unknown>
  key?: string
}

type SentryBreadcrumb = {
  level?: 'debug' | 'info' | 'warning' | 'error'
  category?: string
  message?: string
  data?: Record<string, unknown>
}

type SentryClient = {
  addBreadcrumb?: (breadcrumb: SentryBreadcrumb) => void
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitState = new Map<string, { windowStart: number; count: number }>()

function shouldLog(key: string): boolean {
  const now = Date.now()
  const current = rateLimitState.get(key)
  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(key, { windowStart: now, count: 1 })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }

  current.count += 1
  return true
}

function mapSentryLevel(level: LogLevel): SentryBreadcrumb['level'] {
  if (level === 'warn') return 'warning'
  return level
}

function normalizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined
  const normalized: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Error) {
      normalized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      }
    } else {
      normalized[key] = value
    }
  })

  return normalized
}

export function useLogger() {
  const nuxtApp = useNuxtApp()
  const isDev = import.meta.dev
  const sentry = (nuxtApp as typeof nuxtApp & { $sentry?: SentryClient }).$sentry

  function log(level: LogLevel, message: string, payload: LogPayload = {}) {
    if (!isDev) {
      const key = payload.key ?? `${level}:${message}`
      if (!shouldLog(key)) {
        return
      }

      if (sentry?.addBreadcrumb) {
        sentry.addBreadcrumb({
          level: mapSentryLevel(level),
          category: payload.category ?? 'app',
          message,
          data: normalizeData(payload.data),
        })
      }

      return
    }

    const consoleMethod = console[level] ?? console.log
    consoleMethod(message, payload.data ?? {})
  }

  return {
    debug: (message: string, payload?: LogPayload) => log('debug', message, payload),
    info: (message: string, payload?: LogPayload) => log('info', message, payload),
    warn: (message: string, payload?: LogPayload) => log('warn', message, payload),
    error: (message: string, payload?: LogPayload) => log('error', message, payload),
  }
}
