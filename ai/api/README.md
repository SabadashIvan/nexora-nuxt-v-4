# API Documentation Index

Complete REST API specification split into 9 domain-focused files for efficient AI processing.

---

## 📁 API Files

### [authentication.md](authentication.md) (~300 lines)
**Domains:** Identity, Auth, Email Verification, Password Reset, OAuth

**Endpoints:**
- `/register`, `/login`, `/logout` - Core authentication
- `/api/v1/identity/me/profile` - User profile
- `/api/v1/identity/addresses` - Address management
- `/verify-email/{id}/{hash}` - Email verification
- `/forgot-password`, `/reset-password` - Password reset
- `/change-password/*`, `/change-email/*` - Account updates
- `/oauth/{provider}/*` - Social login/linking

**Use for:** Auth implementation, user profile, account management

---

### [catalog.md](catalog.md) (~200 lines)
**Domains:** Categories, Brands, Products, Variants, Search

**Endpoints:**
- `/api/v1/catalog/categories` - Category tree
- `/api/v1/catalog/brands` - Brand list
- `/api/v1/catalog/products` - Product listing with filters
- `/api/v1/catalog/variants/{idOrSlug}` - Product details
- `/api/v1/catalog/suggest` - Autocomplete search

**Use for:** Catalog pages, product listings, search functionality

---

### [cart-favorites.md](cart-favorites.md) (~500 lines)
**Domains:** Shopping Cart, Wishlist, Comparison

**Endpoints:**
- `/api/v1/cart` - Cart CRUD operations
- `/api/v1/cart/items` - Add/update/remove items
- `/api/v1/cart/coupons` - Coupon management
- `/api/v1/catalog/favorites` - Favorites management
- `/api/v1/catalog/comparison` - Comparison table

**Use for:** Cart implementation, wishlist, product comparison

**Important:** Cart uses versioning (`If-Match`, `Idempotency-Key` headers)

---

### [checkout-payments.md](checkout-payments.md) (~400 lines)
**Domains:** Checkout Flow, Payments

**Endpoints:**
- `/api/v1/checkout/start` - Initialize checkout
- `/api/v1/checkout/{id}/address` - Address step
- `/api/v1/checkout/{id}/shipping-method` - Shipping selection
- `/api/v1/checkout/{id}/payment-provider` - Payment selection
- `/api/v1/checkout/{id}/confirm` - Create order
- `/api/v1/payments/init` - Initialize payment (unified endpoint)
- `/api/v1/payments/providers` - Available payment methods

**Use for:** Checkout implementation, payment processing

**See also:** [../flows/checkout-flow.md](../flows/checkout-flow.md) for complete flow

---

### [shipping-orders.md](shipping-orders.md) (~350 lines)
**Domains:** Shipping Methods, Warehouse Search, Orders

**Endpoints:**
- `/api/v1/shipping/methods` - Available shipping methods
- `/api/v1/shipping/{provider}/settlements/search` - City search
- `/api/v1/shipping/{provider}/warehouses/search` - Warehouse search
- `/api/v1/orders` - Order list with filters
- `/api/v1/orders/{id}` - Order details
- `/api/v1/orders/statuses` - Order status list

**Use for:** Shipping selection, warehouse pickup, order management

---

### [content.md](content.md) (~450 lines)
**Domains:** Blog, Comments, Reviews

**Endpoints:**
- `/api/v1/blog/posts` - Blog post listing
- `/api/v1/blog/posts/{slug}` - Post details with SEO
- `/api/v1/comments` - Comments system
- `/api/v1/reviews` - Product reviews
- `/api/v1/reviews/{id}/replies` - Review replies

**Use for:** Blog implementation, comments, product reviews

---

### [notifications-loyalty.md](notifications-loyalty.md) (~300 lines)
**Domains:** Notifications, Loyalty Points

**Endpoints:**
- `/api/v1/notifications` - User notifications
- `/api/v1/notifications/preferences` - Notification settings
- `/api/v1/notifications/{id}/read` - Mark as read
- `/api/v1/loyalty` - Loyalty account balance
- `/api/v1/loyalty/history` - Transaction history

**Use for:** Notification system, loyalty points integration

---

### [audience-support.md](audience-support.md) (~350 lines)
**Domains:** Email Subscriptions, Leads, Support

**Endpoints:**
- `/api/v1/audience/subscribe` - Newsletter subscription
- `/api/v1/audience/confirm` - Confirm subscription (signed URL)
- `/api/v1/leads` - Contact form submissions
- `/api/v1/customer-support/requests` - Support requests
- `/api/v1/customer-support/requests/types` - Support types

**Use for:** Newsletter, contact forms, customer support

---

### [system-seo.md](system-seo.md) (~350 lines)
**Domains:** System Config, Languages, Currencies, SEO, Menus

**Endpoints:**
- `/api/v1/app/languages` - Available languages
- `/api/v1/app/currencies` - Available currencies
- `/api/v1/site?url={path}` - SEO metadata for any page
- `/api/v1/site/menus/tree` - Navigation menu
- `/api/v1/site/contacts` - Site contacts
- `/api/v1/site/pages/{slug}` - Static pages
- `/api/v1/banners/homepage` - Homepage banners

**Use for:** System initialization, SEO, navigation, static pages

---

## 🔍 Quick Endpoint Lookup

**Need a specific endpoint?**
→ Check [../reference/endpoint-index.md](../reference/endpoint-index.md) for alphabetical listing

**Common Patterns:**
- **Authentication**: Cookie-based (Laravel Sanctum)
- **Guest Operations**: Use `X-Guest-Id`, `X-Cart-Token`, `X-Comparison-Token` headers
- **Pagination**: Most list endpoints support `page` and `per_page` parameters
- **Localization**: Use `Accept-Language` header for translated content
- **Currency**: Use `Accept-Currency` header for price conversion

---

## ⚠️ Critical Rules

1. **Use ONLY documented endpoints** - Never invent API calls
2. **Respect SSR/CSR rules** - See [../constitution/rendering.md](../constitution/rendering.md)
3. **Token management** - See [../constitution/tokens.md](../constitution/tokens.md)
4. **API contracts** - See [../constitution/api-rules.md](../constitution/api-rules.md)
5. **All requests via useApi()** - Direct `fetch()` is forbidden

---

## 📊 File Size Benefits

**Before:** Single api.md = 70KB (3089 lines)
- Hard for AI to process
- Slow to search
- Difficult to maintain

**After:** 9 focused files averaging 8KB each
- ✅ Fast AI processing
- ✅ Easy domain lookup
- ✅ Maintainable structure
- ✅ Clear separation of concerns

---

## 🎯 Domain → File Mapping

| Domain | File | Key Endpoints |
|--------|------|---------------|
| Auth & Identity | authentication.md | /login, /register, /oauth |
| Products & Search | catalog.md | /catalog/products, /variants |
| Shopping | cart-favorites.md | /cart, /favorites, /comparison |
| Purchase Flow | checkout-payments.md | /checkout/*, /payments/* |
| Fulfillment | shipping-orders.md | /shipping/*, /orders/* |
| Content | content.md | /blog/*, /comments, /reviews |
| User Features | notifications-loyalty.md | /notifications, /loyalty |
| Marketing | audience-support.md | /audience, /leads, /support |
| System & SEO | system-seo.md | /site/*, /app/* |

---

**Navigate back:** [../README.md](../README.md)
