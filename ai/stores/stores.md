stores.md — PART 1
Auth, System, Catalog, Product Stores
# Stores Documentation

This document describes all Pinia stores used in the Nuxt 3 e-commerce project.
Each store has a single responsibility and maps directly to a backend domain.

1. Auth Store (auth.store.ts)
Purpose

Handles:

user authentication (cookie-based, Laravel Sanctum)

registration

logout

user hydration

password reset

email verification

profile management

address management (CRUD)

**Note:** Also referred to as "Identity Store" in code comments, but file name is `auth.store.ts`.

**Authentication Model:**
- Uses Laravel Sanctum SPA authorization (cookie-based)
- HTTP-only session cookies (automatically managed)
- NO Bearer tokens
- CSRF protection mandatory

State
user: User | null
addresses: IdentityAddress[]
loading: boolean
addressLoading: boolean
error: string | null
fieldErrors: Record<string, string>
emailVerificationStatus: "idle" | "sent" | "verified" | "error"
passwordResetStatus: "idle" | "sent" | "reset" | "error"
initialized: boolean

Getters
isAuthenticated: boolean
userName: string | null
userEmail: string | null
isEmailVerified: boolean
defaultShippingAddress: IdentityAddress | null
defaultBillingAddress: IdentityAddress | null
shippingAddresses: IdentityAddress[]
billingAddresses: IdentityAddress[]

Actions
login(payload)
POST /login (with CSRF cookie first)

Uses cookie-based authentication (Laravel Sanctum)
Save user
Sync cart via /cart/attach

register(payload)
POST /register

logout()
POST /logout

Clear user state

fetchProfile()
GET /api/v1/identity/me/profile

Address Management:
- fetchAddresses() → GET /api/v1/identity/addresses
- createAddress(payload) → POST /api/v1/identity/addresses
- updateAddress(id, payload) → PUT /api/v1/identity/addresses/{id}
- deleteAddress(id) → DELETE /api/v1/identity/addresses/{id}

Password Reset Actions

Forgot password
POST /forgot-password

Reset password
POST /reset-password

Email Verification Actions
GET /verify-email/{id}/{hash}
POST /email/verification-notification

SSR Behavior

On SSR: load user if session cookie exists

Session cookies are HTTP-only (managed by Laravel Sanctum)

Never expose session cookies in HTML

Error Handling

Validation errors from 422

Authentication errors from 401

2. System Store (system.store.ts)
Purpose

Handles global system configuration:

locale

currency

system-wide settings

feature toggles

State
locales: []
currencies: []
currentLocale: "en"
currentCurrency: "USD"
systemConfig: {}
loading: boolean

Actions
fetchSystemConfig()
GET /system/config

setLocale(locale)
PUT /system/locale

setCurrency(currency)
PUT /system/currency

SSR Behavior

System config always loaded SSR

Locale & currency read from cookies

3. Catalog Store (catalog.store.ts)
Purpose

Handles:

category tree

product listings

filters & facets

pagination

sorting

caching SSR results

State
categories: []
products: []
filters: {}
sorting: "default"
pagination: {
  page: 1,
  perPage: 20,
  total: 0,
  lastPage: 1
}
loading: boolean

Actions
fetchCategories()
GET /catalog/categories

fetchCategory(slug)
GET /catalog/categories/{slug}

fetchProducts(params)
GET /catalog/products

applyFilters(filters)

Update filters + reload products.

applySorting(sort)

Update sorting + reload.

resetFilters()
resetPagination()
SSR Behavior

Category pages SSR-rendered

Product listings SSR-rendered for SEO

Filters applied client-side but initial load via SSR

4. Product Store (product.store.ts)
Purpose

Handles:

loading of single product variant

switching variant options

retrieving variant data

caching last loaded product

State
product: ProductVariant | null
variants: []
selectedVariant: ProductVariant | null
loading: boolean

Actions
fetch(slug)
GET /catalog/variants/{slug}

selectOption(option)

Updates selected option and recalculates available variant.

getVariantByOptions()

Finds matching variant with selected attributes.

SSR Behavior

Product page is fully SSR

Fetch on server: GET /catalog/variants/{slug}

Hydrate store on client

🟦 END OF PART 1

Следующая часть:

👉 stores.md — PART 2 (Cart, Coupons, Item Options, Favorites, Comparison)

Скажи:

Continue (Stores Part 2)
You said:
Continue
ChatGPT said:

Продолжаю.
Вот stores.md — PART 2.

