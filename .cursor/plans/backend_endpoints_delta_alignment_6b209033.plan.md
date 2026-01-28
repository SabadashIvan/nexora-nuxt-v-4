---
name: Backend Endpoints Delta Alignment
overview: Align frontend documentation and code with the backend API spec by updating endpoint documentation, fixing code mismatches, and implementing new endpoints identified in the delta document.
todos:
  - id: doc-new-endpoints
    content: Add new endpoints to endpoint-index.md and domain-specific API docs (site/locations, catalog/recommendations, checkout/loyalty, identity/genders, identity/profile, comments PATCH/DELETE)
    status: completed
  - id: doc-fix-mismatches
    content: "Fix documentation mismatches: categories/{idOrSlug}, cart/v method, remove deprecated endpoints (products, shipping/providers, system/*, health)"
    status: completed
  - id: code-fix-useapi
    content: Remove or update useApi coalesce logic for /catalog/products (line 126)
    status: completed
  - id: code-verify-cart-attach
    content: Verify cart/attach endpoint existence and fix/remove usage in cart.store.ts if needed
    status: completed
  - id: impl-checkout-loyalty
    content: Implement checkout loyalty points (apply/remove) in checkout store and UI
    status: completed
  - id: impl-catalog-recommendations
    content: Implement catalog recommendations (You may also like) on product pages
    status: completed
  - id: verify-backend
    content: "Verify backend endpoints: cart/v method, cart/attach, change-email flow, system/* endpoints"
    status: pending
  - id: update-checkout-flow
    content: Update checkout-flow.md to include loyalty points step
    status: completed
isProject: false
---

# Backend Endpoints Delta Alignment Plan

This plan addresses all items in `ai/operations/backend-endpoints-delta.md` to align frontend documentation and code with the backend API specification.

## Overview

The plan covers:

1. **Documentation Updates** - Add new endpoints, fix mismatches, remove deprecated entries
2. **Code Fixes** - Remove/update incorrect endpoint usage, fix coalesce logic
3. **New Implementations** - Add support for new endpoints (loyalty, recommendations, etc.)

## Phase 1: Documentation Updates

### 1.1 Add New Endpoints to Documentation

**File: `ai/reference/endpoint-index.md**`

- Add `/api/v1/site/locations` (GET) → system-seo.md (store locations, not SEO)
- Add `/api/v1/catalog/recommendations/variants` (GET) → catalog.md
- Add `/api/v1/checkout/{id}/loyalty` (POST, DELETE) → checkout-payments.md
- Add `/api/v1/identity/genders` (GET) → authentication.md
- Add `PUT /api/v1/identity/me/profile` → authentication.md
- Add `PATCH /api/v1/comments/{id}` and `DELETE /api/v1/comments/{id}` → content.md

**File: `ai/api/system-seo.md**`

- **Note**: `/api/v1/site/locations` and `/api/v1/site/contacts` are **NOT SEO-related** - they are store/contact information
- Move `/api/v1/site/locations` and `/api/v1/site/contacts` out of "SEO API" section
- Create separate "Site API" section (or move to "System API" section) for:
  - `/api/v1/site/locations` (GET) - Physical store locations
  - `/api/v1/site/contacts` (GET) - Shop working contacts (phone, email, hours)
- Update file description to clarify these are site/store endpoints, not SEO
- Document response format and caching behavior for locations endpoint

**File: `ai/api/catalog.md**`

- Add section for `/api/v1/catalog/recommendations/variants` endpoint (GET)
- Document query parameters (likely variant_id, limit, etc.)
- Add to "Product Recommendations" or new section

**File: `ai/api/checkout-payments.md**`

- Add section for `/api/v1/checkout/{id}/loyalty` endpoints:
  - `POST /api/v1/checkout/{id}/loyalty` - Apply loyalty points
  - `DELETE /api/v1/checkout/{id}/loyalty` - Remove loyalty points
- Document request/response formats
- Add to checkout flow documentation

**File: `ai/api/authentication.md**`

- Add section for `/api/v1/identity/genders` (GET) - List available genders
- Add section for `PUT /api/v1/identity/me/profile` - Update user profile
- Document request/response formats

**File: `ai/api/content.md**`

- Add sections for:
  - `PATCH /api/v1/comments/{id}` - Update comment
  - `DELETE /api/v1/comments/{id}` - Delete comment
