/**
 * Logger Utility
 * 
 * Environment-based logging with production breadcrumbs support
 * 
 * Policy:
 * - Development: Use console.debug for all logs
 * - Production: Use Sentry breadcrumbs (not console spam)
 * - Rate limiting for logs (prevent Sentry flooding)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

// Rate limiting state
const rateLimitState = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // Max logs per window

/**
 * Check if log should be rate limited
 */
function shouldRateLimit(key: string): boolean {
  const now = Date.now()
  const state = rateLimitState.get(key)

  if (!state || now > state.resetAt) {
    rateLimitState.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (state.count >= RATE_LIMIT_MAX) {
    return true
  }

  state.count++
  return false
}

/**
 * Log to Sentry breadcrumb (production)
 */
function logToSentry(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  // TODO: Integrate with Sentry when available
  // For now, this is a placeholder
  if (import.meta.dev) {
    // In dev, still use console but with structured format
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    logFn(`[${level.toUpperCase()}]`, message, data || '')
  }
  // In production, this would send to Sentry breadcrumbs
}

/**
 * Create a logger instance
 */
export function useLogger(name: string): Logger {
  const isDev = import.meta.dev
  const rateLimitKey = `logger:${name}`

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(`[${name}]`, ...args)
      }
      // Production: Skip debug logs or send to Sentry if needed
    },

    info: (...args: unknown[]) => {
      if (isDev) {
        console.info(`[${name}]`, ...args)
      } else {
        const message = args[0] as string
        const data = args[1] as Record<string, unknown> | undefined
        if (!shouldRateLimit(`${rateLimitKey}:info`)) {
          logToSentry('info', message, data)
        }
      }
    },

    warn: (...args: unknown[]) => {
      if (isDev) {
        console.warn(`[${name}]`, ...args)
      } else {
        const message = args[0] as string
        const data = args[1] as Record<string, unknown> | undefined
        if (!shouldRateLimit(`${rateLimitKey}:warn`)) {
          logToSentry('warn', message, data)
        }
      }
    },

    error: (...args: unknown[]) => {
      // Errors are always logged (not rate limited)
      if (isDev) {
        console.error(`[${name}]`, ...args)
      } else {
        const message = args[0] as string
        const data = args[1] as Record<string, unknown> | undefined
        logToSentry('error', message, data)
      }
    },
  }
}

/**
 * Default logger instance
 */
export const logger = useLogger('app')
