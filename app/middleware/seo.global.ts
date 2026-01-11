/**
 * Global SEO middleware
 * Fetches SEO metadata for SSR pages
 */

import { NOINDEX_ROUTES } from '~/types/seo'
import { getActivePinia } from 'pinia'
import { useSeoStore } from '~/stores/seo.store'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip SEO for noindex routes
  const shouldSkipSeo = NOINDEX_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return to.path.startsWith(route.slice(0, -1))
    }
    return to.path === route
  })

  if (shouldSkipSeo) {
    // Apply noindex meta for private routes
    useHead({
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    })
    return
  }

  // Only try to access store if Pinia is initialized
  const pinia = getActivePinia()
  if (!pinia) {
    // Pinia not available yet - apply fallback SEO
    useHead({
      title: 'Nexora Shop',
      meta: [
        { name: 'description', content: 'Your trusted e-commerce destination' },
      ],
    })
    return
  }

  // Fetch SEO metadata for public pages
  try {
    const config = useRuntimeConfig()
    const seoStore = useSeoStore()
    
    // Build full frontend URL
    const siteUrl = config.public.siteUrl as string || 'http://localhost:3000'
    // Use fullPath to include query parameters
    const fullUrl = `${siteUrl}${to.fullPath}`
    
    await seoStore.fetch(fullUrl)
    seoStore.apply(to.fullPath)

    // Add hreflang and canonical tags for multilingual SEO
    try {
      const systemStore = useSystemStore()
      const languages = systemStore.locales || []
      const currentLocale = systemStore.currentLocale || 'ru'
      
      if (languages.length > 0) {
        const links: Array<{ rel: string; hreflang?: string; href: string }> = []
        
        // Get current route path without locale prefix for base path calculation
        let basePath = to.path
        // Remove locale prefix if present (e.g., /uk/categories -> /categories)
        const localePrefix = `/${currentLocale}/`
        if (basePath.startsWith(localePrefix)) {
          basePath = basePath.slice(localePrefix.length - 1)
        }
        
        // Generate hreflang tags for all languages
        languages.forEach((lang) => {
          try {
            // Build alternate URL with language prefix
            let alternatePath = basePath
            const defaultLanguage = languages.find(l => l.is_default) || languages[0]
            
            // Add locale prefix if not default language
            if (lang.code !== defaultLanguage?.code) {
              alternatePath = `/${lang.code}${basePath}`
            }
            
            const alternateUrl = `${siteUrl}${alternatePath}`
            links.push({
              rel: 'alternate',
              hreflang: lang.code,
              href: alternateUrl,
            })
          } catch (error) {
            // Skip if generation fails for this language
            console.warn(`Could not generate hreflang for ${lang.code}:`, error)
          }
        })

        // Add x-default pointing to default language
        const defaultLanguage = languages.find(l => l.is_default) || languages[0]
        if (defaultLanguage) {
          try {
            // Default language has no prefix
            const defaultPath = basePath
            const defaultUrl = `${siteUrl}${defaultPath}`
            links.push({
              rel: 'alternate',
              hreflang: 'x-default',
              href: defaultUrl,
            })
          } catch (error) {
            console.warn('Could not generate x-default hreflang:', error)
          }
        }

        // Add canonical tag for current language
        try {
          let canonicalPath = basePath
          const defaultLanguage = languages.find(l => l.is_default) || languages[0]
          
          // Add locale prefix if not default language
          if (currentLocale !== defaultLanguage?.code) {
            canonicalPath = `/${currentLocale}${basePath}`
          }
          
          const canonicalUrl = `${siteUrl}${canonicalPath}`
          links.push({
            rel: 'canonical',
            href: canonicalUrl,
          })
        } catch (error) {
          // Fallback to current path
          links.push({
            rel: 'canonical',
            href: `${siteUrl}${to.path}`,
          })
        }

        // Apply hreflang and canonical links
        if (links.length > 0) {
          useHead({
            link: links,
          })
        }
      }
    } catch (i18nError) {
      // i18n might not be available, that's okay
      console.warn('Could not generate hreflang tags:', i18nError)
    }
  } catch (error) {
    console.error('Failed to fetch SEO metadata:', error)
    // Apply fallback SEO
    useHead({
      title: 'Nexora Shop',
      meta: [
        { name: 'description', content: 'Your trusted e-commerce destination' },
      ],
    })
  }
})
