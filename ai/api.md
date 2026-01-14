(Full detailed, English, fully reorganized)

# API Documentation
Complete REST API Specification

This document describes the full backend API for the Nuxt 4 e-commerce frontend.

It includes all available endpoints from your Scribe export (90+ total endpoints), categorized by domain and kept up-to-date with the latest backend API changes.

All endpoints are grouped for clarity and include:

method

path

parameters

request body

expected responses

authentication rules

notes and constraints

## Authentication & Security Model

This API uses **SPA Authorization via Laravel Sanctum (cookie-based)**.

Rules:
- Authentication is session-based
- Frontend MUST NOT use Bearer tokens
- Authorization header is NOT required for authenticated requests
- CSRF protection is mandatory

Frontend login flow:
1. `GET /sanctum/csrf-cookie`
2. `POST /login`

All authenticated requests rely on HTTP-only cookies.

### ⚠️ Legacy Authentication (DEPRECATED)

The following endpoints are deprecated and must NOT be used by frontend:

- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/logout`
- `/api/v1/auth/user`

Use **Identity API** instead:
- `/login`
- `/register`
- `/logout`
- `/api/v1/identity/me/profile`

1. Identity API (NEW)

Identity API is cookie-based (Sanctum).
Do NOT use Bearer tokens on frontend.

1.1 Register
POST /register

Body:

{
  "name": "John Doe",
  "email": "johndoe@mail.com",
  "password": "password",
  "password_confirmation": "password"
}

Response (success):

204 No Content

Error responses:

- 422: Validation error (e.g., email already registered, password too weak)
- 429: Too many registration attempts. Please try again in {time} seconds.

1.2 Login (SPA / Sanctum)
POST /login

Body:

{
  "email": "johndoe@mail.com",
  "password": "password",
  "remember": true  // Optional: Remember the user session. Defaults to true.
}

Response (success):

204 No Content

Error responses:

- 422: The provided credentials are incorrect.
- 429: Too many login attempts. Please try again in {time} seconds.

1.3 Logout
POST /logout

Requires authentication via cookies.

Response (success):

204 No Content

1.4 Get Profile
GET /api/v1/identity/me/profile

Requires authentication via cookies.

Response:

{
  "id": 1,
  "name": "John Doe",
  "email": "..."
}

1.5 Addresses

1.5.1 Get Addresses
GET /api/v1/identity/addresses

1.5.2 Create Address
POST /api/v1/identity/addresses

Body:

{
  "type": "shipping",
  "first_name": "John",
  "last_name": "Doe",
  "street": "123 Main St",
  "city": "New York",
  "country": "US",
  "postal_code": "10001"
}

1.5.3 Update Address
PUT /api/v1/identity/addresses/{id}

Body:

{
  "first_name": "John",
  "last_name": "Doe",
  "street": "123 Main St",
  "city": "New York",
  "country": "US",
  "postal_code": "10001"
}

1.5.4 Delete Address
DELETE /api/v1/identity/addresses/{id}

2. Email Verification API

Supports full email verification flow.

2.1 Verify Email
GET /verify-email/{id}/{hash}

Verifies the user email address.

2.2 Resend Verification Email
POST /email/verification-notification

Response:

{
  "status": "verification-link-sent"
}

3. Password Reset API
3.1 Request Password Reset Link
POST /forgot-password

Body:

{
  "email": "user@mail.com"
}

Response (success):

204 No Content

Error responses:

- 422: The provided email is invalid.
- 429: Too many password reset requests. Please try again in {time} seconds.

3.2 Reset Password
POST /reset-password

Body:

{
  "token": "reset-token",
  "email": "user@mail.com",
  "password": "newpass",
  "password_confirmation": "newpass"
}

Response (success):

204 No Content

Error responses:

- 422: The reset token is invalid or expired.
- 429: Too many password reset attempts. Please try again in {time} seconds.

4. System API
4.1 Get System Config
GET /api/v1/system/config

Returns global config:

locales

currencies

default currency

min/max price

feature toggles




4.2 Set Locale
PUT /api/v1/system/locale

Body:

{ "locale": "en" }

4.3 Set Currency
PUT /api/v1/system/currency

Body:

{ "currency": "USD" }

4.4 List Locales
GET /api/v1/system/locales
4.5 List Currencies
GET /api/v1/system/currencies

4.6 Get Active Languages
GET /api/v1/app/languages

4.7 Get Active Currencies
GET /api/v1/app/currencies

Returns a list of active site currencies and the default currency code.

**Response:**
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

**Response fields:**
- `data` (array): Array of currency objects
- `data[].code` (string): Currency code (ISO 4217)
- `data[].symbol` (string): Currency symbol
- `data[].precision` (number): Decimal precision
- `data[].is_default` (boolean): Whether this is the default currency
- `meta.default` (string): Default currency code

Returns a list of active site languages and the default language code.

Response:

{
  "data": [
    {
      "code": "en",
      "title": "Английский",
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

Response fields:

data (array): Array of language objects
data[].code (string): Language code (ISO 639-1 or custom code)
data[].title (string): Language display title
data[].is_default (boolean): Whether this is the default language
meta (object): Metadata
meta.default (string): Default language code

This endpoint is used by the frontend to:
- Load available languages dynamically
- Configure @nuxtjs/i18n module
- Display language switcher UI
- Set default locale from API

5. Notifications API (NEW)

5.1 List Notifications
GET /api/v1/notifications

**Query params:**
- `filter` (optional): Filter by type. Allowed values: `all`, `unread`, `archived`. Default: `all`
- `page` (optional): Page number for pagination

**Response:**
{
  "data": [
    {
      "id": "01HZYZ9S2W8X3C4V5B6N7M8K9J",
      "subject": "Invoice paid",
      "body": "Your invoice #INV-1001 has been paid.",
      "url": "https://example.com/invoices/INV-1001",
      "read_at": "2025-10-20T12:34:56+00:00",
      "is_archived": false,
      "created_at": "2025-10-20T12:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "has_more_pages": true
  }
}

5.2 Get Notification Preferences
GET /api/v1/notifications/preferences

Returns the editable notification preferences matrix for the current user.

**Response:**
{
  "data": [
    {
      "value": 1,
      "title": "Email",
      "contact_channel": {
        "value": 1,
        "can_link": true,
        "can_unlink": true,
        "is_linked": true
      },
      "groups": [
        {
          "value": 1,
          "title": "System notifications",
          "description": "Critical system updates and security alerts.",
          "enabled": true
        }
      ]
    }
  ]
}

5.3 Update Preferences by Channel/Group
PUT /api/v1/notifications/preferences/{channel}/{group}

Toggles the user's subscription for a specific notification group on the given delivery channel.

**Path parameters:**
- `channel` (integer): Delivery channel ID. Allowed values: 1 (Mail), 2 (Database), 3 (Broadcast)
- `group` (integer): Notification group ID

**Response:**
{
  "data": {
    "value": 1,
    "title": "Email",
    "groups": [
      {
        "value": 1,
        "title": "System notifications",
        "enabled": true
      }
    ]
  }
}

5.4 Mark Notification as Read
POST /api/v1/notifications/{id}/read

**Path parameters:**
- `id` (string): Notification ID

**Response:**
{
  "status": "success"
}

5.5 Telegram Webhook (Internal)
POST /api/v1/notifications/webhooks/telegram/{token}

Handling updates from Telegram. Internal use only.

6. Catalog API

6.1 Get All Categories
GET /api/v1/catalog/categories

Returns nested category tree.

6.2 Get Brands
GET /api/v1/catalog/brands

Returns list of all available brands.

Response:

{
  "data": [
    {
      "id": 1,
      "name": "Brand Name",
      "slug": "brand-name"
    }
  ]
}

6.3 Get Category by Slug
GET /api/v1/catalog/categories/{slug}

Query params:

withProducts (optional)

6.4 Get Product Listing
GET /api/v1/catalog/products

Filters:

category

search

price[min]

price[max]

attributes[]

sort

page

per_page

Response:

{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total": 100,
    "last_page": 10
  },
  "filters": {...}
}

6.5 Get Product Variant by ID or Slug
GET /api/v1/catalog/variants/{idOrSlug}

### Variant resolution

The `{idOrSlug}` parameter supports:
- numeric variant ID
- string slug

Frontend must not assume slug-only resolution.

Response fields:

variant data

images

specification

attributes

price & effective price

variant options

6.6 List All Variants
GET /api/v1/catalog/variants

Query params:

category
search
price[min]
price[max]
attributes[]
sort
page
per_page

Response:

{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total": 100,
    "last_page": 10
  }
}

6.7 Search Suggestions (Autocomplete)
GET /api/v1/catalog/suggest

Returns search suggestions (autocomplete) and a compact preview of matching catalog items for fast UX.

**Query params:**
- `q` (required): Partial search query
- `variants_limit` (optional): Number of variants to preview. Minimum: 1, Maximum: 10, Default: 5
- `suggestions_limit` (optional): Number of suggestion phrases and facet items to return. Minimum: 1, Maximum: 10, Default: 5

**Headers:**
- `X-Guest-Id` (optional): For favorite flags when applicable

**Response:**
{
  "data": {
    "query": "iphone",
    "history": ["iphone 15 pro max", "iphone"],
    "suggestions": [
      {
        "text": "iphone",
        "score": 0.8571,
        "source": "variants"
      }
    ],
    "variants": [
      {
        "id": 1932,
        "product_id": 646,
        "sku": "SKU-3931-ECAL",
        "slug": "iphone-15-pro-max",
        "title": "iPhone 15 Pro Max",
        "is_favorite": false,
        "images": [],
        "price": {
          "currency": "USD",
          "list_minor": "$232.25",
          "sale_minor": "$0.00",
          "effective_minor": "$232.25"
        },
        "is_in_stock": true,
        "rating": {
          "value": 4.5,
          "count": 10
        }
      }
    ],
    "brands": [
      {
        "id": 9,
        "title": "Apple",
        "slug": "apple",
        "count": 1
      }
    ],
    "categories": [
      {
        "id": 36,
        "title": "Smartphones",
        "slug": "smartphones",
        "count": 1
      }
    ]
  }
}

**Notes:**
- History contains only "confirmed" searches (from actual catalog searches)
- Suggestions are ranked by relevance score
- Variants include favorite flags when `X-Guest-Id` header is provided

🟦 END OF PART 1

Готов продолжать.

Скажи “Continue (API Part 2)”.

You said:
Continue
ChatGPT said:

Продолжаю.
Вот следующая часть.

📘 api.md — PART 2

(Full detailed, professional English version)

7. Cart API

The cart system is token-based (guest or user) with versioning support for concurrency control.
Tokens must be provided via:

X-Cart-Token: <string>

**Important: Cart Versioning & Concurrency Control**

The cart API uses optimistic locking with version numbers to prevent concurrent modification conflicts:
- Every cart has a `version` number that increments on each modification
- For mutations (add, update, remove items, coupons), you **must** include:
  - `If-Match` header: Current cart version (obtained from `GET /api/v1/cart/v`)
  - `Idempotency-Key` header: Unique key for safe retries (recommended)
- If version mismatch (409 Conflict), fetch latest cart and retry

> NOTE:
> Coupons and item options belong to Cart domain:
> - **POST** `/api/v1/cart/coupons`
> - **DELETE** `/api/v1/cart/coupons/{code}`
> - **PATCH** `/api/v1/cart/items/{itemId}/options`
> Checkout must NOT manage coupons.

### Checkout invalidation rule

Any cart change (items, quantity, options, coupons) invalidates the active checkout session.

Frontend MUST restart checkout after cart changes.

7.1 Get Cart
GET /api/v1/cart

Returns the current cart by token.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Response:**
{
  "data": {
    "token": "01K8WP4SYH6QRS0T82D3XAHD25",
    "version": 2,
    "context": {
      "currency": "USD",
      "locale": "ru"
    },
    "items": [
      {
        "id": "SKU-7283-UPJB",
        "variant_id": 5,
        "sku": "SKU-7283-UPJB",
        "qty": 2,
        "title": "MacBook Air 13",
        "image": {
          "id": 234,
          "url": "https://example.com/images/thumb_250_250.webp"
        },
        "price": {
          "currency": "USD",
          "list_minor": 65325,
          "sale_minor": 39195,
          "effective_minor": 39195
        },
        "line_total_minor": 78390
      }
    ],
    "promotions": [
      {
        "promotion_id": 5,
        "name": "Debitis quas exercitationem",
        "type": 2,
        "value": 4674,
        "source": 1
      }
    ],
    "warnings": [],
    "totals": {
      "items_minor": 78390,
      "discounts_minor": 4674,
      "grand_total_minor": 73716
    }
  }
}

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Current cart version number

7.2 Get Cart Version
HEAD /api/v1/cart/v

Returns the current version of the cart **without full cart data**.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Response:**
- Status: 204 No Content
- Headers:
  - `X-Cart-Token`: Current cart token
  - `X-Cart-Version`: Current cart version number

**Use case:** Use this to check if cart has been updated since last fetch, or to get version before mutations.

7.3 Add Item to Cart
POST /api/v1/cart/items

Adds a product variant (by SKU or ID) to the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (optional - creates new cart if not provided)
- `If-Match`: Current cart version (required if `X-Cart-Token` provided)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
{
  "variant_id": 42,          // Optional: variant ID
  "sku": "SKU-9660-NCQB",   // Optional: variant SKU (use one or the other)
  "qty": 2                   // Required: quantity
}

**Response:**
Updated cart (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Cart not found (if token provided)
- `409`: Version mismatch (cart was modified concurrently)
- `422`: Validation error

7.4 Update Item Quantity
PATCH /api/v1/cart/items/{itemId}

Updates the quantity of an existing item in the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `itemId` (string): Cart item ID (usually SKU)

**Body:**
{
  "qty": 3  // Required: new quantity
}

**Response:**
Updated cart (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Item or cart not found
- `409`: Version mismatch
- `422`: Validation error

7.5 Remove Item
DELETE /api/v1/cart/items/{itemId}

Removes a specific item from the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `itemId` (string): Cart item ID (usually SKU)

**Response:**
Updated cart (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Item or cart not found
- `409`: Version mismatch
- `422`: Validation error

7.6 Update Item Options
PATCH /api/v1/cart/items/{itemId}/options

Sets options for a cart item (e.g., gift wrap, personalization).

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `itemId` (string): Cart item ID

**Body:**
{
  "add": [                    // Optional: Options to add
    {
      "option_id": 2,
      "qty": 1
    }
  ],
  "remove": [2, 3]           // Optional: Option IDs to remove
}

**Response:**
Updated cart with options applied

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

7.7 Apply Coupon
POST /api/v1/cart/coupons

Applies a discount coupon code to the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
{
  "code": "SAVE10"  // Required: coupon code
}

**Response:**
Updated cart with coupon applied (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Cart not found or coupon invalid
- `409`: Version mismatch
- `422`: Validation error (coupon expired, already applied, etc.)

7.8 Remove Coupon
DELETE /api/v1/cart/coupons/{code}

Removes a previously applied coupon code from the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `code` (string): Coupon code to remove

**Response:**
Updated cart with coupon removed (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Cart not found or coupon not applied
- `409`: Version mismatch
- `422`: Validation error

7.9 Attach Cart After Login
POST /api/v1/cart/attach

Used when a guest becomes authenticated. Merges guest cart with user cart.

**Headers:**
- `X-Cart-Token`: Guest cart token (required)
- `Authorization`: Cookie-based authentication (required)

8. Favorites API

Favorites (wishlist) functionality uses guest token authentication.

**Token Header:**
- `X-Guest-Id`: Required for all favorites operations

**Note:** Favorites are tied to guest sessions and persist across browser sessions via the guest token stored in cookies.

8.1 Get Favorites
GET /api/v1/catalog/favorites

Returns paginated list of favorite product variants.

**Query params:**
- `page` (optional): Page number for pagination
- `per_page` (optional): Items per page

**Response:**

{
  "data": [
    {
      "id": 123,
      "product_id": 45,
      "title": "Product Title",
      "slug": "product-slug",
      "sku": "SKU123",
      "is_favorite": true,
      "price": {
        "value": 10000,
        "currency": "USD",
        "formatted": "$100.00"
      },
      "is_in_stock": true,
      "images": [...],
      "attribute_values": [...],
      "rating": {
        "value": 4.5,
        "count": 10
      }
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 20,
      "total": 5
    }
  }
}

**Response fields:**
- `data` (array): Array of `ProductVariant` objects
- `meta.pagination` (object): Pagination metadata
  - `current_page` (number): Current page number
  - `last_page` (number): Total number of pages
  - `per_page` (number): Items per page
  - `total` (number): Total number of favorites

**Error responses:**
- `401`: Unauthorized (if guest token is invalid)
- `422`: Validation error

8.2 Add Favorite
POST /api/v1/catalog/favorites

Adds a product variant to favorites.

**Body:**

{
  "variant_id": 123
}

**Response (success):**

Updated favorites list (same structure as GET response)

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error (e.g., variant not found, already in favorites)
- `429`: Too many requests

8.3 Remove Favorite
DELETE /api/v1/catalog/favorites/{variantId}

Removes a product variant from favorites.

**Path parameters:**
- `variantId` (number): Product variant ID to remove

**Response (success):**

Updated favorites list (same structure as GET response)

**Error responses:**
- `401`: Unauthorized
- `404`: Favorite not found
- `422`: Validation error

9. Comparison API

Comparison table allows users to compare multiple product variants side-by-side.

**Token Header:**
- `X-Comparison-Token`: Required for all comparison operations

**Note:** Comparison uses a dedicated token separate from cart and guest tokens. The token is stored in cookies and persists across browser sessions.

**Limits:**
- Maximum items per comparison table is configurable (default: 10)
- The `max_items` value is returned in the API response metadata

9.1 Get Comparison Table
GET /api/v1/catalog/comparison

Returns the current comparison table with all items.

**Response:**

{
  "data": {
    "token": "comparison_token_abc123",
    "variants": [
      {
        "id": 123,
        "product_id": 45,
        "title": "Product Title",
        "slug": "product-slug",
        "sku": "SKU123",
        "price": {
          "value": 10000,
          "currency": "USD",
          "formatted": "$100.00"
        },
        "is_in_stock": true,
        "images": [...],
        "attribute_values": [...],
        "specifications": [...],
        "rating": {
          "value": 4.5,
          "count": 10
        }
      }
    ],
    "meta": {
      "count": 2,
      "max_items": 10
    }
  }
}

**Response fields:**
- `data.token` (string): Comparison token (used for subsequent requests)
- `data.variants` (array): Array of `ProductVariant` objects in comparison
- `data.meta` (object): Comparison metadata
  - `count` (number): Current number of items in comparison
  - `max_items` (number): Maximum allowed items in comparison

**Error responses:**
- `401`: Unauthorized (if comparison token is invalid)

9.2 Add Item to Comparison
POST /api/v1/catalog/comparison/items

Adds a product variant to the comparison table.

**Body:**

{
  "variant_id": 123
}

**Response (success):**

Updated comparison table (same structure as GET response)

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error
  - Comparison is full (reached `max_items` limit)
  - Variant already in comparison
  - Variant not found
- `429`: Too many requests

9.3 Remove Item from Comparison
DELETE /api/v1/catalog/comparison/items/{variantId}

Removes a product variant from the comparison table.

**Path parameters:**
- `variantId` (number): Product variant ID to remove

**Response (success):**

Updated comparison table (same structure as GET response)

**Error responses:**
- `401`: Unauthorized
- `404`: Item not found in comparison
- `422`: Validation error

9.4 Clear Comparison Table
DELETE /api/v1/catalog/comparison

Removes all items from the comparison table.

**Response (success):**

204 No Content

Or empty comparison table:

{
  "data": {
    "token": "comparison_token_abc123",
    "variants": [],
    "meta": {
      "count": 0,
      "max_items": 10
    }
  }
}

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error

10. Checkout API

The full checkout flow consists of:

/checkout/start
/checkout/{id}/address
/shipping/methods
/checkout/{id}/shipping-method
/checkout/{id}/payment-provider
/checkout/{id}/confirm

### Important note

Checkout API is responsible ONLY for:
- order preparation
- address
- shipping
- payment provider selection
- order confirmation

Checkout does NOT initialize payments.

Payment initialization happens exclusively via:
**POST** `/api/v1/payments/{provider}/init`

10.1 Start Checkout Session
POST /api/v1/checkout/start

Returns:

checkout id

items

pricing

addresses

10.2 Update Address
PUT /api/v1/checkout/{id}/address

Body:

{
  "shipping_address": {...},
  "billing_address": {...},
  "billing_same_as_shipping": true
}

10.3 Get Shipping Methods
GET /api/v1/shipping/methods

Query:

country

region

city

postal

10.4 Set Shipping Method
PUT /api/v1/checkout/{id}/shipping-method

Body:

{ "method_id": 4 }

10.5 Set Payment Provider
PUT /api/v1/checkout/{id}/payment-provider

Body:

{ "provider_code": "stripe" }

10.6 Confirm Checkout (Create Order)
POST /api/v1/checkout/{id}/confirm

Response:

{ "order_id": 9831 }

11. Shipping API

11.1 Get Shipping Providers (Optional)
GET /api/v1/shipping/providers

11.2 Get Shipping Methods
GET /api/v1/shipping/methods

Used mainly by checkout.

12. Payments API

Handles listing payment providers and initiating payments.

12.1 Get Payment Providers
GET /api/v1/payments/providers

Response example:

[
  { "code": "stripe", "name": "Stripe", "fee": 0 },
  { "code": "cod", "name": "Cash on Delivery", "type": "offline" }
]

12.2 Initialize Payment
POST /api/v1/payments/{provider}/init

Body:

{ "order_id": 123 }

Response:

{
  "payment_url": "https://provider.com/pay?session=...",
  "status": "pending"
}

🟦 END OF PART 2

Готов продолжать.
Скажи:

“Continue (API Part 3)”
You said:
Continue
ChatGPT said:

Продолжаю.
Вот финальная часть api.md — PART 3 (full detailed).

📘 api.md — PART 3 (FINAL)

(Professional, complete English version)

13. Orders API

13.1 Get User Orders
GET /api/v1/orders

Query params:

page

per_page

Response:

{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total": 3,
    "last_page": 1
  }
}

13.2 Get Order Details
GET /api/v1/orders/{id}

Response includes:

items

totals

shipping

payment status

customer info

14. Blog API

The blog module is fully public and SEO-oriented.

14.1 Get Blog Categories
GET /api/v1/blog/categories

14.2 Get Category by Slug
GET /api/v1/blog/categories/{slug}

14.3 Get Blog Posts
GET /api/v1/blog/posts

Retrieves a paginated list of published blog posts with optional filtering and sorting.

Query params:

- `category_id` (optional): Filter posts by category ID
- `search` (optional): Search query
- `sort` (optional): Sort order. One of: `newest`, `oldest`. Default: `newest`
- `page` (optional): Page number. Default: 1
- `per_page` (optional): Number of items per page (max 60). Default: 15

**Sorting options:**
- `newest` — newest posts first (by publish date)
- `oldest` — oldest posts first (by publish date)

Response:

{
  "data": [
    {
      "id": 47,
      "slug": "quis-aspernatur-accusantium-dolorem-ducimus-velit-8085",
      "title": "Quis aspernatur accusantium dolorem ducimus velit.",
      "excerpt": "Quidem autem maiores aperiam aut. Labore a officia iusto ullam eum animi quaerat nulla. Ea ea dolor impedit in eaque perferendis aut sit. Blanditiis corrupti ut id doloremque dolores tenetur.",
      "featured_image": {
        "id": 27,
        "url": "https://api.nexora-room15.store/storage/27/conversions/pexels-photo-90946-webp.webp"
      },
      "published_at": "2025-10-27T08:38:53+00:00",
      "author": {
        "id": 1,
        "name": "Super Admin"
      },
      "category": {
        "id": 3,
        "slug": "autem-6014",
        "title": "asperiores",
        "description": "Amet voluptates qui eaque quod. Qui ipsa fugit praesentium ut quia et. Omnis doloribus totam beatae eum tempora eum eveniet quod."
      }
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 2,
      "per_page": 15,
      "total": 16
    }
  }
}

Response fields:

data (array): Array of blog post objects

Each post object contains:

id (number): Unique post identifier

slug (string): URL-friendly post identifier

title (string): Post title

excerpt (string): Post excerpt/summary (can be empty string)

featured_image (object | null): Featured image object with id and url, or null if no image

featured_image.id (number): Image identifier

featured_image.url (string): Full URL to the image

published_at (string): ISO 8601 datetime string of publication date

author (object): Post author information

author.id (number): Author identifier

author.name (string): Author display name

category (object | null): Post category information, or null if uncategorized

category.id (number): Category identifier

category.slug (string): URL-friendly category identifier

category.title (string): Category display title

category.description (string): Category description

meta (object): Pagination metadata

meta.pagination (object): Pagination information

meta.pagination.current_page (number): Current page number

meta.pagination.last_page (number): Total number of pages

meta.pagination.per_page (number): Number of items per page

meta.pagination.total (number): Total number of posts

14.4 Get Blog Post by Slug
GET /api/v1/blog/posts/{slug}

Response:

{
  "data": {
    "id": 9,
    "slug": "quisquam-eos-voluptatibus-delectus-hic-asperiores-1048",
    "title": "Quisquam eos voluptatibus delectus hic asperiores.",
    "excerpt": "Tempora voluptates enim veniam sed nihil debitis explicabo. Sit quibusdam possimus rerum eos et. Quas libero culpa beatae cum nesciunt vel.",
    "content": "Quis doloremque porro libero qui. Saepe in consectetur consectetur nihil repudiandae. Blanditiis quae amet sint iure non.",
    "featured_image": {
      "id": 6,
      "url": "https://api.nexora-room15.store/storage/6/conversions/pexels-eprism-studio-108171-335257-webp.webp"
    },
    "published_at": "2025-01-30T12:05:12+00:00",
    "author": {
      "id": 1,
      "name": "Super Admin"
    },
    "category": {
      "id": 5,
      "slug": "odit-1177",
      "title": "nemo",
      "description": "Rerum vero vel deserunt hic beatae dolorem. Placeat unde necessitatibus officiis rerum ducimus ut. Fugiat ipsa quasi ex vel. Eum ipsa dolor assumenda qui. In qui molestiae sapiente sapiente ad aut."
    },
    "seo": {
      "id": 24,
      "path": "/blog/posts/quisquam-eos-voluptatibus-delectus-hic-asperiores-1048",
      "seoable_id": 9,
      "seoable_type": "Modules\\Blog\\Models\\Post",
      "title": null,
      "description": null,
      "keywords": null,
      "canonical": null,
      "robots": "",
      "text": null,
      "og_image": ""
    }
  }
}

Response fields:

data (object): Blog post object

id (number): Unique post identifier

slug (string): URL-friendly post identifier

title (string): Post title

excerpt (string): Post excerpt/summary

content (string): Full post content (HTML)

featured_image (object | null): Featured image object with id and url, or null if no image

featured_image.id (number): Image identifier

featured_image.url (string): Full URL to the image

published_at (string): ISO 8601 datetime string of publication date

author (object): Post author information

author.id (number): Author identifier

author.name (string): Author display name

author.avatar (string, optional): Author avatar URL

category (object | null): Post category information, or null if uncategorized

category.id (number): Category identifier

category.slug (string): URL-friendly category identifier

category.title (string): Category display title

category.description (string): Category description

seo (object): SEO metadata for the post

seo.id (number): SEO record identifier

seo.path (string): URL path for this post

seo.seoable_id (number): Related entity ID

seo.seoable_type (string): Related entity type

seo.title (string | null): SEO title (can be null)

seo.description (string | null): SEO description (can be null)

seo.keywords (string | null): SEO keywords (can be null)

seo.canonical (string | null): Canonical URL (can be null)

seo.robots (string | null | ""): Robots meta tag (can be null or empty string)

seo.text (string | null): SEO text content (can be null)

seo.og_image (string | null | ""): Open Graph image URL (can be null or empty string)

15. Leads API

Used for contact forms.

15.1 Contact Form Submission
POST /api/v1/leads

Body:

{
  "name": "John Doe",
  "email": "john@mail.com",
  "message": "Please contact me"
}

16. Audience API (NEW)

16.1 Subscribe to Audience
POST /api/v1/audience/subscribe

Creates a new subscriber with Pending status or resends a confirmation for an existing Pending/Unsubscribed email. If already Active, nothing is sent.

**Notes:**
- Protected by basic rate limiting
- Includes a honeypot field `website` which must be empty (bots fill it and will be rejected)

**Body:**

{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "consent": true,
  "source": "footer_form",
  "website": ""
}

**Fields:**
- `email` (required): Subscriber email address
- `name` (optional): Subscriber name
- `consent` (required): Boolean indicating consent to receive emails
- `source` (optional): Source identifier (e.g., "footer_form", "home_form")
- `website` (required, honeypot): Must be empty string. Bots that fill this will be rejected.

**Response Examples:**

New subscriber created (200):
{
  "message": "Мы отправили письмо с подтверждением на ваш email"
}

Already active (200):
{
  "message": "Вы уже подписаны"
}

Resent confirmation (200):
{
  "message": "Мы уже отправили вам письмо с подтверждением. Отправили ещё раз"
}

16.2 Confirm Subscription (Signed URL)
GET /api/v1/audience/confirm?email={email}

Confirms a subscriber by email using a temporary signed URL sent in the confirmation email. On success, redirects to the frontend success page.

**Query parameters:**
- `email` (required): Email to confirm

**Response:**
- Status: 302 Redirect to success page or error page

**Error responses:**
- `403`: Invalid signature

16.3 Unsubscribe (Signed URL)
GET /api/v1/audience/unsubscribe?email={email}

Unsubscribes a subscriber by email using a temporary signed URL from the unsubscribe email link.

**Query parameters:**
- `email` (required): Email to unsubscribe

**Response:**
- Status: 302 Redirect to frontend unsubscribe page (success) or error page

**Error responses:**
- `403`: Invalid signature

16.4 Unsubscribe from Account
POST /api/v1/audience/unsubscribe

Unsubscribes the currently authenticated user by their account email.

**Authentication:** Required (cookie-based)

**Response:**
- Status: 204 No Content

**Error responses:**
- `401`: Unauthenticated
- `404`: Subscriber not found

16.5 Audience Webhook
POST /api/v1/audience/webhooks/{provider}

Handles webhook events from external mailing providers to synchronize local subscriber statuses.

**Path parameters:**
- `provider` (string): Provider code

**Body:**
{
  "event_id": "evt_123",          // Optional: Unique event identifier
  "email": "john.doe@example.com", // Required: Subscriber email
  "status": "active"              // Required: One of: "active", "unsubscribed"
}

**Response:**
- Status: 204 No Content (accepted and applied)

**Error responses:**
- `400`: Invalid webhook

**Notes:**
- Authentication is handled by provider-specific signature check
- For "null" driver, all requests are accepted with simple field mapping

3.5 Banners API (NEW)

3.5.1 Get Homepage Banners
GET /api/v1/banners/homepage

Retrieves all visible Hero type banners for the homepage.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
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

**Response fields:**
- `data` (array): Array of banner objects
- `data[].id` (number): Banner identifier
- `data[].type` (number): Banner type (1 = Hero)
- `data[].title` (string): Banner title
- `data[].url` (string): Banner link URL
- `data[].desktop_image` (string): Desktop image URL
- `data[].mobile_image` (string): Mobile image URL
- `data[].position` (number): Display order

17. Customer Support API

Used for customer support request submissions.

17.1 Submit Support Request
POST /api/v1/customer-support/requests

Submit a new customer support request.

**Rate Limiting:**
- Limited to 3 attempts per 60 minutes per email/IP combination
- Returns 429 with `retry_after` field indicating seconds until retry is allowed

**Body:**

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+380501234567",
  "subject": "Question about delivery",
  "message": "Hello, I would like to know what delivery options are available.",
  "type": "general"
}

**Fields:**
- `name` (required): Customer's full name
- `email` (required): Customer's email address (must be valid email format)
- `phone` (optional): Customer's phone number
- `subject` (required): Subject/title of the support request
- `message` (required): Support request message (minimum 10 characters)
- `type` (optional): Request type - one of: "general", "technical", "billing", "other" (defaults to "general")

**Response Examples:**

Success (201):
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+380501234567",
    "subject": "Question about delivery",
    "message": "Hello, I would like to know what delivery options are available.",
    "type": "general",
    "status": "new",
    "metadata": {
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "source": "contact_page",
      "referer": "https://example.com"
    },
    "created_at": "2025-12-25T10:30:00.000000Z"
  }
}

Validation Error (422):
{
  "message": "The email field must be a valid email address. (and 1 more error)",
  "errors": {
    "email": [
      "The email field must be a valid email address."
    ],
    "message": [
      "The message field must be at least 10 characters."
    ]
  }
}

Rate Limit Exceeded (429):
{
  "message": "Too many support request attempts. Please try again in 3540 seconds.",
  "error": "too_many_attempts",
  "retry_after": 3540
}

**Notes:**
- Metadata (ip_address, user_agent, source, referer) is automatically captured by the backend
- No authentication required (public endpoint)
- CSRF protection applies (XSRF token required)

17.2 Get Support Request Types
GET /api/v1/customer-support/requests/types

Returns a list of all available support request types.

**Response:**
[
  {
    "id": 1,
    "title": "General"
  },
  {
    "id": 2,
    "title": "Technical"
  }
]

18. Comments API (NEW)

Comments system allows users to comment on various entities (blog posts, products, etc.).

18.1 Get Comment Types
GET /api/v1/comments/types

Returns a list of all registered commentable types in the system.

**Response:**
{
  "data": [
    {
      "value": "blog:post",
      "title": "Blog Post"
    }
  ]
}

18.2 List Comments
GET /api/v1/comments

Retrieves a simple-paginated list of approved comments for the specified entity.

**Query parameters:**
- `type` (required): Type of the commentable entity (e.g., "blog:post")
- `commentable_id` (required): ID of the entity to fetch comments for
- `per_page` (optional): Number of items per page (max 60). Default: 15
- `page` (optional): Page number. Default: 1

**Response:**
{
  "data": [
    {
      "id": 1,
      "text": "Great article! Very informative.",
      "status": 1,
      "author": {
        "id": 42,
        "name": "John Doe"
      },
      "commentable": {
        "type": "blog:post",
        "id": 123,
        "title": "Blog Post"
      },
      "parent_id": null,
      "created_at": "2025-12-10T14:30:00.000000Z",
      "updated_at": "2025-12-10T14:30:00.000000Z",
      "replies": [
        {
          "id": 2,
          "text": "Thank you for your feedback!",
          "status": 1,
          "author": {
            "id": 1,
            "name": "Jane Smith"
          },
          "parent_id": 1,
          "created_at": "2025-12-10T15:45:00.000000Z",
          "replies": []
        }
      ]
    }
  ],
  "meta": {
    "has_more_pages": true
  }
}

**Response fields:**
- `data` (array): Array of comment objects with nested replies
- `data[].id` (number): Comment identifier
- `data[].text` (string): Comment text
- `data[].status` (number): Comment status (1 = approved)
- `data[].author` (object): Author information
- `data[].commentable` (object): Entity being commented on
- `data[].parent_id` (number | null): Parent comment ID for replies
- `data[].replies` (array): Array of reply comments
- `meta.has_more_pages` (boolean): Whether more pages are available

18.3 Create Comment
POST /api/v1/comments

Creates a new comment on the specified entity.

**Authentication:** Required (cookie-based)

**Body:**
{
  "type": "blog:post",      // Required: Commentable type
  "commentable_id": 123,    // Required: Entity ID
  "text": "Great article!", // Required: Comment text
  "parent_id": null         // Optional: Parent comment ID for replies
}

**Response:**
Created comment object (same structure as list response)

**Error responses:**
- `401`: Unauthenticated
- `422`: Validation error

19. Reviews API (NEW)

Reviews system allows authenticated users to leave reviews for products.

19.1 List Reviews
GET /api/v1/reviews

Retrieves a simple-paginated list of approved and active reviews for the specified product.

**Query parameters:**
- `id` (required): Product ID to fetch reviews for
- `page` (optional): Page number

**Response:**
{
  "data": [
    {
      "id": 3,
      "rating": 5,
      "body": "Excellent product! Very satisfied.",
      "pros": "Fast delivery, great quality",
      "cons": null,
      "author": {
        "id": 4,
        "name": "John Doe"
      },
      "created_at": "2025-11-19T10:35:16.000000Z",
      "replies": [
        {
          "id": 4,
          "body": "Thank you for your review!",
          "is_active": true,
          "author": {
            "id": 8,
            "name": "Jane Smith"
          },
          "created_at": "2025-11-19T10:35:16.000000Z"
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "has_more_pages": false
  }
}

**Response fields:**
- `data` (array): Array of review objects
- `data[].id` (number): Review identifier
- `data[].rating` (number): Rating from 1 to 5
- `data[].body` (string): Review text
- `data[].pros` (string | null): Advantages
- `data[].cons` (string | null): Disadvantages
- `data[].author` (object): Author information
- `data[].replies` (array): Array of reply objects

**Notes:**
- Only reviews with status = Approved and is_active = true are returned
- Each review contains only active replies
- Uses simple pagination (current_page and has_more_pages)

19.2 Create Review
POST /api/v1/reviews

Creates a review for the specified product. A user can leave only one review per product.

**Authentication:** Required (cookie-based)

**Body:**
{
  "id": 123,                // Required: Product ID
  "rating": 5,             // Required: Rating from 1 to 5
  "body": "Отличный товар!", // Required: Review text
  "pros": "Быстрая доставка", // Optional: Advantages
  "cons": "Нет инструкции"   // Optional: Disadvantages
}

**Response:**
{
  "data": {
    "id": 22,
    "rating": 5,
    "body": "Отличный товар!",
    "pros": "Быстрая доставка",
    "cons": "Нет инструкции",
    "author": {
      "id": 2388,
      "name": "John Doe"
    },
    "created_at": "2025-11-19T10:51:44.000000Z"
  }
}

**Error responses:**
- `401`: Unauthenticated
- `422`: Validation error (already reviewed, invalid rating, etc.)

**Notes:**
- If moderation is enabled, review is created with Pending status

19.3 Create Reply to Review
POST /api/v1/reviews/{review_id}/replies

Creates a reply for the specified review. Only authenticated users can post replies.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `review_id` (integer): Review ID

**Body:**
{
  "body": "Спасибо за отзыв!"  // Required: Reply text
}

**Response:**
{
  "data": {
    "id": 23,
    "body": "Спасибо за отзыв!",
    "is_active": true,
    "author": {
      "id": 2037,
      "name": "John Doe"
    },
    "created_at": "2025-11-19T11:09:24.000000Z"
  }
}

**Error responses:**
- `401`: Unauthenticated
- `404`: Review not found

**Notes:**
- Replies are active by default

20. Loyalty API (NEW)

APIs for managing user loyalty points and transaction history.

20.1 Get Loyalty Account Details
GET /api/v1/loyalty

Returns the current balance (active and pending) for the authenticated user.

**Authentication:** Required (cookie-based)

**Response:**
{
  "data": {
    "user_id": 363,
    "balance": "$4,229.00",
    "pending": "$0.00"
  }
}

**Response fields:**
- `data.user_id` (number): User identifier
- `data.balance` (string): Active loyalty balance (formatted)
- `data.pending` (string): Pending loyalty balance (formatted)

20.2 Get Transaction History
GET /api/v1/loyalty/history

Returns a paginated list of loyalty transactions for the authenticated user.

**Authentication:** Required (cookie-based)

**Query parameters:**
- `page` (optional): Page number. Default: 1
- `per_page` (optional): Items per page. Default: 15

**Response:**
{
  "data": [
    {
      "id": 10,
      "type": "Spending",
      "amount": "-$10.00",
      "description": "Payment for order #R15-20260105-0006",
      "expires_at": null,
      "created_at": "2026-01-05T18:54:29+00:00"
    },
    {
      "id": 9,
      "type": "Accrual",
      "amount": "$100.00",
      "description": "Initial bonus points",
      "expires_at": "2026-07-04T18:12:27+00:00",
      "created_at": "2026-01-05T18:12:27+00:00"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 6
    }
  }
}

**Response fields:**
- `data` (array): Array of transaction objects
- `data[].id` (number): Transaction identifier
- `data[].type` (string): Transaction type ("Accrual" or "Spending")
- `data[].amount` (string): Transaction amount (formatted with sign)
- `data[].description` (string): Transaction description
- `data[].expires_at` (string | null): Expiration date (for accruals)
- `data[].created_at` (string): Transaction creation date

21. OAuth Authentication (NEW)

OAuth authentication endpoints for social login/registration and account linking.

21.1 Get OAuth Redirect URL
GET /oauth/{provider}/redirect

Initiates OAuth flow by redirecting to the provider's authorization page. Works for both login/register and account linking scenarios.

**Path parameters:**
- `provider` (string): OAuth provider (e.g., "google", "facebook")

**Behavior:**
- If user is NOT authenticated: will login/register after callback
- If user IS authenticated: will link social account after callback

**Response:**
- Status: 301 Redirect to provider's OAuth authorization page

**Error responses:**
- `422`: Invalid provider, provider not enabled, or provider not configured

21.2 Handle OAuth Callback
GET /oauth/{provider}/callback

Processes the OAuth callback from the provider. Automatically detects whether to login/register or link account.

**Path parameters:**
- `provider` (string): OAuth provider

**Login/Register scenario (user not authenticated):**
- Finds user by social account or email
- Creates new user if not found
- Logs user in and generates session
- Redirects to frontend callback URL

**Link account scenario (user authenticated):**
- Validates social account is not linked to another user
- Links social account to current user
- Keeps current session
- Redirects to frontend callback URL

**Response:**
- Status: 302 Redirect to frontend callback URL (success or error)

**Error responses:**
- `302`: Redirects with error in query params if account already linked
- `422`: Validation error (if no frontend callback URL configured)
- `429`: Too many login attempts

22. Identity API Extensions

Additional Identity API endpoints for password and email management.

22.1 Request Password Change
POST /change-password/request

Request a password change by validating the current password and sending a confirmation email.

**Authentication:** Required (cookie-based)

**Body:**
{
  "current_password": "password123",        // Required: Current password
  "new_password": "newpassword123",        // Required: New password (min 8 chars)
  "new_password_confirmation": "newpassword123" // Required: Password confirmation
}

**Response:**
{
  "status": "We have emailed your password reset link."
}

**Error responses:**
- `422`: Current password is incorrect

22.2 Confirm Password Change
POST /change-password/confirm/{token}

Confirm the password change using the token from the confirmation email.

**Path parameters:**
- `token` (string): Password change confirmation token from email

**Body:**
{
  "email": "john@example.com"  // Required: User's email address
}

**Response:**
{
  "message": "Your password has been reset."
}

**Error responses:**
- `422`: Invalid or expired token

22.3 Request Email Address Change
POST /change-email/request

Send an email change notification to the user.

**Authentication:** Required (cookie-based)

**Body:**
{
  "new_email": "newemail@example.com"  // Optional: New email address
}

**Response:**
{
  "status": "We have emailed your email change link."
}

**Error responses:**
- `422`: Validation error

22.4 Confirm Email Address Change
POST /change-email/confirm/{token}

Confirm the email address change using the token from the confirmation email.

**Path parameters:**
- `token` (string): Email change confirmation token from email

**Body:**
{
  "email": "oldemail@example.com"  // Required: Current email address
}

**Response:**
{
  "message": "Your email has been updated."
}

**Error responses:**
- `422`: Invalid or expired token

23. SEO API

Core endpoint for SEO metadata.

23.1 Get SEO Metadata for a Page
GET /api/v1/site?url={path}

Retrieves SEO metadata for a given URL including title, description, and other meta information.

**Query parameters:**
- `url` (required): The URL to get SEO metadata for

**Response:**
{
  "data": {
    "id": 1,
    "path": "/",
    "seoable_id": null,
    "seoable_type": null,
    "title_h1": "Culpa vero vero",
    "title": "Пианист",
    "description": "Id ea est consectetur deleniti corporis distinctio culpa.",
    "keywords": "",
    "canonical": "rerum",
    "robots": "index,follow",
    "text": "",
    "og_image": ""
  }
}

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

23.2 Get Localized Menu Tree
GET /api/v1/site/menus/tree

Returns the full navigational menu tree for the current locale.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
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

**Response fields:**
- Array of menu item objects with nested children
- Each item may contain: id, title, link, target, css_class, icon, banner_desktop, banner_mobile, children

23.3 Get Site Contacts
GET /api/v1/site/contacts

Returns site contacts, messengers, and socials from Spatie settings. Translatable fields are automatically localized to the current request locale.

**Headers:**
- `Accept-Language`: Locale (optional)

**Response:**
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

**Response fields:**
- `data.contacts` (object): Contact information (address, phones, email, schedule, map)
- `data.messengers` (array): Messenger links (Telegram, Viber, WhatsApp, etc.)
- `data.socials` (array): Social media links (Facebook, Instagram, YouTube, etc.)

23.4 Get Static Page by Slug
GET /api/v1/site/pages/{slug}

Returns a single static page by its slug with SEO data. The response is cached and automatically invalidated on page changes.

**Path parameters:**
- `slug` (string): Page slug (e.g., "terms", "privacy", "faq")

**Response:**

{
  "data": {
    "id": 1,
    "slug": "terms",
    "title": "Terms",
    "content": "<p>Page content HTML...</p>",
    "excerpt": "Page excerpt text",
    "url": "/en/pages/terms",
    "seo": {
      "id": 3518,
      "path": "terms",
      "seoable_id": 1,
      "seoable_type": "Modules\\Site\\Models\\Page",
      "title_h1": "",
      "title": "",
      "description": "",
      "keywords": "",
      "canonical": null,
      "robots": "",
      "text": "<p></p>",
      "og_image": ""
    }
  }
}

**Response fields:**
- `data.id` (number): Page identifier
- `data.slug` (string): URL-friendly page identifier
- `data.title` (string): Page title
- `data.content` (string): Full page content (HTML)
- `data.excerpt` (string): Page excerpt/summary
- `data.url` (string): Full URL path for the page
- `data.seo` (object): SEO metadata for the page
  - `seo.id` (number): SEO record identifier
  - `seo.path` (string): URL path for this page
  - `seo.seoable_id` (number): Related entity ID
  - `seo.seoable_type` (string): Related entity type
  - `seo.title_h1` (string): H1 title (can be empty string)
  - `seo.title` (string): SEO title (can be empty string)
  - `seo.description` (string): SEO description (can be empty string)
  - `seo.keywords` (string): SEO keywords (can be empty string)
  - `seo.canonical` (string | null): Canonical URL (can be null)
  - `seo.robots` (string): Robots meta tag (can be empty string)
  - `seo.text` (string): SEO text content (HTML, can be empty)
  - `seo.og_image` (string): Open Graph image URL (can be empty string)

**Error responses:**
- `404`: Page not found

**Notes:**
- Public endpoint (no authentication required)
- Response is cached on the backend and invalidated when page content changes
- Used for static pages like Terms of Service, Privacy Policy, FAQ, Returns, Shipping, etc.

24. Leads API Updates

24.1 Create Lead
POST /api/v1/leads

Submit a new lead with product items. Rate limited to 3 attempts per 60 minutes per email/IP combination.

**Body:**
{
  "items": [                    // Required: Array of product variants
    {
      "variant_id": 1,          // Required: Product variant ID
      "qty": 2                  // Optional: Quantity (defaults to 1)
    }
  ],
  "customer_name": "John Doe",      // Required: Customer full name (2-100 chars)
  "customer_phone": "+380501234567", // Required: Customer phone (5-30 chars)
  "customer_email": "john@example.com", // Optional: Customer email (max 100 chars)
  "comment": "Please call after 6 PM",  // Optional: Customer comment (max 1000 chars)
  "user_id": 2,                 // Optional: Associated user ID if authenticated
  "currency": "UAH",            // Required: Currency code
  "locale": "uk",               // Required: Locale code
  "ip_address": "192.168.1.1",  // Required: Customer IP address (IPv4)
  "user_agent": "Mozilla/5.0...", // Required: User agent (max 500 chars)
  "source": "landing_page"      // Optional: Lead source identifier (max 50 chars)
}

**Response:**
{
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+380501234567",
    "source": "landing_page",
    "metadata": {
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "referer": "https://example.com/promo"
    },
    "created_at": "2025-12-25T10:30:00.000000Z"
  }
}

**Error responses:**
- `422`: Validation error
- `429`: Rate limit exceeded (with `retry_after` field)

**Notes:**
- Metadata is automatically captured by the backend
- Rate limiting applies per email/IP combination

25. Shipping API Updates

25.1 Search Settlements
GET /api/v1/shipping/{provider_code}/settlements/search

Search for cities and settlements in shipping provider database.

**Path parameters:**
- `provider_code` (string): Shipping provider code (e.g., "novapost")

**Query parameters:**
- `city_name` (required): City name or postal index to search
- `limit` (optional): Number of records per page (1-100). Default: 20
- `page` (optional): Page number (starts from 1). Default: 1

**Response:**
Array of settlement objects with city information

**Use case:** Used in checkout to help users find their city for shipping calculations.

25.2 Search Warehouses
GET /api/v1/shipping/{provider_code}/warehouses/search

Search for warehouses and postomats by city, method, and checkout session items with automatic filtering by cargo dimensions and weight.

**Path parameters:**
- `provider_code` (string): Shipping provider code

**Query parameters:**
- `method_code` (required): Shipping method code (e.g., "np_warehouse")
- `city_external_id` (required): City external ID from settlements search
- `checkout_session_id` (required): Checkout session ID (numeric string)
- `search` (optional): Search query for warehouse name or number
- `limit` (optional): Number of records per page (1-500). Default: 50
- `page` (optional): Page number. Default: 1

**Response:**
Array of warehouse/postomat objects

**Use case:** Used in checkout after user selects city to show available pickup points.

25.3 Shipping Webhook
POST /api/v1/shipping/webhook/{provider_code}

Receives webhook notifications from shipping providers about tracking updates.

**Path parameters:**
- `provider_code` (string): Shipping provider code

**Response:**
- Status: 204 No Content

26. Payments API Updates

26.1 Initialize Payment
POST /api/v1/payments/init

Initiates a payment for an order with the specified or default payment provider.

**Headers:**
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
{
  "order_id": 123,           // Required: Order ID
  "provider_code": "liqpay"  // Optional: Payment provider code (uses default if not specified)
}

**Response:**
{
  "data": {
    "payment_intent_id": 1,
    "status": 1,
    "payment_url": "https://www.liqpay.ua/api/3/checkout?data=..."
  }
}

**Response fields:**
- `data.payment_intent_id` (number): Payment intent identifier
- `data.status` (number): Payment status (1 = pending)
- `data.payment_url` (string): Redirect URL to payment provider

**Error responses:**
- `404`: Order not found
- `500`: Internal server error

**Note:** Use this endpoint instead of the deprecated `/api/v1/payments/{provider}/init` path.

26.2 Payment Webhook
POST /api/v1/payments/webhook/{provider_code}

Receives webhook notifications from payment providers about payment status updates.

**Path parameters:**
- `provider_code` (string): Payment provider code

**Response:**
- Status: 204 No Content

27. Checkout API Updates

27.1 Start Checkout Session
POST /api/v1/checkout/start

Initiates a new checkout session from a shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Body:**
{
  "billing_same_as_shipping": true  // Optional: Whether billing address is same as shipping
}

**Response:**
{
  "data": {
    "id": 1315,
    "expires_at": "2025-10-31T11:11:31+00:00",
    "currency": "USD",
    "locale": "ru",
    "pricing": {
      "currency": "USD",
      "items_minor": 78390,
      "discounts_minor": 4674,
      "shipping_minor": 0,
      "grand_total_minor": 73716,
      "promotions": [...]
    },
    "items": [...],
    "shipping": null,
    "shipping_address": {...},
    "billing_address": {...},
    "billing_same_as_shipping": true
  }
}

27.2 Update Shipping Method
PUT /api/v1/checkout/{id}/shipping-method

Sets the shipping method for the checkout session.

**Path parameters:**
- `id` (integer): Checkout session ID

**Body:**
{
  "method_code": "standard_shipping",              // Required: Shipping method code
  "quote_id": "q_01k8awpra03ck0bq331y0j3fd5",     // Required: Shipping quote ID
  "provider_metadata": {
    "warehouse_external_id": "1ec09d88-e1c2-11ec-8f4a-48df37b921db"  // Optional: Warehouse ID
  }
}

**Response:**
Updated checkout session with shipping applied

27.3 Get Shipping Methods
GET /api/v1/shipping/methods

Retrieves available shipping methods and rates for a given destination and checkout session.

**Query parameters:**
- `checkout_session_id` (required): Checkout session ID (numeric string)
- `dest.country` (required): Destination country code
- `dest.city` (required): Destination city
- `dest.region` (optional): Destination region/state
- `dest.postal` (optional): Destination postal code

**Response:**
{
  "data": {
    "currency": "EUR",
    "methods": [
      {
        "code": "np_warehouse",
        "name": "Nova Post Warehouse",
        "source": "internal",
        "price": "$80.00",
        "eta": null,
        "quote_id": "q_01k8awpra03ck0bq331y0j3fd5"
      }
    ],
    "cache_ttl_seconds": 900
  }
}

**Notes:**
- Quotes are cached for 15 minutes (900 seconds)
- Use `quote_id` when setting shipping method in checkout

28. Orders API Updates

28.1 Get Order Statuses
GET /api/v1/orders/statuses

Returns a list of all available order statuses with their IDs and titles.

**Response:**
[
  {
    "id": 1,
    "title": "Pending"
  },
  {
    "id": 2,
    "title": "Paid"
  },
  {
    "id": 3,
    "title": "Shipped"
  }
]

28.2 Get User Orders
GET /api/v1/orders

Retrieves a paginated list of orders for the authenticated user with optional status filtering.

**Authentication:** Required (cookie-based)

**Query parameters:**
- `statuses` (optional): Filter by order status IDs (array of integers)
- `per_page` (optional): Number of items per page (1-100). Default: 15
- `page` (optional): Page number

**Response:**
{
  "data": [
    {
      "id": 1001,
      "number": "ORD-2024-001001",
      "status": "shipped",
      "currency": "USD",
      "grand_total_minor": "$125.99",
      "created_at": "2024-01-15T10:30:00+00:00"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 3,
      "per_page": 15,
      "total": 42
    }
  }
}

28.3 Get Order Details
GET /api/v1/orders/{id}

Retrieves detailed information about a specific order for the authenticated user.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `id` (integer): Order ID

**Response includes:**
- Order basic info (id, number, status, currency, totals)
- Items (variant_id, sku, qty, prices, options, loyalty discounts)
- Totals breakdown (items, discounts, loyalty points, shipping, grand total)
- Promotions applied
- Shipping information (method, provider, amount, shipments with tracking)
- Shipping and billing addresses
- Payment intent status

**Error responses:**
- `401`: Unauthenticated
- `404`: Order not found

29. System Health API

29.1 Health Check
GET /api/v1/health

Response:

{
  "status": "ok",
  "timestamp": "...",
  "version": "..."
}

20. Common API Rules

19.1 Required Headers

All frontend requests MUST include:

```
Accept-Language: <locale>
Accept-Currency: <currency>
```

Additionally, guest-related headers are required when applicable:

```
X-Cart-Token
X-Guest-Id
X-Comparison-Token
```

These headers are automatically attached by the frontend API client.

19.2 CSRF / XSRF Rules (MANDATORY)

This project uses Laravel Sanctum with cookie-based SPA authorization.

Rules:
- Any state-changing request (POST, PUT, DELETE) sent from the browser
  MUST include a valid XSRF token.
- This applies to BOTH authenticated users and guests.

XSRF is REQUIRED for:
- Auth & Identity endpoints
- Address management
- Notifications
- Audience (email subscription)
- Cart mutations (items, options, coupons)
- Checkout steps
- Payment initialization
- Favorites & Comparison mutations

XSRF is NOT required for:
- Public GET endpoints (catalog, blog, system, SEO)

Frontend MUST:
1. Call `GET /sanctum/csrf-cookie` once on app init
2. Ensure all mutation requests include XSRF token automatically

19.3 Authentication

**All authentication is cookie-based (Laravel Sanctum SPA authorization).**

- Identity API endpoints use cookie-based authentication (Sanctum)
- All user-only endpoints use cookie-based authentication (Sanctum)
- Do NOT use Bearer tokens for any endpoints
- Session cookies are HTTP-only and automatically attached by useApi() composable
- CSRF protection is mandatory for all state-changing requests

Guest token headers (for guest operations):

X-Guest-Id
X-Cart-Token
X-Comparison-Token

19.4 Error Format

All error responses follow:

{
  "message": "Error message",
  "errors": { ... },
  "status": 422
}

19.5 Pagination Format

{
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 134,
    "last_page": 7
  }
}

21. Full API Index

Below is a simplified index of all endpoints for quick reference.

**Identity & Authentication (13 endpoints)**

POST /register
POST /login
POST /logout
GET /api/v1/identity/me/profile
GET /api/v1/identity/addresses
POST /api/v1/identity/addresses
PUT /api/v1/identity/addresses/{id}
DELETE /api/v1/identity/addresses/{id}
POST /change-password/request
POST /change-password/confirm/{token}
POST /change-email/request
POST /change-email/confirm/{token}
GET /oauth/{provider}/redirect
GET /oauth/{provider}/callback

**Email Verification (2 endpoints)**

GET /verify-email/{id}/{hash}
POST /email/verification-notification

**Password Reset (2 endpoints)**

POST /forgot-password
POST /reset-password

**App/System (7 endpoints)**

GET /api/v1/system/config
PUT /api/v1/system/locale
PUT /api/v1/system/currency
GET /api/v1/system/locales
GET /api/v1/system/currencies
GET /api/v1/app/languages
GET /api/v1/app/currencies

**Banners (1 endpoint)**

GET /api/v1/banners/homepage

**Notifications (5 endpoints)**

GET /api/v1/notifications
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences/{channel}/{group}
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/webhooks/telegram/{token} (Internal)

**Catalog (8 endpoints)**

GET /api/v1/catalog/categories
GET /api/v1/catalog/categories/{slug}
GET /api/v1/catalog/brands
GET /api/v1/catalog/products
GET /api/v1/catalog/variants
GET /api/v1/catalog/variants/{idOrSlug}
GET /api/v1/catalog/suggest
GET /api/v1/catalog/favorites
POST /api/v1/catalog/favorites
DELETE /api/v1/catalog/favorites/{variantId}
GET /api/v1/catalog/comparison
POST /api/v1/catalog/comparison/items
DELETE /api/v1/catalog/comparison/items/{variantId}
DELETE /api/v1/catalog/comparison

**Cart (9 endpoints)**

GET /api/v1/cart
HEAD /api/v1/cart/v
POST /api/v1/cart/items
PATCH /api/v1/cart/items/{itemId}
DELETE /api/v1/cart/items/{itemId}
PATCH /api/v1/cart/items/{itemId}/options
POST /api/v1/cart/coupons
DELETE /api/v1/cart/coupons/{code}
POST /api/v1/cart/attach

**Checkout (6 endpoints)**

POST /api/v1/checkout/start
PUT /api/v1/checkout/{id}/address
PUT /api/v1/checkout/{id}/shipping-method
PUT /api/v1/checkout/{id}/payment-provider
POST /api/v1/checkout/{id}/confirm

**Shipping (5 endpoints)**

GET /api/v1/shipping/methods
GET /api/v1/shipping/{provider_code}/settlements/search
GET /api/v1/shipping/{provider_code}/warehouses/search
POST /api/v1/shipping/webhook/{provider_code}

**Payments (3 endpoints)**

GET /api/v1/payments/providers
POST /api/v1/payments/init
POST /api/v1/payments/webhook/{provider_code}

**Orders (3 endpoints)**

GET /api/v1/orders/statuses
GET /api/v1/orders
GET /api/v1/orders/{id}

**Blog (4 endpoints)**

GET /api/v1/blog/categories
GET /api/v1/blog/categories/{slug}
GET /api/v1/blog/posts
GET /api/v1/blog/posts/{slug}

**Reviews (3 endpoints)**

GET /api/v1/reviews
POST /api/v1/reviews
POST /api/v1/reviews/{review_id}/replies

**Comments (3 endpoints)**

GET /api/v1/comments/types
GET /api/v1/comments
POST /api/v1/comments

**Loyalty (2 endpoints)**

GET /api/v1/loyalty
GET /api/v1/loyalty/history

**Audience (5 endpoints)**

POST /api/v1/audience/subscribe
GET /api/v1/audience/confirm
GET /api/v1/audience/unsubscribe
POST /api/v1/audience/unsubscribe
POST /api/v1/audience/webhooks/{provider} (Internal)

**Customer Support (2 endpoints)**

POST /api/v1/customer-support/requests
GET /api/v1/customer-support/requests/types

**Leads (1 endpoint)**

POST /api/v1/leads

**Site/SEO (4 endpoints)**

GET /api/v1/site?url={path}
GET /api/v1/site/pages/{slug}
GET /api/v1/site/menus/tree
GET /api/v1/site/contacts

**Health (1 endpoint)**

GET /api/v1/health

**Total: ~90+ endpoints** (updated from Scribe documentation)

🟦 END OF API.md (complete)