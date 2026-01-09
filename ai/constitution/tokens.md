# Token & Security Model — Source of Truth

## Authentication Model
**SPA Authorization via Laravel Sanctum (Cookie-Based)**

- Authentication is session-based via HTTP-only cookies
- Frontend MUST NOT use Bearer tokens
- Authorization header is NOT required for authenticated requests
- CSRF protection is mandatory
- Session cookies are automatically attached by useApi() composable

## Token types
- **Session cookies** (HTTP-only, secure) - for authenticated users (Laravel Sanctum)
- **X-Guest-Id** - for favorites (guest token)
- **X-Cart-Token** - for cart and checkout (guest token)
- **X-Comparison-Token** - for comparison (guest token)

## Storage rules
- **Session cookies**: HTTP-only, secure cookies (managed by Laravel Sanctum, automatically attached by useApi())
- **Guest tokens**: localStorage (CSR) + cookies (SSR fallback)
  - X-Guest-Id: localStorage + cookies
  - X-Cart-Token: localStorage + cookies
  - X-Comparison-Token: localStorage + cookies

## SSR safety
- Never expose session cookies in HTML
- Never run cart or checkout logic on server
- Guest tokens can be read from cookies during SSR for middleware initialization

## Store dependencies
- cart, checkout → X-Cart-Token (CSR only)
- favorites → X-Guest-Id (CSR only)
- comparison → X-Comparison-Token (CSR only)
- auth, orders → Session cookies (HTTP-only, automatically attached)
