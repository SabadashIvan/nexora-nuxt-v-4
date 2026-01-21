/**
 * System configuration types
 */

export interface Locale {
  code: string
  title: string
  is_default?: boolean
}

export interface LanguagesResponse {
  data: Locale[]
  meta: {
    default: string
  }
}

export interface Currency {
  code: string
  name: string
  symbol: string
  decimal_places?: number
  is_default?: boolean
}

export interface SystemConfig {
  locales: Locale[]
  currencies: Currency[]
  default_locale: string
  default_currency: string
  min_price?: number
  max_price?: number
  features?: Record<string, boolean>
}

export interface SetLocalePayload {
  locale: string
}

export interface SetCurrencyPayload {
  currency: string
}

/**
 * Currency response from /api/v1/app/currencies endpoint
 */
export interface CurrencyResponse {
  code: string
  symbol: string
  precision: number
  is_default: boolean
}

export interface CurrenciesResponse {
  data: CurrencyResponse[]
  meta: {
    default: string
  }
}

/**
 * Messenger link (WhatsApp, Telegram, etc.)
 */
export interface MessengerLink {
  icon: string | null
  title: string
  url: string
}

/**
 * Social media link
 */
export interface SocialLink {
  icon: string | null
  title: string
  url: string
}

/**
 * Site contact information
 */
export interface SiteContactsData {
  address: string
  address_link: string
  phones: string[]
  email: string
  schedule_html: string
  map_iframe: string
  image: unknown[]
}

/**
 * Site contacts response from /api/v1/site/contacts
 */
export interface SiteContacts {
  contacts: SiteContactsData
  messengers: MessengerLink[]
  socials: SocialLink[]
}

export interface SiteContactsResponse {
  data: SiteContacts
}

/**
 * Site location schedule by day
 */
export interface LocationSchedule {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

/**
 * Physical store/office location
 */
export interface SiteLocation {
  id: number
  title: string
  address: string
  address_link: string | null
  schedule: LocationSchedule
  phones: string[]
  map_iframe: string | null
  website_link: string | null
  image: string | null
}

/**
 * Site locations response from /api/v1/site/locations
 */
export interface SiteLocationsResponse {
  data: SiteLocation[]
}

