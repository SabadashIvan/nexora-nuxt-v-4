/**
 * Static Page domain types
 */

export interface PageSeo {
  id: number
  path: string
  seoable_id: number
  seoable_type: string
  title_h1: string | ''
  title: string | ''
  description: string | ''
  keywords: string | ''
  canonical: string | null
  robots: string | ''
  text: string | ''
  og_image: string | ''
}

export interface Page {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string
  url: string
  seo: PageSeo
}

/**
 * Static page API response structure
 * Matches the actual API response with data wrapper
 */
export interface PageResponse {
  data: Page
}