📘 stores.md — PART 2
Cart, Coupons, Item Options, Favorites, Comparison Stores
5. Cart Store (cart.store.ts)
Purpose

The cart store manages:

guest/user cart token

cart items

totals

adding/removing items

updating quantity

applying/removing coupons

updating item-level options

syncing the cart after login

Cart is token-based, not user-bound.

State
cart: {
  id: string | null
  items: CartItem[]
  totals: CartTotals
}
cartToken: string | null
loading: boolean
error: string | null
appliedCoupons: string[]

Getters
itemCount: number
cartTotal: number
discountTotal: number
isEmpty: boolean

Actions
loadCart()
GET /cart

addItem(variantId, quantity)
POST /cart/items

updateItemQuantity(itemId, qty)
PUT /cart/items/{id}

removeItem(itemId)
DELETE /cart/items/{id}

attachCart()

Used after login.

POST /cart/attach

🟦 Coupon Management (NEW)

(Missing in your previous documentation — now fully formalized)

applyCoupon(code)
POST /cart/coupons


On success:

update totals

append to appliedCoupons

On failure:

display validation error (422)

removeCoupon(code)
DELETE /cart/coupons/{code}

🟦 Cart Item Options Management (NEW)

Allows updating per-item attributes such as size/color.

updateItemOptions(itemId, options)
PUT /cart/items/{itemId}/options


Example options:

{
  "color": "red",
  "size": "XL"
}

SSR Behavior

Cart is CSR-only

Tokens required → load only client-side

Never SSR fetch cart

Error Handling

422 for invalid quantity or coupon

400 for malformed options

404 if item removed server-side

6. Favorites Store (favorites.store.ts)
Purpose

Manages a guest/user favorites list using:

X-Guest-Id


Favorites follow “toggle” behavior.

State
favorites: ProductVariant[]
loading: boolean

Actions
fetchFavorites()
GET /favorites

addToFavorites(variantId)
POST /favorites

Body: { "variant_id": <variantId> }

removeFromFavorites(variantId)
DELETE /favorites/{variantId}

toggleFavorite(variantId)

Calls add or remove depending on state.

SSR Behavior

CSR-only

Controlled by guest token

7. Comparison Store (comparison.store.ts)
Purpose

Handles comparison table via:

X-Comparison-Token


Supports:

viewing items

adding items

removing items

clearing table

State
comparisonToken: string | null
items: ProductVariant[]
loading: boolean

Actions
fetchComparison()
GET /comparison

addToComparison(variantId)
POST /comparison/items

removeFromComparison(itemId)
DELETE /comparison/items/{id}

clearComparison()
DELETE /comparison

SSR Behavior

CSR-only

Comparison token stored in cookie/localStorage

🟦 END OF PART 2

Следующая часть:

👉 stores.md — PART 3 (Checkout, Orders, Blog, SEO)

Скажи:

Continue (Stores Part 3)
You said:
 Continue
ChatGPT said:

Продолжаю.
Вот stores.md — PART 3 (Checkout, Orders, Blog, SEO Stores).

📘 stores.md — PART 3
Checkout, Orders, Blog, SEO Stores
8. Checkout Store (checkout.store.ts)

Checkout is one of the most advanced stores in this project.
It orchestrates the entire multi-step purchase flow.

Purpose

This store manages:

checkout session

addresses (shipping + billing)

shipping methods

payment providers

pricing updates

validation errors

confirmation

This is a client-only store (CSR) because checkout depends on guest/cart tokens.

State
checkoutId: string | null

items: CheckoutItem[]

addresses: {
  shipping: Address | null,
  billing: Address | null,
  billingSameAsShipping: boolean
}

shippingMethods: ShippingMethod[]
selectedShipping: ShippingMethod | null

paymentProviders: PaymentProvider[]
selectedPayment: PaymentProvider | null

pricing: {
  items: number,
  shipping: number,
  discounts: number,
  total: number
}

status: "idle" | "address" | "shipping" | "payment" | "confirm"
loading: boolean
error: string | null

Actions (Full)
startCheckout()

Creates the checkout session.

POST /checkout/start


Updates:

checkoutId

items

pricing

addresses

Status becomes "address".

updateAddress(payload)
PUT /checkout/{id}/address


Payload:

{
  shipping_address: {...},
  billing_address: {...},
  billing_same_as_shipping: boolean
}


Status becomes "shipping".

fetchShippingMethods(checkoutSessionId, destination)
GET /api/v1/shipping/methods?checkout_session_id={id}&dest.country=...&dest.city=...


Stores the result into:

shippingMethods[]