- Document authorization rules (only author can edit/delete)

**File: `ai/flows/checkout-flow.md**`

- Add loyalty points step to checkout flow
- Document when to apply/remove loyalty points
- Update flow diagram if present

### 1.2 Fix Documentation Mismatches

**File: `ai/reference/endpoint-index.md**`

- Update `GET /api/v1/catalog/categories/{slug}` → `GET /api/v1/catalog/categories/{idOrSlug}` (accepts both ID and slug)
- Update `HEAD /api/v1/cart/v` → `GET /api/v1/cart/v` (verify with backend first - YAML shows GET but description mentions HEAD)
- Remove or mark N/A: `/api/v1/shipping/providers` (not in backend)
- Remove or mark N/A: `/api/v1/catalog/products` (backend uses variants only)
- Remove or mark N/A: `/api/v1/health`, `/api/v1/system/config`, `/api/v1/system/currency`, `/api/v1/system/currencies`, `/api/v1/system/locale`, `/api/v1/system/locales` (verify existence first)

**File: `ai/api/catalog.md**`

- Update `GET /api/v1/catalog/categories/{slug}` → `GET /api/v1/catalog/categories/{idOrSlug}`
- Remove or deprecate `/api/v1/catalog/products` section (backend uses `/catalog/variants` only)
- Add note that products endpoint is deprecated/not available

**File: `ai/api/cart-favorites.md**`

- Verify and update `POST /api/v1/cart/attach` documentation (check if endpoint exists in backend)
- If endpoint doesn't exist, mark as deprecated or remove

**File: `ai/api/system-seo.md**`

- **Reorganize sections**: Separate Site endpoints from SEO endpoints
  - Move `/api/v1/site/locations` (store locations) and `/api/v1/site/contacts` (shop contacts) to "Site API" section, not "SEO API"
  - Keep SEO endpoints (metadata, menus, static pages) in "SEO API" section
- Remove or mark N/A system endpoints that don't exist:
  - `GET /api/v1/system/config`
  - `PUT /api/v1/system/currency`
  - `GET /api/v1/system/currencies`
  - `PUT /api/v1/system/locale`
  - `GET /api/v1/system/locales`
- Keep only `/app/languages` and `/app/currencies` which are confirmed to exist
- Update file title/description to clarify: "System, Site & SEO API" or similar

**File: `ai/api/shipping-orders.md**`

- Remove or mark N/A `GET /api/v1/shipping/providers` (not in backend YAML)

**File: `ai/api/authentication.md**`

- Verify and document correct change-email flow:
  - Backend: `GET /change-email/{id}/{hash}` (signed URL redirect)
  - Frontend currently uses: `POST /change-email/confirm/{token}`
  - Align documentation with actual backend implementation

## Phase 2: Code Fixes

### 2.1 Fix useApi Coalesce Logic

**File: `app/composables/useApi.ts**`

- **Line 126**: Remove or update `shouldCoalesceRequest` function
  - Current: `requestPath.startsWith('/api/v1/catalog/products')`
  - Action: Remove this coalesce logic OR change to `/api/v1/catalog/variants` if coalescing is still needed
  - Since backend doesn't have `/catalog/products`, this coalesce is never triggered

### 2.2 Verify and Fix Cart Attach

**File: `app/stores/cart.store.ts**`

- **Line 823**: Verify if `POST /cart/attach` endpoint exists in backend
- If endpoint doesn't exist:
  - Remove `attachCart` method or replace with alternative flow
  - Update any callers of `attachCart`
  - Check if cart merging happens automatically on login

### 2.3 Fix Catalog Categories Usage

**File: `app/` (any files using catalog categories)**

- Verify current usage of `/catalog/categories/{slug}` works with `{idOrSlug}`
- Update type definitions if needed to accept both string (slug) and number (id)

## Phase 3: New Endpoint Implementations

### 3.1 Checkout Loyalty Points

**File: `app/stores/checkout.store.ts**`

- Add actions:
  - `applyLoyaltyPoints(checkoutId: number, points: number)` - POST `/api/v1/checkout/{id}/loyalty`
  - `removeLoyaltyPoints(checkoutId: number)` - DELETE `/api/v1/checkout/{id}/loyalty`
- Update checkout state to track loyalty points applied
- Handle loyalty points in pricing calculations

**File: `app/pages/checkout.vue**`

