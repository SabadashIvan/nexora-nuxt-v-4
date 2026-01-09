/**
 * Utility functions for handling locale-aware links
 * Processes API-provided links and converts them to locale-aware paths
 */

/**
 * Check if a link is external (starts with http://, https://, mailto:, tel:, or //)
 */
function isExternalLink(link: string): boolean {
  if (!link || typeof link !== 'string') {
    return false
  }
  
  const trimmed = link.trim()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('//')
  )
}

/**
 * Extract path and query from a link
 */
function parseLink(link: string): { path: string; query?: string } {
  if (!link || typeof link !== 'string') {
    return { path: '/' }
  }

  const trimmed = link.trim()
  
  // Handle external links
  if (isExternalLink(trimmed)) {
    return { path: trimmed }
  }

  // Split path and query
  const [path, query] = trimmed.split('?')
  
  return {
    path: path || '/',
    query: query || undefined,
  }
}

/**
 * Make a locale-aware path from an API link
 * This function should be used in components with useLocalePath() composable
 * 
 * @param link - Link from API (may be relative or absolute)
 * @param localePath - Function from useLocalePath() composable
 * @returns Locale-aware path
 * 
 * @example
 * ```typescript
 * const localePath = useLocalePath()
 * const link = makeLocalePath(item.link, localePath)
 * ```
 */
export function makeLocalePath(
  link: string,
  localePath: (path: string) => string
): string {
  if (!link || typeof link !== 'string') {
    return localePath('/')
  }

  const trimmed = link.trim()
  
  // Return external links as-is
  if (isExternalLink(trimmed)) {
    return trimmed
  }

  // Parse path and query
  const { path, query } = parseLink(trimmed)
  
  // Build full path with query if present
  const fullPath = query ? `${path}?${query}` : path
  
  // Use localePath to convert to locale-aware path
  // localePath handles query parameters automatically
  return localePath(fullPath)
}

