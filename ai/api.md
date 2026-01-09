api.md — PART 1

(Full detailed, English, fully reorganized)

# API Documentation
Complete REST API Specification

This document describes the full backend API for the Nuxt 3 e-commerce frontend.

It includes all available endpoints from your Scribe export (62 total after analysis), categorized by domain.

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
  "password": "password"
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

Query params:

page
per_page

Response:

{
  "data": [...],
  "meta": {
    "current_page": 1,
    "total": 10,
    "last_page": 1
  }
}

5.2 Get Unread Count
GET /api/v1/notifications/count

Response:

{
  "count": 5
}

5.3 Update Preferences (Bulk)
POST /api/v1/notifications/preferences

Body:

{
  "email": true,
  "sms": false,
  "push": true
}

5.4 Update Preferences by Channel/Group
PUT /api/v1/notifications/preferences/{channel}/{group}

Example: PUT /api/v1/notifications/preferences/email/orders

Body:

{
  "enabled": true
}

5.5 Mark Notification as Read
POST /api/v1/notifications/{id}/read

Response:

{
  "status": "success"
}

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

The cart system is token-based (guest or user).
Tokens must be provided via:

X-Cart-Token: <string>

> NOTE:
> Coupons and item options belong to Cart domain:
> - **POST** `/api/v1/cart/coupons`
> - **DELETE** `/api/v1/cart/coupons/{code}`
> - **PUT** `/api/v1/cart/items/{itemId}/options`
> Checkout must NOT manage coupons.

### Checkout invalidation rule

Any cart change (items, quantity, options, coupons) invalidates the active checkout session.

Frontend MUST restart checkout after cart changes.

7.1 Get Cart
GET /api/v1/cart

Returns the current cart by token.

Response:

{
  "id": "crt_123",
  "items": [...],
  "totals": {
    "subtotal": 10000,
    "shipping": 1500,
    "discounts": 500,
    "total": 11000
  },
  "token": "abc123"
}

7.2 Add Item to Cart
POST /api/v1/cart/items

Body:

{
  "variant_id": 123,
  "quantity": 1
}

Response:

Updated cart

7.3 Update Item Quantity
PUT /api/v1/cart/items/{id}

Body:

{ "quantity": 3 }

7.4 Remove Item
DELETE /api/v1/cart/items/{id}

Removes the cart line item.

7.5 Attach Cart After Login
POST /api/v1/cart/attach

Used when a guest becomes authenticated.

7.6 Apply Coupon
POST /api/v1/cart/coupons

Body:

{ "code": "PROMO2025" }

Response:

{
  "discounts": [...],
  "totals": {...}
}

7.7 Remove Coupon
DELETE /api/v1/cart/coupons/{code}

7.8 Update Item Options
PUT /api/v1/cart/items/{itemId}/options

This enables selecting product options such as:

size
color
personalization
custom fields

Body:

{
  "options": {
    "color": "red",
    "size": "XL"
  }
}

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

Query params:

category_id

search

page

per_page

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

16.2 Confirm Subscription
POST /api/v1/audience/confirm

Body:

{
  "token": "<confirmation-token>"
}

Response:

{
  "status": "success",
  "message": "Subscription confirmed"
}

16.3 Unsubscribe
DELETE /api/v1/audience/unsubscribe

Body:

{
  "email": "user@example.com"
}

Response:

{
  "status": "success",
  "message": "Unsubscribed successfully"
}

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

18. SEO API

Core endpoint for SEO metadata.

17.1 Get SEO Metadata for a Page
GET /api/v1/site?url={path}

Query:

url — required

Response:

{
  "title": "...",
  "description": "...",
  "keywords": "...",
  "canonical": "https://...",
  "robots": "index,follow",
  "text": "<p>SEO text</p>",
  "og_image": "https://...",
  "seoable_id": 12,
  "seoable_type": "product"
}

19. System Health API

19.1 Health Check
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

Identity (7 endpoints)

POST /register

POST /login

POST /logout

GET /api/v1/identity/me/profile

GET /identity/addresses

POST /identity/addresses

PUT /identity/addresses/{id}

DELETE /identity/addresses/{id}

Email Verification (2 endpoints)

GET /verify-email/{id}/{hash}

POST /email/verification-notification

Password Reset (2 endpoints)

POST /forgot-password

POST /reset-password

System (5 endpoints)

GET /system/config

PUT /system/locale

PUT /system/currency

GET /system/locales

GET /system/currencies

Notifications (5 endpoints)

GET /notifications

GET /notifications/count

POST /notifications/preferences

PUT /notifications/preferences/{channel}/{group}

POST /notifications/{id}/read

Catalog (6 endpoints)

GET /catalog/categories

GET /catalog/categories/{slug}

GET /catalog/brands

GET /catalog/products

GET /catalog/variants

GET /catalog/variants/{idOrSlug}

Cart (8 endpoints)

GET /cart

POST /cart/items

PUT /cart/items/{id}

DELETE /cart/items/{id}

POST /cart/attach

POST /cart/coupons

DELETE /cart/coupons/{code}

PUT /cart/items/{itemId}/options

Favorites (3 endpoints)

GET /catalog/favorites

POST /catalog/favorites

DELETE /catalog/favorites/{variantId}

Comparison (4 endpoints)

GET /catalog/comparison

POST /catalog/comparison/items

DELETE /catalog/comparison/items/{variantId}

DELETE /catalog/comparison

Checkout (6 endpoints)

POST /checkout/start

PUT /checkout/{id}/address

GET /shipping/methods

PUT /checkout/{id}/shipping-method

PUT /checkout/{id}/payment-provider

POST /checkout/{id}/confirm

Shipping (2 endpoints)

GET /shipping/providers

GET /shipping/methods

Payments (2 endpoints)

GET /payments/providers

POST /payments/{provider}/init

Orders (2 endpoints)

GET /orders

GET /orders/{id}

Blog (4 endpoints)

GET /blog/categories

GET /blog/categories/{slug}

GET /blog/posts

GET /blog/posts/{slug}

Leads (1 endpoint)

POST /leads

Audience (3 endpoints)

POST /audience/subscribe

POST /audience/confirm

DELETE /audience/unsubscribe

Customer Support (1 endpoint)

POST /customer-support/requests

SEO (1 endpoint)

GET /site?url=/...

Health (1 endpoint)

GET /health

🟦 END OF API.md (complete)