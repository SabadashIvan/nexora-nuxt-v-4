---
name: Cart Checkout Refactoring & Performance Optimization (Plan v2)
scope: Phase 2–3 (Nuxt 4)
status: Updated per implementation review
last_updated: 2026-01-14
---

# Cart Checkout Refactoring & Performance Optimization Plan (v2)

This document updates **Phase 2–3** to incorporate implementation-level guidance for Nuxt 4, the current `cart.store.ts` / `checkout.store.ts` direction, and the network/auth foundation work from earlier phases.

## Goals

- Reduce coupling between domain stores (cart/checkout) and transport concerns (headers, retries, concurrency recovery).
- Improve UX and perceived performance with safe, controlled **optimistic UI** for cart operations.
- Improve maintainability of checkout flows by decomposing orchestration into composables with clear responsibility boundaries.
- Improve rendering and performance via SEO composables, safer server-side aggregation for search, and an experimental server-components approach behind a feature flag.

## Non-goals

- Redesign of backend API contracts.
- Introducing a global distributed cache (Nitro coalescing is best-effort per instance).
- Replacing the state management library (Pinia remains).

## Key architectural decisions (must be finalized before implementation)

### A. Concurrency & If-Match scope

**Default:** `If-Match` is injected automatically **only** for `/api/v1/cart/**` mutations.

**Decision point:** If checkout endpoints also require `If-Match`, explicitly extend the scope in the network layer (allowlist), e.g. `/api/v1/checkout/**` and/or specific endpoints. Avoid per-store manual `If-Match` injection.

Acceptance criteria:
- No store action manually sets `If-Match`.
- Scope is enforced centrally and covered by tests.

### B. Safe retries (409/419) require idempotency

- 409 retry is permitted **only** if the request is idempotent and an `Idempotency-Key` exists for the entire retry lifecycle.
- All cart mutation calls must set `idempotent: true` (or be auto-marked idempotent by route pattern in the network layer).
- Never retry non-replayable bodies (FormData/streams).

Acceptance criteria:
- 409 without idempotency produces a typed concurrency error (no retry).
- 409 with idempotency triggers refresh + replay (bounded attempts).

### C. Feature flags must support runtime control

Prefer `runtimeConfig.public.features.*` over build-time `process.env` when the intent is rollout control without rebuild.

---

# Phase 2: Cart & Checkout (Clean Architecture)

## 2.1 Store Cleanup (Cart)

### Objective

Refactor `cart.store.ts` to be domain-focused:
- state management
- domain commands
- mapping typed errors to UI state

Transport responsibilities move to the network layer:
- `If-Match`, `Idempotency-Key`, token headers
- retry and concurrency recovery

### Tasks

1. **Remove transport logic from cart store**
   - Remove manual `If-Match` creation and any `ensureCartVersion()` / `fetchCartVersion()`-style routines.
   - Remove manual retry loops and catch-branches that retry by status code.

2. **Define a minimal cart store public API**
   - `fetchCart()`
   - mutation methods (`addItem`, `updateQuantity`, `removeItem`, `applyCoupon`, …)
   - `setCart(cart)` / `setCartVersion(version)` (optional, only if the network layer needs a setter)

3. **Centralize concurrency/version updates**
   Choose one:
   - **Option 1 (recommended):** Network layer updates store via a tiny injected adapter (`nuxtApp.$cartConcurrency.setVersion(v)` or store action).
   - **Option 2:** Network layer stores version independently (store never touched).

4. **Enforce idempotency for cart mutations**
   - Each mutation call uses `idempotent: true` (or is automatically treated as such by URL scope).

### Acceptance criteria

- `cart.store.ts` contains no direct header manipulation (`If-Match`, `Idempotency-Key`).
- `cart.store.ts` contains no retry logic driven by HTTP status codes.
- All cart mutations are idempotent by policy.
- E2E: add/update/remove flows work under normal conditions and under simulated 409 conflicts.

---

## 2.2 Optimistic UI with Rollback (Cart)

### Objective

Improve UX by applying optimistic cart updates for supported operations, with correct rollback on concurrency/validation failures.

### Feature flag

- `public.features.cartOptimisticUI: boolean` (runtimeConfig)

### Supported operations (initial set)

- Update quantity
- Remove item
- Add item (only if item identity mapping is implemented)

### Implementation approach

1. **Avoid shallow snapshot rollback**
   - Do not use `{ ...cart }` snapshots.
   Use one of:
   - `structuredClone(cart)` (preferred where available), or
   - a vetted deep clone utility, or
   - transaction-based patch application (recommended for concurrency correctness).

2. **Transaction-based optimistic layer (recommended)**
   Maintain a small in-store optimistic manager:
   - `pendingOps: Array<{ opId, apply(cart), revert(cart), status }>`
   - Apply optimistic changes immediately.
   - On server success, replace cart state with server response and drop the op.
   - On rollback-eligible error, revert only the relevant op (or reset from last confirmed server cart and re-apply remaining ops).

3. **Concurrency & ordering safety**
   - Ensure multiple rapid actions do not cause full-cart rollback oscillations.
   - Handle out-of-order responses safely:
     - Either serialize cart mutations (simple, conservative), or
     - Allow parallelism but reconcile using op queue.

4. **Error-driven rollback policy**
   Rollback on:
   - Concurrency error (409 / typed concurrency event)
   - Validation/business rule error (422 / typed validation)

   Do **not** automatically rollback on transient network errors unless explicitly defined (avoid “jumping cart”).

