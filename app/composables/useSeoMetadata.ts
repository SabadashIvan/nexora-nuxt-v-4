import type { SeoMeta } from '~/types'
import { useApi } from '~/composables/useApi'

const DEFAULT_SEO: SeoMeta = {
  title: 'Nexora Shop',
  description: 'Your trusted e-commerce destination',
}

export async function fetchSeoMetadata(fullUrl: string): Promise<SeoMeta> {
  const api = useApi()
  try {
    const response = await api.get<{ data: SeoMeta }>('/site', { url: fullUrl })
    return response.data
  } catch (error) {
    console.error('SEO fetch error:', error)
    return { ...DEFAULT_SEO }
  }
}

export function applySeoMetadata(meta: SeoMeta, fullPath?: string): void {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string || 'http://localhost:3000'

  let canonicalUrl = meta.canonical
  if (!canonicalUrl) {
    if (import.meta.client) {
      canonicalUrl = window.location.href
    } else {
      const safePath = fullPath || '/'
      canonicalUrl = `${siteUrl}${safePath}`
    }
  }

  useSeoMeta({
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: meta.robots,
    ogTitle: meta.og_title || meta.title,
    ogDescription: meta.og_description || meta.description,
    ogImage: meta.og_image,
  })

  if (canonicalUrl) {
    useHead({
      link: [
        { rel: 'canonical', href: canonicalUrl },
      ],
    })
  }
}

export function applyNoIndexMeta(): void {
  useSeoMeta({
    robots: 'noindex, nofollow',
  })
}
