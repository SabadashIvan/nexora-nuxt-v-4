# System & SEO API

Complete endpoints for system configuration, languages, currencies, SEO metadata, menus, and site contacts.

---

## System API

### 1. Get System Config
`GET /api/v1/system/config`

Returns global system configuration.

**Response includes:**
- locales
- currencies
- default currency
- min/max price
- feature toggles

---

### 2. Set Locale
`PUT /api/v1/system/locale`

Sets the user's preferred locale.

**Body:**
```json
{
  "locale": "en"
}
```

---

### 3. Set Currency
`PUT /api/v1/system/currency`

Sets the user's preferred currency.

**Body:**
```json
{
  "currency": "USD"
}
```

---

### 4. List Locales
`GET /api/v1/system/locales`

Returns list of available locales.

---

### 5. List Currencies
`GET /api/v1/system/currencies`

Returns list of available currencies.

---

### 6. Get Active Languages
`GET /api/v1/app/languages`

Returns a list of active site languages and the default language code.

**Response:**
```json
{
  "data": [
    {
      "code": "en",
      "title": "English",
      "is_default": false
    },
    {
      "code": "ru",
      "title": "Русский",
      "is_default": true
    },
    {
      "code": "awa",
      "title": "Авадхи",
      "is_default": false
    }
  ],
  "meta": {
    "default": "ru"
  }
}
```

**Response fields:**
- `data` (array): Array of language objects
- `data[].code` (string): Language code (ISO 639-1 or custom code)
- `data[].title` (string): Language display title
- `data[].is_default` (boolean): Whether this is the default language
- `meta` (object): Metadata
- `meta.default` (string): Default language code

**Use case:** This endpoint is used by the frontend to:
- Load available languages dynamically
- Configure @nuxtjs/i18n module
- Display language switcher UI
- Set default locale from API

---

### 7. Get Active Currencies
`GET /api/v1/app/currencies`

Returns a list of active site currencies and the default currency code.

**Response:**
```json
{
  "data": [
    {
      "code": "EUR",
      "symbol": "€",
      "precision": 2,
      "is_default": false
    },
    {
      "code": "USD",
      "symbol": "$",
      "precision": 2,
      "is_default": true
    },
    {
      "code": "UAH",
      "symbol": "₴",
      "precision": 2,
      "is_default": false
    }
  ],
  "meta": {
    "default": "USD"
  }
}
```

**Response fields:**
- `data` (array): Array of currency objects
- `data[].code` (string): Currency code (ISO 4217)
- `data[].symbol` (string): Currency symbol
- `data[].precision` (number): Decimal precision
- `data[].is_default` (boolean): Whether this is the default currency
- `meta.default` (string): Default currency code

---

### 8. System Health Check
`GET /api/v1/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-19T12:00:00+00:00"
}
```

---

## SEO API

Core endpoints for SEO metadata, menus, static pages, and site contacts.

### 1. Get SEO Metadata for a Page
`GET /api/v1/site?url={path}`

Retrieves SEO metadata for a given URL including title, description, and other meta information.

**Query parameters:**
- `url` (required): The URL to get SEO metadata for

**Response:**
```json
{
  "data": {
    "id": 1,
    "path": "/",
    "seoable_id": null,
    "seoable_type": null,
    "title_h1": "Welcome to Our Store",
    "title": "Online Store - Buy Quality Products",
    "description": "Shop quality products with fast delivery and great prices.",
    "keywords": "store, shop, products, online",
    "canonical": "https://example.com/",
    "robots": "index,follow",
    "text": "<p>SEO text content...</p>",
    "og_image": "https://example.com/og-image.jpg"
  }
}
```

**Response fields:**
- `data.title_h1` (string): H1 title
- `data.title` (string): SEO title
- `data.description` (string): SEO description
- `data.keywords` (string): SEO keywords
- `data.canonical` (string | null): Canonical URL
- `data.robots` (string): Robots meta tag
- `data.text` (string): SEO text content (HTML)
- `data.og_image` (string): Open Graph image URL

**Error responses:**
- `301`: Redirect (if URL is outdated and redirect rule exists)
- `404`: Page not found

**Notes:**
- If the requested URL is outdated and a redirect rule exists, this endpoint will return a 3xx redirect (usually 301) to the current URL instead of the SEO payload.

---

### 2. Get Localized Menu Tree
`GET /api/v1/site/menus/tree`

