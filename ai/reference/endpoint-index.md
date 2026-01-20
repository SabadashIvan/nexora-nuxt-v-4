# API Endpoint Index

Alphabetical reference of all 90+ API endpoints with file locations for quick lookup.

**Last Updated:** 2026-01-19

---

## A

**`/api/v1/app/currencies`** → [../api/system-seo.md](../api/system-seo.md)
- GET - List active currencies with default

**`/api/v1/app/languages`** → [../api/system-seo.md](../api/system-seo.md)
- GET - List active languages with default

**`/api/v1/audience/confirm`** → [../api/audience-support.md](../api/audience-support.md)
- GET - Confirm subscription (signed URL)

**`/api/v1/audience/subscribe`** → [../api/audience-support.md](../api/audience-support.md)
- POST - Subscribe to audience/newsletter

**`/api/v1/audience/unsubscribe`** → [../api/audience-support.md](../api/audience-support.md)
- GET - Unsubscribe (signed URL)
- POST - Unsubscribe from account (authenticated)

**`/api/v1/audience/webhooks/{provider}`** → [../api/audience-support.md](../api/audience-support.md)
- POST - Audience webhook handler

---

## B

**`/api/v1/banners/homepage`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get homepage hero banners

**`/api/v1/blog/categories`** → [../api/content.md](../api/content.md)
- GET - List blog categories

**`/api/v1/blog/categories/{slug}`** → [../api/content.md](../api/content.md)
- GET - Get category by slug

**`/api/v1/blog/posts`** → [../api/content.md](../api/content.md)
- GET - List blog posts with filters

**`/api/v1/blog/posts/{slug}`** → [../api/content.md](../api/content.md)
- GET - Get blog post details with SEO

---

## C

**`/api/v1/cart`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- GET - Get current cart

**`/api/v1/cart/attach`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- POST - Attach guest cart to authenticated user

**`/api/v1/cart/coupons`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- POST - Apply coupon to cart

**`/api/v1/cart/coupons/{code}`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- DELETE - Remove coupon from cart

**`/api/v1/cart/items`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- POST - Add item to cart

**`/api/v1/cart/items/{itemId}`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- PATCH - Update item quantity
- DELETE - Remove item from cart

**`/api/v1/cart/items/{itemId}/options`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- PATCH - Update item options (gift wrap, etc.)

**`/api/v1/cart/v`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- HEAD - Get cart version (without full data)

**`/api/v1/catalog/brands`** → [../api/catalog.md](../api/catalog.md)
- GET - List all brands

**`/api/v1/catalog/categories`** → [../api/catalog.md](../api/catalog.md)
- GET - Get category tree

**`/api/v1/catalog/categories/{slug}`** → [../api/catalog.md](../api/catalog.md)
- GET - Get category by slug

**`/api/v1/catalog/comparison`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- GET - Get comparison table
- DELETE - Clear comparison table

**`/api/v1/catalog/comparison/items`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- POST - Add item to comparison

**`/api/v1/catalog/comparison/items/{variantId}`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- DELETE - Remove item from comparison

**`/api/v1/catalog/favorites`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- GET - List favorites
- POST - Add favorite

**`/api/v1/catalog/favorites/{variantId}`** → [../api/cart-favorites.md](../api/cart-favorites.md)
- DELETE - Remove favorite

**`/api/v1/catalog/products`** → [../api/catalog.md](../api/catalog.md)
- GET - List products with filters

**`/api/v1/catalog/suggest`** → [../api/catalog.md](../api/catalog.md)
- GET - Search autocomplete/suggestions

**`/api/v1/catalog/variants`** → [../api/catalog.md](../api/catalog.md)
- GET - List all variants

**`/api/v1/catalog/variants/{idOrSlug}`** → [../api/catalog.md](../api/catalog.md)
- GET - Get variant details by ID or slug

**`/api/v1/checkout/start`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- POST - Start checkout session

**`/api/v1/checkout/{id}/address`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- PUT - Update checkout addresses

**`/api/v1/checkout/{id}/confirm`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- POST - Confirm checkout (create order)

**`/api/v1/checkout/{id}/payment-provider`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- PUT - Set payment provider

**`/api/v1/checkout/{id}/shipping-method`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- PUT - Set shipping method

**`/api/v1/comments`** → [../api/content.md](../api/content.md)
- GET - List comments for entity
- POST - Create comment

**`/api/v1/comments/types`** → [../api/content.md](../api/content.md)
- GET - List commentable types

**`/api/v1/customer-support/requests`** → [../api/audience-support.md](../api/audience-support.md)
- POST - Submit support request

**`/api/v1/customer-support/requests/types`** → [../api/audience-support.md](../api/audience-support.md)
- GET - List support request types

---

## E

**`/email/verification-notification`** → [../api/authentication.md](../api/authentication.md)
- POST - Resend verification email

---

## F

**`/forgot-password`** → [../api/authentication.md](../api/authentication.md)
- POST - Request password reset link

---

## H

**`/api/v1/health`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Health check

---

## I

**`/api/v1/identity/addresses`** → [../api/authentication.md](../api/authentication.md)
- GET - List user addresses
- POST - Create address

**`/api/v1/identity/addresses/{id}`** → [../api/authentication.md](../api/authentication.md)
- PUT - Update address
- DELETE - Delete address

**`/api/v1/identity/me/profile`** → [../api/authentication.md](../api/authentication.md)
- GET - Get user profile

---

## L

**`/api/v1/leads`** → [../api/audience-support.md](../api/audience-support.md)
- POST - Submit lead/contact form

**`/login`** → [../api/authentication.md](../api/authentication.md)
- POST - Login user (SPA/Sanctum)

