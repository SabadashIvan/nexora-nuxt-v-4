/**
 * Checkout API response mappers
 * Normalizes DTOs (items_minor, address_line1, etc.) to app types
 */

import type {
  Address,
  CheckoutAddressDto,
  CheckoutAddressPayloadDto,
  CheckoutAddresses,
  CheckoutItem,
  CheckoutItemDto,
  CheckoutPricing,
  CheckoutPricingDto,
  StartCheckoutResponseDto,
} from '~/types'

function nullToEmpty(s: string | null | undefined): string {
  return s ?? ''
}

/** Map API address DTO to Address */
export function mapCheckoutAddressDtoToAddress(dto: CheckoutAddressDto): Address | null {
  const first = nullToEmpty(dto.first_name)
  const last = nullToEmpty(dto.last_name)
  const phone = nullToEmpty(dto.phone)
  const country = nullToEmpty(dto.country)
  const region = nullToEmpty(dto.region)
  const city = nullToEmpty(dto.city)
  const postal = nullToEmpty(dto.postal)
  const line1 = nullToEmpty(dto.address_line1)
  const line2 = nullToEmpty(dto.address_line2)
  if (!first && !last && !phone && !country && !region && !city && !postal && !line1 && !line2) {
    return null
  }
  return {
    first_name: first,
    last_name: last,
    phone,
    country,
    region,
    city,
    postal,
    address_line_1: line1,
    address_line_2: line2 || undefined,
  }
}

/** Map Address to API payload (address_line1/2, postal) */
export function mapAddressToCheckoutPayload(addr: Address): CheckoutAddressPayloadDto {
  return {
    first_name: addr.first_name,
    last_name: addr.last_name,
    phone: addr.phone,
    country: addr.country,
    region: addr.region,
    city: addr.city,
    postal: addr.postal,
    address_line1: addr.address_line_1,
    address_line2: addr.address_line_2,
  }
}

/** Map pricing DTO to CheckoutPricing */
export function mapCheckoutPricingDtoToPricing(dto: CheckoutPricingDto): CheckoutPricing {
  return {
    currency: dto.currency,
    items: dto.items_minor,
    shipping: dto.shipping_minor,
    discounts: dto.discounts_minor,
    total: dto.grand_total_minor,
    loyalty_points_minor: dto.loyalty_points_minor,
    promotions: dto.promotions?.length ? dto.promotions : undefined,
  }
}

/** Map checkout item DTO to CheckoutItem */
export function mapCheckoutItemDtoToItem(dto: CheckoutItemDto): CheckoutItem {
  return {
    variant_id: dto.variant_id,
    sku: dto.sku,
    qty: dto.qty,
    price: dto.price,
    line_total_minor: dto.line_total_minor,
    loyalty_discount_minor: dto.loyalty_discount_minor,
    id: `checkout-${dto.variant_id}-${dto.sku}`,
    name: dto.sku,
  }
}

/** Map full start/update checkout response DTO to normalized state */
export function mapStartCheckoutResponseDto(
  dto: StartCheckoutResponseDto
): { id: string; items: CheckoutItem[]; pricing: CheckoutPricing; addresses: CheckoutAddresses } {
  const shipping = mapCheckoutAddressDtoToAddress(dto.shipping_address)
  const billing = mapCheckoutAddressDtoToAddress(dto.billing_address)
  return {
    id: String(dto.id),
    items: (dto.items ?? []).map(mapCheckoutItemDtoToItem),
    pricing: mapCheckoutPricingDtoToPricing(dto.pricing),
    addresses: {
      shipping,
      billing,
      billingSameAsShipping: dto.billing_same_as_shipping,
    },
  }
}