Returns the full navigational menu tree for the current locale.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Catalog",
    "link": "/catalog",
    "target": "_self",
    "css_class": null,
    "icon": null,
    "banner_desktop": "https://cdn.example.com/banners/catalog-desktop-en.webp",
    "banner_mobile": "https://cdn.example.com/banners/catalog-mobile-en.webp",
    "children": [
      {
        "id": 11,
        "title": "Smartphones",
        "link": "/catalog/smartphones",
        "target": "_self",
        "css_class": null,
        "icon": null,
        "banner_desktop": null,
        "banner_mobile": null,
        "children": []
      }
    ]
  }
]
```

**Response fields:**
- Array of menu item objects with nested children
- Each item may contain: id, title, link, target, css_class, icon, banner_desktop, banner_mobile, children

---

### 3. Get Site Contacts
`GET /api/v1/site/contacts`

Returns site contacts, messengers, and socials from Spatie settings. Translatable fields are automatically localized to the current request locale.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
```json
{
  "data": {
    "contacts": {
      "address": "123 Demo Street, Springfield",
      "address_link": "https://maps.google.com/?q=123+Demo+Street+Springfield",
      "phones": [
        "+1 (555) 010-2000",
        "+1 (555) 010-2001"
      ],
      "email": "info@example.com",
      "schedule_html": "<p>Mon-Fri: 9:00 - 18:00</p>",
      "map_iframe": "<iframe src=\"https://maps.google.com\" loading=\"lazy\"></iframe>",
      "image": []
    },
    "messengers": [
      { "icon": null, "title": "Telegram", "url": "https://t.me/example" },
      { "icon": null, "title": "Viber", "url": "viber://chat?number=%2B15550102000" }
    ],
    "socials": [
      { "icon": null, "title": "Facebook", "url": "https://facebook.com/example" },
      { "icon": null, "title": "Instagram", "url": "https://instagram.com/example" }
    ]
  }
}
```

**Response fields:**
- `data.contacts` (object): Contact information (address, phones, email, schedule, map)
- `data.messengers` (array): Messenger links (Telegram, Viber, WhatsApp, etc.)
- `data.socials` (array): Social media links (Facebook, Instagram, YouTube, etc.)

---

### 4. Get Static Page by Slug
`GET /api/v1/site/pages/{slug}`

Returns a single static page by its slug with SEO data. The response is cached and automatically invalidated on page changes.

**Path parameters:**
- `slug` (string): Page slug (e.g., "terms", "privacy", "faq")

**Response:**
```json
{
  "data": {
    "id": 1,
    "slug": "terms",
    "title": "Terms of Service",
    "content": "<p>Page content HTML...</p>",
    "excerpt": "Page excerpt text",
    "url": "/en/pages/terms",
    "seo": {
      "id": 3518,
      "path": "terms",
      "seoable_id": 1,
      "seoable_type": "Modules\\Site\\Models\\Page",
      "title_h1": "Terms of Service",
      "title": "Terms of Service - Our Store",
      "description": "Read our terms of service...",
      "keywords": "terms, service, conditions",
      "canonical": null,
      "robots": "index,follow",
      "text": "<p>Additional SEO text...</p>",
      "og_image": "https://example.com/og-terms.jpg"
    }
  }
}
```

**Response fields:**
- `data.id` (number): Page identifier
- `data.slug` (string): URL-friendly page identifier
- `data.title` (string): Page title
- `data.content` (string): Full page content (HTML)
- `data.excerpt` (string): Page excerpt/summary
- `data.url` (string): Full URL path for the page
- `data.seo` (object): SEO metadata for the page

**Error responses:**
- `404`: Page not found

**Notes:**
- Public endpoint (no authentication required)
- Response is cached on the backend and invalidated when page content changes
- Used for static pages like Terms of Service, Privacy Policy, FAQ, Returns, Shipping, etc.

---

### 5. Get Homepage Banners
`GET /api/v1/banners/homepage`

Retrieves all visible Hero type banners for the homepage.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": 1,
      "title": "Collection 2025",
      "url": "/collection-2025",
      "desktop_image": "https://example.com/storage/banners/hero-1-desktop.webp",
      "mobile_image": "https://example.com/storage/banners/hero-1-mobile.webp",
      "position": 1
    },
    {
      "id": 2,
      "type": 1,
      "title": "50% Off",
      "url": "/categories/clothes",
      "desktop_image": "https://example.com/storage/banners/hero-2-desktop.webp",
      "mobile_image": "https://example.com/storage/banners/hero-2-mobile.webp",
      "position": 2
    }
  ]
}
```

**Response fields:**
- `data` (array): Array of banner objects
- `data[].id` (number): Banner identifier
- `data[].type` (number): Banner type (1 = Hero)
- `data[].title` (string): Banner title
- `data[].url` (string): Banner link URL
- `data[].desktop_image` (string): Desktop image URL
- `data[].mobile_image` (string): Mobile image URL
- `data[].position` (number): Display order

---

### 9. Get Site Locations
`GET /api/v1/site/locations`

Returns a list of active physical store/office locations with details.