**Parameters:**
- `checkout_session_id` (required): Current checkout session ID
- `dest.country` (required): Destination country code
- `dest.city` (required): Destination city
- `dest.region` (optional): Destination region/state
- `dest.postal` (optional): Destination postal code

applyShippingMethod(methodCode, quoteId, warehouseId?)
PUT /api/v1/checkout/{id}/shipping-method

**Body:**
```json
{
  "method_code": "np_warehouse",
  "quote_id": "q_01k8awpra03ck0bq331y0j3fd5",
  "provider_metadata": {
    "warehouse_external_id": "1ec09d88-e1c2-11ec-8f4a-48df37b921db"  // Optional: for warehouse methods
  }
}
```

**Warehouse Support:**
For shipping methods that require warehouse selection (pickup points):
1. Use `useShippingSearch()` composable to search settlements
2. Then search warehouses for selected city
3. Include `warehouse_external_id` in provider_metadata when applying

Updates:

selectedShipping

pricing

Status becomes "payment".

applyPaymentProvider(code)
PUT /checkout/{id}/payment-provider


Status becomes "confirm".

confirmCheckout()
POST /checkout/{id}/confirm


Returns:

order_id

reset()

Resets the entire store (used if the cart changes).

SSR Behavior

Checkout must not run in SSR

All operations are CSR

If SSR tries to load checkout → redirect to /cart

9. Orders Store (orders.store.ts)
Purpose

Manages user orders for:

order list

order details

order status filtering

State
```typescript
{
  orders: Order[],
  order: Order | null,
  statuses: OrderStatus[],        // Available order statuses
  pagination: PaginationMeta | null,
  loading: boolean,
  error: string | null
}
```

Getters
- `orderCount`: Total number of orders
- `hasOrders`: Whether user has any orders
- `availableStatuses`: List of order statuses for filtering

Actions

**fetchOrders(page, perPage, statuses)**
GET /api/v1/orders?page={page}&per_page={perPage}&statuses[]={ids}

Load paginated orders list with optional status filtering.
- `statuses` parameter accepts array of status IDs: [1, 2, 3]
- Multiple statuses can be selected simultaneously

**fetchOrder(id)**
GET /api/v1/orders/{id}

Load detailed order information including:
- Order lines with options
- Totals and discounts
- Loyalty points used
- Shipping details
- Shipment tracking
- Payment intent status
- Addresses

**fetchOrderStatuses()**
GET /api/v1/orders/statuses

Load list of available order statuses.
Response: Array of `{ id, title }` objects
Example: [{ id: 1, title: "Pending" }, { id: 2, title: "Paid" }]

SSR Behavior

Orders are CSR, not SSR

Must have Authorization token (cookie-based session)

10. Blog Store (blog.store.ts)
Purpose

Handles all blog-related data:

categories

posts list

posts by category

single blog article

Blog is highly SEO-dependent → SSR must be used.

State
categories: BlogCategory[]
posts: BlogPost[]
pagination: Pagination
currentPost: BlogPost | null
loading: boolean

Actions
fetchCategories()
GET /blog/categories

fetchPosts(params)
GET /blog/posts

fetchPost(slug)
GET /blog/posts/{slug}

resetPagination()
SSR Behavior

All blog pages load data via SSR

SEO metadata loaded server-side

Blog posts must use server fetch for best SEO performance

11. SEO Store (seo.store.ts)
Purpose

Handles centralized SEO metadata loading and injection.

Used by:

catalog pages

product pages

blog

home page

some dynamic routes

State
current: SeoMeta | null
loading: boolean
error: string | null

Actions
fetch(url)
GET /site?url={path}


Loads metadata from backend.

apply()

Inject metadata into <head>:

title

meta description

keywords

og:image

canonical link

robots

Using:

useHead({ ... })

reset()

Clear metadata before loading new one.

SSR Behavior

SEO middleware calls fetch() on SSR

Client navigation must re-trigger SEO updates

12. Support Store (support.store.ts)
Purpose

Handles customer support request submissions.

State
loading: boolean
error: string | null
message: string | null
success: boolean
retryAfter: number | null
fieldErrors: Record<string, string>

Actions
submitRequest(payload)
POST /api/v1/customer-support/requests

Rate limiting: 3 attempts per 60 minutes per email/IP

SSR Behavior

CSR-only (public endpoint, no authentication required)

13. Comments Store (comments.store.ts)
Purpose

Handles fetching and creating comments for products and other entities.

State
comments: Comment[]
pagination: Pagination
loading: boolean
submitting: boolean
error: string | null
fieldErrors: Record<string, string>