5. **Item identity mapping**
   For `addItem` optimistic mode:
   - Use an `opId` (clientMutationId) and reconcile temp IDs with server IDs after response.
   - If API cannot echo opId, restrict optimistic add to cases where the item can be deterministically matched.

### Acceptance criteria

- Optimistic updates are visible immediately under the flag.
- On 409 / 422, cart returns to a consistent state and user gets a clear notification.
- Rapid consecutive updates produce stable UI (no full-cart flicker).
- No retries occur for non-replayable bodies.

---

## 2.3 Checkout Refactoring (Composable-driven orchestration)

### Objective

Split checkout orchestration into composables to reduce store size and improve testability.

### Target structure

- `useCheckoutSession()`
  - start/restart session
  - advance status machine (address → shipping → payment → confirm)
  - applyAddress / applyShippingMethod / applyPayment / confirm
- `useCheckoutDelivery()`
  - fetch shipping methods by selected destination
  - encapsulate loading/error state for shipping selection
- Optional (if applicable)
  - `useCheckoutCity()`, `useCheckoutWarehouse()` (search and selection logic)

### Rules

- Stores should hold state and offer simple setters/actions.
- Composables perform orchestration and manage field-level loading state, debounce/cancellation, and UI-centric concerns.
- Avoid composable-to-composable hidden coupling:
  - pass `selectedCityId` explicitly, or read from store as single source of truth.

### If-Match decision applied to checkout

- If checkout endpoints require concurrency control, extend the network layer allowlist and remove all manual `If-Match` injection in checkout store/composables.

### Acceptance criteria

- `checkout.store.ts` is reduced to state + thin actions (or state + minimal commands).
- UI components depend on composables, not on store internals.
- Checkout still supports:
  - partial completion resume (if supported by backend),
  - clear handling of domain errors (invalid shipping/payment/cart changed).

---

# Phase 3: Rendering & Performance

## 3.1 SEO Migration (from SEO store to composables)

### Objective

Replace imperative SEO store updates with `useSeoMeta()` (and schema org helpers if used) to reduce state complexity and improve SSR correctness.

### Tasks

1. Replace SEO store calls with:
   - `useSeoMeta({ title, description, ogTitle, ... })`
2. If schema.org is used:
   - adopt a dedicated solution (e.g., schema composables) and define a uniform pattern per page type.

### Acceptance criteria

- SSR view-source includes correct meta on first render.
- Client-side navigation updates meta correctly.
- No SEO Pinia store dependency remains.

---

## 3.2 Nitro Search Coalescing & Cache (replaces “server debounce”)

### Why “debounce” in HTTP handlers is not enough

HTTP request/response semantics make lodash-style debounce unreliable, especially if the debounce function is created per-request.

### Objective

Reduce upstream provider load by:
- **coalescing in-flight identical requests** (single upstream call shared by many clients)
- **short TTL caching** for repeated requests

### Implementation outline

- `cache: Map<key, { ts, data }>`
- `inFlight: Map<key, Promise<data>>`
- On request:
  1. Normalize params to a stable `key`
  2. Return cached response if within TTL
  3. If `inFlight` exists, await it
  4. Otherwise create a promise, store in `inFlight`, call provider, then populate `cache` and delete `inFlight`

Constraints:
- Instance-local only (best effort).
- TTL should be small (e.g., 5–30s) unless business rules allow longer.

Acceptance criteria:
- Load test with N identical concurrent requests results in 1 upstream call per instance.
- Provider keys are never exposed to the client.

---

## 3.3 Server Components (experimental, behind a feature flag)

### Objective

Reduce client JS and move heavy, non-interactive work server-side while preserving interactive filter UI.

### Policy

- Must be behind a feature flag (runtimeConfig).
- Must have a fast fallback to client rendering.

### Implementation approach

- Use `.server.vue` for non-interactive sections that can be computed server-side.
- Keep interactive filters in client components; use `useFetch()` for filtered data updates.
- Avoid hydration mismatches:
  - clearly separate server-only content from client-interactive regions
  - validate rendering with SSR + CSR navigation

### Acceptance criteria

- No hydration mismatch warnings in console.
- Measurable reduction in client bundle / JS execution for target pages.
- Feature flag toggling safely switches between modes.

---

# Implementation Order (recommended)

1. Phase 2.1 Store Cleanup (Cart)
2. Phase 2.3 Checkout composables refactor (parallelizable with 2.2 once stable)
3. Phase 3.2 Nitro coalescing + TTL cache
4. Phase 2.2 Optimistic UI (after network/error taxonomy is fully stable)
5. Phase 3.1 SEO migration
6. Phase 3.3 Server components (experimental last)

---

# Testing Checklist (must-have)

## Cart

- SSR: no cookie/header leakage between concurrent users (fetch instance isolation).
- Concurrency:
  - 409 with idempotency → refresh + bounded replay succeeds when possible
  - 409 without idempotency → typed error, no replay
- Optimistic:
  - rapid consecutive mutations (out-of-order responses) end in consistent state
  - rollback on concurrency/validation; no rollback on unrelated transient failures unless policy says so

## Checkout

- Full checkout happy path
- Invalid shipping/payment and cart-changed flows
- If checkout uses If-Match: verify allowlist scope and no manual headers in store/composables

## Nitro

- Coalescing: N identical concurrent requests → 1 upstream call per instance
- TTL: repeat queries hit cache within TTL; expire correctly

## SEO

- SSR meta present and correct
- Client navigation updates meta correctly

---

# Dependencies

- Network foundation and typed error taxonomy must be complete before 2.1/2.2.
- If-Match scope decision (cart-only vs cart+checkout) must be made before refactoring checkout.
