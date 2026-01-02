# API Contract Rules — Source of Truth

## Allowed endpoints
- Use ONLY endpoints defined in api.md.
- Never invent endpoints or parameters.

## API access
- All requests go through useApi().
- Direct fetch() in components is forbidden.

## Headers (automatic)
Accept-Language
Accept-Currency
Authorization (if logged in)
X-Guest-Id
X-Cart-Token
X-Comparison-Token

## CSRF / XSRF Rules (MANDATORY)

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

## SSR / CSR rules
- SSR: catalog, product, blog only.
- CSR: cart, checkout, favorites, comparison, profile.

## Errors
- 401 → logout
- 422 → validation handling
- Never swallow errors.
