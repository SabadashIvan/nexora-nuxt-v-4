/**
 * Client info utilities
 * For capturing browser metadata (user agent, referer)
 * Used in support requests and leads
 */

/**
 * Client information for API requests
 */
export interface ClientInfo {
  user_agent: string
  referer: string
}

/**
 * Get client browser information
 * Returns empty strings on server-side
 */
export function getClientInfo(): ClientInfo {
  if (import.meta.server) {
    return {
      user_agent: '',
      referer: '',
    }
  }

  return {
    user_agent: navigator.userAgent,
    referer: document.referrer || '',
  }
}

/**
 * Get user agent string
 * Returns empty string on server-side
 */
export function getUserAgent(): string {
  if (import.meta.server) return ''
  return navigator.userAgent
}

/**
 * Get document referer
 * Returns empty string on server-side or if no referer
 */
export function getReferer(): string {
  if (import.meta.server) return ''
  return document.referrer || ''
}
