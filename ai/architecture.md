architecture.md — PART 1

(Professional, fully rewritten, clean English version)

📐 Architecture Overview — Full Detailed Specification

This document provides the complete frontend architecture specification for the Nuxt 4 e-commerce project.
It integrates all domains of the platform — Catalog, Cart, Checkout, Auth, Blog, SEO, Payments, System Config, and User Profile — and defines the unified structure required for production-grade implementation.

This file is meant to be used by:

Senior Nuxt developers

System architects

AI agents (such as Claude Opus 4.5)

Teams onboarding to the project

It describes:

Directory structure

Rendering strategy (SSR/CSR)

Token model

API integration model

Stores

Composables

Middleware

SEO architecture

Checkout architecture

Component design

Internal data flows

Error handling rules

1. Project Principles

The frontend architecture follows:

✔ Nuxt 4 Best Practices

Hybrid SSR/CSR rendering

Server routes via /server/api/*

Runtime config for backend URLs

useAsyncData + server-side fetch for SEO-critical pages

✔ Modular Architecture

UI → Components → Composables → Stores → Server API → Backend API

✔ Strong TypeScript Usage

DTOs for every response

Internal models

Utility types for common patterns

Strict linting

✔ API-first Implementation

No assumptions.
Only endpoints defined in api.md may be used.

✔ Clean Atomic Design

atoms

molecules

organisms

templates

✔ Guest-safe Token Model

Tokens stored consistently and safely, across SSR/CSR.

2. Directory Structure (Full)
project/
│
├─ app/
│   ├─ app.vue
│   │
│   ├─ pages/
│   │   ├─ index.vue
│   │   │
│   │   ├─ catalog/
│   │   │   ├─ index.vue
│   │   │   ├─ [category].vue
│   │   │   └─ search.vue (optional)
│   │   │
│   │   ├─ product/
│   │   │   └─ [slug].vue
│   │   │
│   │   ├─ cart.vue
│   │   ├─ favorites.vue
│   │   ├─ comparison.vue
│   │   │
│   │   ├─ checkout.vue              # /checkout → Single-Page Checkout (SPC)
│   │   │
│   │   ├─ profile/
│   │   │   ├─ index.vue
│   │   │   ├─ addresses.vue
│   │   │   ├─ orders.vue
│   │   │   └─ order/
│   │   │       └─ [id].vue
│   │   │
│   │   ├─ blog/
│   │   │   ├─ index.vue
│   │   │   ├─ [slug].vue
│   │   │   └─ category/
│   │   │       └─ [slug].vue
│   │   │
│   │   └─ auth/
│   │       ├─ login.vue
│   │       ├─ register.vue
│   │       ├─ forgot-password.vue
│   │       ├─ reset-password.vue
│   │       └─ email-verification.vue
│   │
│   ├─ components/
│   │   ├─ ui/                       # buttons, inputs, typography
│   │   ├─ layout/                   # headers, footers
│   │   ├─ product/
│   │   ├─ catalog/
│   │   ├─ cart/
│   │   ├─ checkout/
│   │   ├─ blog/
│   │   ├─ seo/
│   │   └─ shared/
│   │
│   ├─ stores/
│   │   ├─ auth.store.ts            # Identity API (auth, profile, addresses)
│   │   ├─ system.store.ts
│   │   ├─ cart.store.ts
│   │   ├─ catalog.store.ts
│   │   ├─ product.store.ts
│   │   ├─ favorites.store.ts
│   │   ├─ comparison.store.ts
│   │   ├─ checkout.store.ts
│   │   ├─ orders.store.ts
│   │   ├─ blog.store.ts
│   │   ├─ seo.store.ts
│   │   ├─ notifications.store.ts    # Notifications API
│   │   └─ audience.store.ts         # Audience/Email Marketing API
│   │
│   ├─ composables/
│   │   ├─ useApi.ts
│   │   ├─ useIdentity.ts            # Identity API composable
│   │   ├─ useCart.ts
│   │   ├─ useCheckout.ts
│   │   ├─ useFavorites.ts
│   │   ├─ useComparison.ts
│   │   ├─ useCatalog.ts
│   │   ├─ useBlog.ts
│   │   ├─ useSeo.ts
│   │   ├─ useLocaleCurrency.ts
│   │   ├─ usePagination.ts
│   │   ├─ useDebounce.ts
│   │   ├─ useNotifications.ts       # Notifications composable
│   │   └─ useAudience.ts            # Audience composable
│   │
│   ├─ middleware/
│   │   ├─ auth.global.ts
│   │   ├─ guest-token.global.ts
│   │   ├─ cart-token.global.ts
│   │   ├─ comparison-token.global.ts
│   │   ├─ seo.global.ts
│   │   └─ locale.global.ts
│   │
│   ├─ layouts/
│   │   ├─ default.vue
│   │   ├─ checkout.vue
│   │   └─ profile.vue
│   │
│   ├─ plugins/
│   │   └─ init.client.ts
│   │
│   ├─ types/
│   │   ├─ auth.ts
│   │   ├─ cart.ts
│   │   ├─ catalog.ts
│   │   ├─ product.ts
│   │   ├─ checkout.ts
│   │   ├─ system.ts
│   │   ├─ blog.ts
│   │   ├─ seo.ts
│   │   ├─ orders.ts
│   │   └─ common.ts
│   │
│   └─ utils/
│       ├─ price.ts
│       ├─ format.ts
│       ├─ errors.ts
│       ├─ validator.ts
│       └─ tokens.ts
│
├─ server/
│   └─ routes/
│       ├─ catalog/
│       ├─ cart/
│       ├─ checkout/
│       ├─ blog/
│       ├─ system/
│       ├─ seo/
│       └─ auth/
│
└─ public/
    ├─ images/
    └─ seo/

3. Rendering Strategy (SSR/CSR)
3.1. SSR Pages (Server-Side Rendered)

Used for SEO-critical pages:

✔ Catalog

/catalog

/catalog/:slug

✔ Product Detail Page

/product/:slug

✔ Blog

/blog

/blog/:slug

/blog/category/:slug

✔ Static pages (if any)
✔ System config loader

Loaded SSR to hydrate global state (locale, currency).

3.2. CSR Pages (Client-Side Rendered)
✔ Cart

because dependent on guest token

✔ Favorites
✔ Comparison
✔ Checkout
✔ Profile
✔ Auth
✔ Password reset
✔ Email verification

Client-only because:

token-dependent

user-specific

SEO irrelevant

3.3. Hybrid SSR → CSR Hydration

Catalog and product pages:

SSR loads initial product/facets

CSR updates prices based on selected currency

4. Token Architecture

The platform uses three guest tokens and cookie-based authentication.

4.1. Authentication (Cookie-Based)

**SPA Authorization via Laravel Sanctum (Cookie-Based)**

Rules:
- Authentication is session-based via HTTP-only cookies
- Frontend MUST NOT use Bearer tokens
- Authorization header is NOT required for authenticated requests
- CSRF protection is mandatory

Login flow:
1. `GET /sanctum/csrf-cookie`
2. `POST /login`

Logout:
- `POST /logout`

All authenticated requests rely on HTTP-only session cookies — NOT Authorization headers.

The useApi() composable automatically handles:
- CSRF cookie retrieval before authenticated requests
- Session cookie management (HTTP-only, secure)
- SSR-safe cookie reading
- Automatic cookie attachment to all requests

### CSRF / XSRF Rules (MANDATORY)

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

4.2. Guest Tokens

1) X-Guest-Id
- Used by: Favorites
- Stored in: localStorage (CSR) + cookies (SSR fallback)

2) X-Cart-Token
- Used by: Cart, Checkout start
- Stored in: localStorage (CSR) + cookies (SSR fallback)

3) X-Comparison-Token
- Used by: Comparison table
- Stored in: localStorage (CSR) + cookies (SSR fallback)

**Important:** Guest tokens MUST NOT be mixed with authentication cookies.

5. API Access Layer (useApi.ts)

useApi() is the core communication layer.

Responsibilities:

Build endpoint URLs

Inject correct headers

Handle SSR requests

Attach all tokens

Process 401/403 errors

Refresh user state

Throw typed errors

Support retry logic

Automatically apply:

Accept-Language

Accept-Currency

Header Model:
X-Cart-Token: ...                    # Guest token (if exists)
X-Guest-Id: ...                      # Guest token (if exists)
X-Comparison-Token: ...              # Guest token (if exists)
Accept-Language: <locale>            # REQUIRED for all requests
Accept-Currency: <currency>          # REQUIRED for all requests

**Authentication:**
- Session cookies automatically attached (Laravel Sanctum)
- NO Authorization: Bearer headers
- CSRF cookie retrieved before authenticated requests (handled by useApi())

🟦 END OF PART 1

When you're ready →
Say:

“Continue (Part 2)”

и я продолжу формировать полный architecture.md Part 2.

You said:
Continue
ChatGPT said:

Отлично. Продолжаю.

📘 architecture.md — PART 2

6. Identity Module Architecture

The backend exposes an Identity subsystem under `/api/v1/identity/*`.

**Important:** Authentication endpoints use simplified paths (no `/api/v1/identity/auth/` prefix):
- `POST /register`
- `POST /login`
- `POST /logout`

### Identity Components:

1. **Authentication**
   - POST /register
   - POST /login (SPA / Sanctum)
   - POST /logout

2. **Profile**
   - GET /api/v1/identity/me/profile

3. **Addresses**
   - GET /api/v1/identity/addresses
   - POST /api/v1/identity/addresses
   - PUT /api/v1/identity/addresses/{id}
   - DELETE /api/v1/identity/addresses/{id}

### Identity Responsibilities:
- Centralized authentication (cookie-based, Sanctum)
- Profile detail loading
- Standardized address CRUD
- Consistent structure for future modules

### Frontend Architecture Impact:
- auth.store.ts handles Identity API (also referred to as "Identity Store" in comments)
- Profile pages consume identity API
- Address management in auth.store
- Checkout may reuse identity addresses if available


(Full Detailed English Version)

6. Pinia Stores — Full Architecture

This project uses a large number of interconnected Pinia stores, each responsible for an isolated domain.
Each store is designed for:

Single responsibility

SSR-awareness

API-driven state

Full TypeScript typing

Clean separation of state/actions/getters

Strong error handling

Below is the complete specification for all stores.

6.1 Auth Store (auth.store.ts)

**Note:** Also referred to as "Identity Store" in code comments, but file name is `auth.store.ts`

Handles:
- registration
- login (cookie-based, Sanctum)
- logout
- user profile hydration
- password reset
- email verification
- address management

State:
```typescript
user: null | User
loading: boolean
error: string | null
addresses: Address[]
emailVerificationStatus: "idle" | "sent" | "verified" | "error"
passwordResetStatus: "idle" | "sent" | "reset" | "error"
```

Actions:
- `register(payload)` → POST /register
- `login(payload)` → POST /login (with CSRF cookie first)
- `logout()` → POST /logout
- `fetchProfile()` → GET /api/v1/identity/me/profile
- `fetchAddresses()` → GET /api/v1/identity/addresses
- `createAddress(payload)` → POST /api/v1/identity/addresses
- `updateAddress(id, payload)` → PUT /api/v1/identity/addresses/{id}
- `deleteAddress(id)` → DELETE /api/v1/identity/addresses/{id}

Password Reset:
- `requestPasswordReset(email)` → POST /forgot-password
- `resetPassword(payload)` → POST /reset-password

Email Verification:
- `verifyEmail(id, hash)` → GET /verify-email/{id}/{hash}
- `resendVerification()` → POST /email/verification-notification

**Authentication Model:**
- Cookie-based (Laravel Sanctum)
- HTTP-only session cookies
- NO Bearer tokens
- CSRF protection mandatory



- brand filters  
- brand pages (optional)  







6.2 System Store (system.store.ts)

Loads environment-wide settings:

currencies

locales

price range

configuration flags

State:
locales: []
currencies: []
currentLocale: "en"
currentCurrency: "USD"
configuration: {}
loading: false

Actions:
GET /system/config
PUT /system/currency
PUT /system/locale

6.4 Product Store (product.store.ts)

Loads a single product variant and its options.

**Variant Resolution:**
The `{idOrSlug}` parameter supports:
- numeric variant ID
- string slug

Frontend must not assume slug-only resolution.

State:
```typescript
product: ProductVariant | null
variants: ProductVariant[]
selectedVariant: ProductVariant | null
loading: boolean
```

API:
- GET /api/v1/catalog/variants/{idOrSlug}

6.5 Cart Store (cart.store.ts)

Handles:

guest cart token

adding/updating/removing items

cart totals

coupons

item options

State:
cart: {
  id: string
  items: []
  totals: {
    subtotal: 0
    shipping: 0
    discounts: 0
    total: 0
  }
}
cartToken: string | null
loading: false
error: null
appliedCoupons: []

API:
- Load Cart: GET /api/v1/cart
- Add Item: POST /api/v1/cart/items
- Update Item Qty: PUT /api/v1/cart/items/{id}
- Delete Item: DELETE /api/v1/cart/items/{id}
- Attach Guest Cart on Login: POST /api/v1/cart/attach

**Cart Coupons (belong to Cart domain, NOT checkout):**
- Apply Coupon: POST /api/v1/cart/coupons
- Remove Coupon: DELETE /api/v1/cart/coupons/{code}

**Cart Item Options:**
- Update Item Options: PUT /api/v1/cart/items/{itemId}/options

**Important:** 
- Coupons and item options belong to Cart domain
- Checkout must NOT manage coupons
- Any cart change (items, quantity, options, coupons) invalidates active checkout session

6.6 Favorites Store (favorites.store.ts)

Stores:
- all favorite items
- adds/removes favorites
- uses guest token (X-Guest-Id)

API:
- GET /api/v1/catalog/favorites
- POST /api/v1/catalog/favorites/{variantId}
- DELETE /api/v1/catalog/favorites/{variantId}

6.7 Comparison Store (comparison.store.ts)

Uses token: X-Comparison-Token

API:
- GET /api/v1/catalog/comparison
- POST /api/v1/catalog/comparison/items
- DELETE /api/v1/catalog/comparison/items/{variantId} (note: variantId, not id)
- DELETE /api/v1/catalog/comparison

6.8 Checkout Store (checkout.store.ts)

Handles EVERYTHING related to checkout.

**Single-Page Checkout (SPC):**
- All steps on one page (`/checkout`)
- NO separate routes (`/checkout/address`, `/checkout/payment`, etc.)
- Dynamic UI state management

State (full):
```typescript
checkoutId: string | null
currentStep: 'address' | 'shipping' | 'payment' | 'confirm'
items: CheckoutItem[]
addresses: {
  shipping: Address | null,
  billing: Address | null,
  billingSameAsShipping: boolean
}
shippingMethods: ShippingMethod[]
selectedShippingMethod: ShippingMethod | null
paymentProviders: PaymentProvider[]
selectedPaymentProvider: PaymentProvider | null
pricing: {
  items: number,
  shipping: number,
  discounts: number,
  total: number
}
loading: boolean
error: string | null
```

API:
- POST /api/v1/checkout/start
- PUT /api/v1/checkout/{id}/address
- GET /api/v1/shipping/methods
- PUT /api/v1/checkout/{id}/shipping-method
- PUT /api/v1/checkout/{id}/payment-provider
- POST /api/v1/checkout/{id}/confirm

**Important Notes:**
- Checkout API is responsible ONLY for: order preparation, address, shipping, payment provider selection, order confirmation
- Checkout does NOT initialize payments
- Payment initialization happens via: POST /api/v1/payments/{provider}/init (after order confirmation)
- Any cart change invalidates checkout session → must restart checkout

6.9 Orders Store (orders.store.ts)
API:
GET /orders
GET /orders/{id}

6.10 Blog Store (blog.store.ts)
API:
GET /blog/categories
GET /blog/categories/{slug}
GET /blog/posts
GET /blog/posts/{slug}

6.11 SEO Store (seo.store.ts)

Handles:

fetching SEO metadata

applying metadata via useHead()

caching SSR results

API:
GET /site?url={path}

7. Middleware Architecture

The project uses global middleware to ensure that proper environmental data is always available.

7.1 guest-token.global.ts

Ensures:

X-Guest-Id


exists on first visit.

If not → generate & store in cookie + localStorage.

7.2 cart-token.global.ts

Ensures:

X-Cart-Token


exists prior to accessing /cart or /checkout.

7.3 comparison-token.global.ts

Ensures:

X-Comparison-Token

7.4 auth.global.ts

Redirects:

guest → /auth/login on restricted routes

user → cannot access /auth/login or /auth/register

7.5 locale.global.ts

Loads language + currency from cookies on first SSR request.

7.6 seo.global.ts

On each SSR route:

GET /site?url=currentUrl


Attach metadata via useHead.

7.7 checkout.guard.ts

(optional)

Ensures checkout session exists.

Redirects user to /checkout if they jump into deeper steps.

🟦 END OF PART 2

Готов продолжать.

Скажи:

“Continue (Part 3)”
You said:
Continue
ChatGPT said:

Продолжаю.
Вот architecture.md — PART 3 (full detailed, English).

📘 architecture.md — PART 3

(Full Detailed English Version)

8. SEO Architecture (Full Detailed)

SEO is a critical subsystem of this Nuxt 3 e-commerce frontend.
It ensures the correct metadata is always served for:

catalog pages

product pages

blog pages

blog categories

home page

static pages

cart (noindex)

checkout (noindex)

profile (noindex)

All metadata must be loaded server-side for SEO-critical pages.

8.1 SEO API Endpoint

All SEO data comes from:

GET /api/v1/site?url={path}

Response includes:

title

description

keywords

canonical

robots

text (HTML block for SEO text)

og_image

seoable_id

seoable_type (product, category, blog post…)

8.2 SEO rules by page type
✔ Indexable

/

/catalog

/catalog/:slug

/product/:slug

/blog

/blog/:slug

/blog/category/:slug

✔ Noindex (but follow allowed)

/cart

/comparison

/search

filtered catalog pages with many params

✔ Noindex & nofollow

/profile/*

/checkout/*

/auth/*

8.3 SSR SEO Logic

For every SSR page:

Middleware extracts request URL

Calls SEO API:

GET /site?url=/catalog/fitness


Saves data to seo.store

Injects into:

useHead({
  title,
  meta,
  link (canonical)
})

8.4 CSR SEO Logic

On client-side navigation:

Router triggers afterEach

Runs SEO middleware

Re-fetches metadata

Updates <head> dynamically

Nuxt will swap <title>, <meta>, <link rel="canonical"> on the fly.

8.5 SEO Store Responsibilities
state:
current: null | SeoMeta
loading: boolean

actions:

fetch(url)

apply() → injects metadata

reset()




9. Checkout Architecture (Deep Technical Specification)

Checkout is one of the most complex modules in the app.
It follows a strict linear progression:

Start → Address → Shipping → Payment → Confirm → Order


It is entirely client-side, due to token dependence and user interactivity.

@@
 # Checkout Architecture
 (существующая секция)