Actions
fetchComments(params)
GET /api/v1/comments (or entity-specific endpoint)

createComment(payload)
POST /api/v1/comments

SSR Behavior

CSR-only (comments are not SEO-critical)

14. Reviews Store (reviews.store.ts)
Purpose

Handles fetching and creating product reviews.

State
reviews: Review[]
currentPage: number
hasMorePages: boolean
loading: boolean
submitting: boolean
error: string | null
fieldErrors: Record<string, string>

Getters
hasReviews: boolean
reviewsCount: number
averageRating: number

Actions
fetchReviews(params)
GET /api/v1/reviews (or product-specific endpoint)

createReview(payload)
POST /api/v1/reviews

**14.2 Create Reply to Review**
POST /api/v1/reviews/{review_id}/replies

Body:
{
  "body": "Thank you for your feedback!"
}

SSR Behavior

CSR-only (reviews are not SEO-critical)

15. Loyalty Store (loyalty.store.ts)

Purpose

Manages loyalty points account and transaction history for authenticated users.

State
```typescript
{
  account: LoyaltyAccount | null,     // { user_id, balance, pending }
  history: LoyaltyTransaction[],      // Array of transactions
  historyPagination: PaginationMeta | null,
  loading: boolean,
  error: string | null
}
```

Getters
- `activeBalance`: Formatted active balance string
- `pendingBalance`: Formatted pending balance string
- `hasLoyaltyAccount`: Whether user has loyalty account loaded
- `totalTransactions`: Total count from pagination

Actions

**fetchLoyaltyAccount()**
GET /api/v1/loyalty

Loads current balance (active + pending) for authenticated user.

**fetchLoyaltyHistory(page, perPage)**
GET /api/v1/loyalty/history?page={page}&per_page={perPage}

Loads paginated transaction history.

Response includes:
- Transaction type: "Accrual" or "Spending"
- Amount (formatted with sign: "+$100.00" or "-$10.00")
- Description
- Expiration date (for accruals)
- Created date

SSR Behavior

CSR-only (requires authentication, user-specific data)

**Authentication:** Required (cookie-based session)

16. Notifications Store (notifications.store.ts)

Purpose

Manages user notifications, preferences, and notification actions.

State
```typescript
{
  notifications: Notification[],
  preferences: NotificationChannel[],
  unreadCount: number,
  currentFilter: 'all' | 'unread' | 'archived',
  hasMorePages: boolean,
  loading: boolean,
  error: string | null
}
```

Getters
- `unreadNotifications`: Filter unread notifications
- `archivedNotifications`: Filter archived notifications  
- `hasUnread`: Whether there are unread notifications

Actions

**fetchNotifications(filter)**
GET /api/v1/notifications?filter={all|unread|archived}

Load notifications with optional filter.

**fetchUnreadCount()**
GET /api/v1/notifications/count

Get count of unread notifications (for badge display).

**fetchPreferences()**
GET /api/v1/notifications/preferences

Load notification preferences matrix (channels and groups).

**togglePreference(channel, group)**
PUT /api/v1/notifications/preferences/{channel}/{group}

Toggle notification preference for specific channel and group.
Channels: 1 (Mail), 2 (Database), 3 (Broadcast)

**markAsRead(id)**
PUT /api/v1/notifications/{id}/read

Mark specific notification as read.

**markAllAsRead()**
PUT /api/v1/notifications/read-all

Mark all unread notifications as read.

**archiveNotification(id)**
PUT /api/v1/notifications/{id}/archive

Archive notification (removes from default list).

**restoreNotification(id)**
PUT /api/v1/notifications/{id}/restore

Restore previously archived notification.

SSR Behavior

CSR-only (requires authentication, user-specific data)

**Authentication:** Required (cookie-based session)

17. Token Notes

The following stores require tokens:

Store	Tokens
cart	X-Cart-Token
favorites	X-Guest-Id
comparison	X-Comparison-Token
checkout	X-Cart-Token
auth	Session cookies (HTTP-only, Laravel Sanctum)
orders	Session cookies (HTTP-only, Laravel Sanctum)

**Note:** Authentication uses cookie-based session (Laravel Sanctum), NOT Bearer tokens.

Stores that require SSR:

catalog.store
product.store
blog.store
seo.store
system.store   (startup load)


Stores that must be CSR:

cart.store
favorites.store
comparison.store
checkout.store
auth.store (partial SSR allowed for user hydration)
orders.store
support.store
comments.store
reviews.store

🟦 END OF PART 3