**`/logout`** → [../api/authentication.md](../api/authentication.md)
- POST - Logout user

**`/api/v1/loyalty`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- GET - Get loyalty account details

**`/api/v1/loyalty/history`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- GET - Get loyalty transaction history

---

## N

**`/api/v1/notifications`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- GET - List notifications with filters

**`/api/v1/notifications/count`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- GET - Get unread notifications count

**`/api/v1/notifications/preferences`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- GET - Get notification preferences

**`/api/v1/notifications/preferences/{channel}/{group}`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- PUT - Update notification preference

**`/api/v1/notifications/read-all`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- PUT - Mark all notifications as read

**`/api/v1/notifications/webhooks/telegram/{token}`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- POST - Telegram webhook (internal)

**`/api/v1/notifications/{id}/archive`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- PUT - Archive notification

**`/api/v1/notifications/{id}/read`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- PUT - Mark notification as read

**`/api/v1/notifications/{id}/restore`** → [../api/notifications-loyalty.md](../api/notifications-loyalty.md)
- PUT - Restore notification

---

## O

**`/oauth/{provider}/callback`** → [../api/authentication.md](../api/authentication.md)
- GET - Handle OAuth callback

**`/oauth/{provider}/redirect`** → [../api/authentication.md](../api/authentication.md)
- GET - Get OAuth redirect URL

**`/api/v1/orders`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - List user orders with filters

**`/api/v1/orders/statuses`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - List order statuses

**`/api/v1/orders/{id}`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - Get order details

---

## P

**`/api/v1/payments/init`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- POST - Initialize payment (unified endpoint)

**`/api/v1/payments/providers`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- GET - List payment providers

**`/api/v1/payments/webhook/{provider_code}`** → [../api/checkout-payments.md](../api/checkout-payments.md)
- POST - Payment webhook handler

---

## R

**`/register`** → [../api/authentication.md](../api/authentication.md)
- POST - Register new user

**`/reset-password`** → [../api/authentication.md](../api/authentication.md)
- POST - Reset password with token

**`/api/v1/reviews`** → [../api/content.md](../api/content.md)
- GET - List product reviews
- POST - Create review

**`/api/v1/reviews/{review_id}/replies`** → [../api/content.md](../api/content.md)
- POST - Create reply to review

---

## S

**`/sanctum/csrf-cookie`** → [../api/authentication.md](../api/authentication.md)
- GET - Get CSRF cookie (required before login)

**`/api/v1/shipping/methods`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - Get available shipping methods

**`/api/v1/shipping/providers`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - List shipping providers

**`/api/v1/shipping/webhook/{provider_code}`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- POST - Shipping webhook handler

**`/api/v1/shipping/{provider_code}/settlements/search`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - Search settlements/cities

**`/api/v1/shipping/{provider_code}/warehouses/search`** → [../api/shipping-orders.md](../api/shipping-orders.md)
- GET - Search warehouses/pickup points

**`/api/v1/site`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get SEO metadata for page

**`/api/v1/site/contacts`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get site contacts, messengers, socials

**`/api/v1/site/menus/tree`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get localized menu tree

**`/api/v1/site/pages/{slug}`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get static page by slug

**`/api/v1/system/config`** → [../api/system-seo.md](../api/system-seo.md)
- GET - Get system configuration

**`/api/v1/system/currency`** → [../api/system-seo.md](../api/system-seo.md)
- PUT - Set user currency preference

**`/api/v1/system/currencies`** → [../api/system-seo.md](../api/system-seo.md)
- GET - List available currencies

**`/api/v1/system/locale`** → [../api/system-seo.md](../api/system-seo.md)
- PUT - Set user locale preference

**`/api/v1/system/locales`** → [../api/system-seo.md](../api/system-seo.md)
- GET - List available locales

---

## V

**`/verify-email/{id}/{hash}`** → [../api/authentication.md](../api/authentication.md)
- GET - Verify email address

---

## Password/Email Change Endpoints

**`/change-email/confirm/{token}`** → [../api/authentication.md](../api/authentication.md)
- POST - Confirm email change

**`/change-email/request`** → [../api/authentication.md](../api/authentication.md)
- POST - Request email change

**`/change-password/confirm/{token}`** → [../api/authentication.md](../api/authentication.md)
- POST - Confirm password change

**`/change-password/request`** → [../api/authentication.md](../api/authentication.md)
- POST - Request password change

---

## 📊 Statistics

**Total Endpoints:** 90+
**API Files:** 9
**Average Endpoints per File:** ~10

**By Domain:**
- Authentication & Identity: 15 endpoints
- Catalog & Search: 8 endpoints
- Cart & Favorites: 12 endpoints
- Checkout & Payments: 8 endpoints
- Shipping & Orders: 8 endpoints
- Content (Blog/Comments/Reviews): 9 endpoints
- Notifications & Loyalty: 11 endpoints
- Audience & Support: 7 endpoints
- System & SEO: 12 endpoints

---

## 🔍 Search Tips

1. **By HTTP Method**
   - Most GETs are in catalog, system, SEO files
   - Most POSTs are in cart, checkout, audience files
   - PUTs are in checkout, notifications, system files
   - DELETEs are in cart, favorites, comparison files

2. **By Authentication**
   - Public: catalog, system, SEO, blog
   - Authenticated: orders, notifications, loyalty, identity
   - Guest tokens: cart, favorites, comparison
   - Mixed: checkout (cart token + optional auth)

3. **By SSR/CSR**
   - SSR: catalog, blog, system, SEO
   - CSR-only: cart, checkout, orders, notifications

---

**Navigate back:** [../README.md](../README.md)