**Authentication:** None required (public endpoint)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Main Office",
      "address": "123 Demo Street, Springfield",
      "address_link": "https://maps.google.com/?q=123+Demo+Street+Springfield",
      "schedule": {
        "monday": "09:00-18:00",
        "tuesday": "09:00-18:00",
        "wednesday": "09:00-18:00",
        "thursday": "09:00-18:00",
        "friday": "09:00-18:00",
        "saturday": "10:00-16:00",
        "sunday": "Closed"
      },
      "phones": [
        "+1 (555) 010-2000",
        "+1 (555) 010-2001"
      ],
      "map_iframe": "<iframe src=\"https://maps.google.com/maps?q=...\" width=\"600\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\"></iframe>",
      "website_link": "https://example.com",
      "image": "https://example.com/storage/locations/main-office.jpg"
    },
    {
      "id": 2,
      "title": "Downtown Store",
      "address": "456 Market Street, City Center",
      "address_link": "https://maps.google.com/?q=456+Market+Street+City+Center",
      "schedule": {
        "monday": "10:00-20:00",
        "tuesday": "10:00-20:00",
        "wednesday": "10:00-20:00",
        "thursday": "10:00-20:00",
        "friday": "10:00-21:00",
        "saturday": "10:00-21:00",
        "sunday": "11:00-18:00"
      },
      "phones": [
        "+1 (555) 020-3000"
      ],
      "map_iframe": "<iframe src=\"https://maps.google.com/maps?q=...\" width=\"600\" height=\"450\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\"></iframe>",
      "website_link": null,
      "image": null
    }
  ]
}
```

**Response fields:**
- `data` (array): Array of location objects
- `data[].id` (number): Location identifier
- `data[].title` (string): Location name/title
- `data[].address` (string): Full physical address
- `data[].address_link` (string | null): Google Maps link for the address
- `data[].schedule` (object): Weekly schedule with day names as keys
  - Keys: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
  - Values: Time ranges (e.g., "09:00-18:00") or "Closed"
- `data[].phones` (array): Array of phone numbers
- `data[].map_iframe` (string | null): Embeddable Google Maps iframe HTML
- `data[].website_link` (string | null): Location-specific website URL
- `data[].image` (string | null): Location image URL

**Frontend Implementation:**

**Store:** `/app/stores/system.store.ts`
```typescript
async fetchLocations(): Promise<SiteLocation[]> {
  const api = useApi()
  const response = await api.get<{data: SiteLocation[]}>('/site/locations')
  return response.data
}
```

**Page:** `/app/pages/stores.vue`
- SSR-enabled page for SEO
- Displays locations in a responsive grid
- Shows address, phones, schedule, map iframe, website link
- Highlights current day in schedule
- Click-to-call phone numbers
- Map iframe with lazy loading
- Loading and empty states

**Usage Example:**
```vue
<script setup>
const systemStore = useSystemStore()
const { data: locations, pending } = await useAsyncData(
  'site-locations',
  () => systemStore.fetchLocations(),
  { server: true }
)
</script>
```

**Notes:**
- Returns only active locations
- Schedule fields are translatable (respects `Accept-Language` header)
- Map iframes should have `loading="lazy"` attribute
- Phone numbers should use `tel:` protocol for mobile click-to-call
- Address links typically use Google Maps format

---

## SSR/CSR Behavior

**SSR Pages** (Must be fetched on SSR):
- Languages (`/api/v1/app/languages`)
- Currencies (`/api/v1/app/currencies`)
- SEO metadata (`/api/v1/site?url={path}`)
- Menu tree (`/api/v1/site/menus/tree`)
- Site contacts (`/api/v1/site/contacts`)
- Site locations (`/api/v1/site/locations`)
- Static pages (`/api/v1/site/pages/{slug}`)
- Homepage banners (`/api/v1/banners/homepage`)

**CSR Compatible:**
- System config updates (locale, currency)
- Health check

**Authentication:**
- None required for read endpoints
- Optional for system preference updates (locale, currency)

---

## Important Notes

1. **Localization**: All content respects `Accept-Language` header
2. **SEO Redirects**: SEO endpoint may return 301 redirect for outdated URLs
3. **Caching**: Static pages and some SEO data are cached on backend
4. **Menu Nesting**: Menu items support unlimited nesting levels
5. **Banner Types**: Currently only type 1 (Hero) is supported
6. **Static Pages**: Common slugs: "terms", "privacy", "faq", "returns", "shipping"
7. **Currency Precision**: Affects decimal places in price formatting
8. **Default Language**: Used as fallback when requested locale is unavailable

---

## System Initialization Flow

For proper frontend initialization:

1. **Fetch Languages** → `GET /api/v1/app/languages`
2. **Configure i18n** → Use languages data to setup @nuxtjs/i18n
3. **Fetch Currencies** → `GET /api/v1/app/currencies`
4. **Setup Currency Store** → Initialize currency selection
5. **Fetch SEO** → `GET /api/v1/site?url={currentPath}` (for every page)
6. **Fetch Menu** → `GET /api/v1/site/menus/tree` (once, cache in store)
7. **Fetch Contacts** → `GET /api/v1/site/contacts` (once, cache in store)

All of these should happen in SSR for optimal SEO and UX.