- Add UI for loyalty points:
  - Display available loyalty points
  - Input field to specify points to apply
  - Button to apply/remove loyalty points
  - Show discount/credit from loyalty points in pricing summary

### 3.2 Catalog Recommendations

**File: `app/stores/catalog.store.ts` or new `product.store.ts**`

- Add action: `getRecommendedVariants(variantId: number, limit?: number)` - GET `/api/v1/catalog/recommendations/variants`
- Store recommended variants in state

**File: `app/pages/product/[slug].vue` or product component**

- Add "You may also like" or "Recommended products" section
- Fetch recommendations using variant ID
- Display recommended variants with links to product pages

### 3.3 Identity Extensions (Optional - Only if UI exists)

**File: `app/stores/auth.store.ts` or new `identity.store.ts**`

- Add action: `getGenders()` - GET `/api/v1/identity/genders` (only if profile forms need it)
- Add action: `updateProfile(data: ProfileUpdateData)` - PUT `/api/v1/identity/me/profile` (only if profile edit UI exists)

**File: Profile edit pages/components (if they exist)**

- Add gender dropdown using `/api/v1/identity/genders`
- Add profile update form using `PUT /api/v1/identity/me/profile`

### 3.4 Comment Edit/Delete (Optional - Only if feature is planned)

**File: `app/stores/comments.store.ts` or content store**

- Add actions:
  - `updateComment(commentId: number, text: string)` - PATCH `/api/v1/comments/{id}`
  - `deleteComment(commentId: number)` - DELETE `/api/v1/comments/{id}`
- Add authorization checks (only author can edit/delete)

**File: Comment components**

- Add edit/delete buttons (only visible to comment author)
- Add edit form/modal
- Handle delete confirmation

## Phase 4: Verification Tasks

### 4.1 Backend Verification

Before making changes, verify with backend:

1. **Cart version endpoint**: Is it GET or HEAD? (YAML shows GET but description says HEAD)
2. **Cart attach**: Does `POST /api/v1/cart/attach` exist? If not, how does cart merging work on login?
3. **Change-email confirm**: Which flow is correct - redirect URL or POST with token?
4. **System endpoints**: Do `/api/v1/system/*` and `/api/v1/health` exist or should they be removed?

### 4.2 Testing

After implementation:

- Test all new endpoints with actual API calls
- Verify error handling for new endpoints
- Test loyalty points flow in checkout
- Test recommendations display on product pages
- Verify comment edit/delete authorization

## Implementation Order

1. **Documentation updates** (Phase 1) - Can be done immediately
2. **Code fixes** (Phase 2) - Fix existing issues
3. **Backend verification** (Phase 4.1) - Verify mismatches before fixing
4. **New implementations** (Phase 3) - Add new features
5. **Testing** (Phase 4.2) - Verify everything works

## Files to Modify

### Documentation Files

- `ai/reference/endpoint-index.md`
- `ai/api/system-seo.md`
- `ai/api/catalog.md`
- `ai/api/checkout-payments.md`
- `ai/api/authentication.md`
- `ai/api/content.md`
- `ai/api/cart-favorites.md`
- `ai/api/shipping-orders.md`
- `ai/flows/checkout-flow.md`

### Code Files

- `app/composables/useApi.ts`
- `app/stores/cart.store.ts`
- `app/stores/checkout.store.ts` (or create if doesn't exist)
- `app/stores/catalog.store.ts` or `product.store.ts`
- `app/pages/checkout.vue`
- `app/pages/product/[slug].vue` or product component
- Comment-related stores/components (if comment edit/delete is implemented)
- Profile-related stores/components (if identity extensions are implemented)

## Notes

- **Important**: `/api/v1/site/locations` and `/api/v1/site/contacts` are **NOT SEO-related**:
  - `/api/v1/site/locations` = Physical store locations (addresses, hours, phones for each store)
  - `/api/v1/site/contacts` = Shop working contacts (main phone, email, working hours, messengers, socials)
  - These should be in a "Site API" section, separate from "SEO API" section in system-seo.md
- Some implementations (identity extensions, comment edit/delete) are marked as optional and should only be implemented if the UI/feature is planned
- Backend verification is critical for mismatches - don't assume, verify first
- The `/api/v1/catalog/products` endpoint should be completely removed from docs and code since backend only uses variants
- Cart attach endpoint needs verification - it may not exist and cart merging might happen automatically

