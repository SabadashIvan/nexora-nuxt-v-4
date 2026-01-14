/**
 * Product mapper utilities
 */

import type { ProductDTO } from '~/types/api/dto/product.dto'
import type { Product, ProductPriceFormatted } from '~/types'
import { formatPrice } from '~/utils/price'

const parseMinorValue = (value?: string | number): number => {
  if (typeof value === 'number') return value
  if (!value) return 0
  const cleaned = value.replace(/[^\d.-]/g, '')
  const parsed = Number.parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

const buildFormattedPrice = (price: ProductDTO['price']): ProductPriceFormatted => {
  const currency = price?.currency || 'USD'
  const listMinor = parseMinorValue(price?.list_minor)
  const saleMinor = parseMinorValue(price?.sale_minor)
  const effectiveMinor = parseMinorValue(price?.effective_minor)

  return {
    ...price,
    formatted: {
      list: listMinor ? formatPrice(listMinor, { currency }) : undefined,
      sale: saleMinor ? formatPrice(saleMinor, { currency }) : undefined,
      effective: formatPrice(effectiveMinor, { currency }),
    },
  }
}

export const mapProductDTOToModel = (dto: ProductDTO): Product => {
  return {
    ...dto,
    price: buildFormattedPrice(dto.price),
    images: dto.images ? [...dto.images] : [],
    attribute_values: dto.attribute_values ? [...dto.attribute_values] : [],
    product: dto.product ? { ...dto.product } : undefined,
    variant_options: dto.variant_options ? { ...dto.variant_options } : undefined,
    related_products: dto.related_products ? [...dto.related_products] : undefined,
  }
}
