/**
 * Product DTO types
 * These reflect the API response payloads directly.
 */

import type { ImageValue } from '~/types/common'

export interface ProductPriceDTO {
  currency: string
  list_minor: string
  sale_minor: string
  effective_minor: string
}

export interface ProductImageDTO {
  id: number
  url: string
  alt?: string
  is_main?: boolean
  sort_order?: number
}

export interface AttributeValueDTO {
  attribute: {
    title: string
    code: string
  }
  code: string
  label: string
}

export interface ProductBrandDTO {
  id: number
  slug: string
  title: string
}

export interface VariantOptionAxisDTO {
  attribute_id: number
  code: string
  title: string
}

export interface VariantOptionValueDTO {
  value_id: number
  label: string
  slug: string
  is_in_stock: boolean
}

export interface VariantOptionsDTO {
  axes: VariantOptionAxisDTO[]
  options: Record<string, VariantOptionValueDTO[]>
}

export interface VariantOptionDTO {
  code: string
  name: string
  values: VariantOptionValueDTO[]
}

export interface ProductSpecificationDTO {
  group?: string
  items: SpecificationItemDTO[]
}

export interface SpecificationItemDTO {
  name: string
  value: string
}

export interface ProductRatingDTO {
  value: number
  count: number
}

export interface ProductDataDTO {
  id: number
  description?: string
  brand?: ProductBrandDTO
  categories?: Array<{
    id: number
    name?: string
    title?: string
    slug: string
  }>
  available_options?: unknown[]
}

export interface RelatedProductDTO {
  id: number
  name: string
  slug: string
  price: ProductPriceDTO | number
  effective_price?: number
  image?: ImageValue
}

export interface ProductDTO {
  id: number
  product_id: number
  title: string
  slug: string
  sku: string
  is_favorite: boolean
  price: ProductPriceDTO
  is_in_stock: boolean
  images: ProductImageDTO[]
  attribute_values: AttributeValueDTO[]
  rating?: ProductRatingDTO
  product?: ProductDataDTO
  variant_options?: VariantOptionsDTO
  // Legacy fields for backward compatibility
  name?: string
  effective_price?: number
  currency?: string
  in_stock?: boolean
  attributes?: AttributeValueDTO[]
  specifications?: ProductSpecificationDTO[]
  options?: VariantOptionDTO[]
  meta_title?: string
  meta_description?: string
  description?: string
  short_description?: string
  quantity?: number
  related_products?: RelatedProductDTO[]
}
