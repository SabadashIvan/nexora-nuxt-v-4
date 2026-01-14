---
name: Documentation Support & Remaining Features (Plan v2)
scope: Phase 4 (Nuxt 4)
status: Updated per implementation review
last_updated: 2026-01-14
---

# Documentation Support & Remaining Features Plan (v2)

This document updates **Phase 4** to incorporate implementation-level recommendations from the recent architecture review (feature flags, shipping search, validation, and security-sensitive flows).

## Goals

- Finalize architectural decisions with lightweight ADRs to prevent drift and regressions.
- Make feature flags operationally useful (runtime-configurable) and consistent across SSR/CSR.
- Deliver shipping search via a secure Nitro endpoint with coalescing + short TTL cache.
- Standardize form validation with Zod (type-safe error mapping; reusable patterns).
- Complete remaining product features with consistent patterns for routing, caching, and error handling.

## Non-goals

- Changing backend contracts (unless required to support idempotency or secure token handling).
- Introducing global distributed caching (Nitro caching is best-effort per instance).
- Replacing state management or introducing a new UI framework.

---

# 4.1 ADR Creation

## Objective

Capture key technical decisions in short ADRs (1–2 pages each), committed under `docs/adr/`.

## ADRs to create (minimum set)

1. **Network Layer: API Client, Header Forwarding, Typed Errors**
2. **Cart Concurrency & Retry Policy (If-Match + Idempotency)**
3. **Optimistic UI Strategy for Cart (Transaction model + rollback policy)**
4. **Feature Flags: runtimeConfig vs build-time env (rollout semantics)**
5. **Shipping Search Endpoint Strategy (Nitro coalescing + TTL cache; provider isolation)**
6. **Secure Token/Link Flows (signed URLs; URL token stripping; logging policy)**

## Acceptance criteria

- Each ADR includes: context, decision, alternatives considered, consequences, and rollout/testing notes.
- ADRs reference concrete code entry points (files, composables, server endpoints).

---

# 4.2 Feature Flags Configuration

## Objective

Make feature flags reliable for rollout and consistent across SSR/CSR.

## Policy

- Feature flags that control functionality rollout must be **runtime configurable**:
  - Use `runtimeConfig.public.features.*` as the source of truth.
- `app.config.ts` may include **metadata** (descriptions, UI labels), but must not be the primary switch if runtime control is desired.

## Tasks

1. Define public runtime flags (example):
   - `public.features.cartOptimisticUI`
   - `public.features.serverFilters`
   - `public.features.newSeo`
2. Provide `.env.example` and README instructions:
   - local dev: `.env`
   - production: platform environment variables mapped to runtimeConfig
3. Ensure no SSR/CSR mismatch:
   - Flags read from runtimeConfig, not `process.env` directly in client code.

## Acceptance criteria

- A flag can be toggled without rebuilding when deployed in a runtime-configurable environment.
- SSR and client hydration see identical flag values.

---

# 4.3 Shipping Search Implementation

## Objective

Provide a provider-agnostic shipping search API (settlements/warehouses) via Nitro to:
- keep provider keys on server
- reduce upstream load
- standardize response shape for UI

## Server (Nitro) – required design

### 4.3.1 Endpoint design

- `GET /api/shipping/search?provider=...&type=settlements|warehouses&q=...&cityId=...`
- Validate inputs and normalize provider-specific params.
- Return a normalized payload:
  - `items: Array<{ label: string; value: string; meta?: Record<string, unknown> }>`
  - Optional raw provider fields may be included under a namespaced `providerMeta` field if truly needed.

### 4.3.2 Coalescing + TTL cache (replace “server debounce”)

Implement per-instance best-effort caching:
- `cache: Map<key, { ts, data }>`
- `inFlight: Map<key, Promise<data>>`

Algorithm:
1. Normalize request params to a stable `key`
2. If cached and within TTL (e.g., 5–30s), return cache
3. If `inFlight` exists, await that promise
4. Otherwise create promise, store in `inFlight`, call provider, then populate `cache` and delete `inFlight`

Constraints:
- Instance-local only (no shared cache across instances).
- Add max size + simple eviction (LRU optional, TTL purge required).

### 4.3.3 Security & observability

- Provider keys never leave server.
- Avoid logging raw user queries if they may contain personal data; log bounded/sanitized fields.
- Apply rate limiting if needed (per IP / per session).

## Client – recommended design

### 4.3.4 Debounce on client, not server

- Use a debounced query (e.g., `watchDebounced` or manual debounce) that triggers `refresh()`.
- Keep `useAsyncData` key stable (avoid embedding query into the key).
- Support cancellation/out-of-order responses (latest query wins).

### 4.3.5 Checkout integration

- Provider selection must not be hard-coded in composables:
  - prefer runtimeConfig or site config (multi-tenant)
- City/Warehouse composables should remain provider-agnostic and rely on the normalized response contract.

## Acceptance criteria

- Concurrent identical queries coalesce to a single provider call per instance.
- Repeated queries within TTL do not hit the provider.
- UI search is responsive, stable with rapid typing, and does not expose secrets.

---

# 4.4 Zod Form Validation

## Objective

Standardize form validation using Zod with type-safe error handling.

## Guidelines

- Separate concerns:
  - **Forms:** `app/utils/validation/forms/*`
  - **DTO/runtime boundaries:** `app/utils/validators/dto/*`
- Prefer schema-per-form with explicit input/output typing.
- Errors should preserve multiple messages per field:
  - `Record<string, string[]>` as internal representation
  - UI may choose to display first error or all errors.

## Tasks

1. Create a robust `useFormValidation` composable:
   - Constrain schemas to `ZodObject` for form object validation
   - Expose:
     - `validateAll(values)`
     - `validateField(field, values)` using `schema.pick({[field]: true})` or equivalent safe method
     - `errors` as `Record<string, string[]>`
2. Add consistent UX glue:
   - “touched” map
   - validate on submit
   - validate touched fields on change/blur
3. Add tests:
   - field-level validation
   - cross-field constraints
   - error flattening correctness

## Acceptance criteria

- No unsafe casts from `string[]` to `string`.
- Field-level validation works for all form fields without relying on non-existent `schema.shape` on non-objects.

---

# 4.5–4.13 Remaining Features

## Common implementation policies (apply to all items below)

- Filters should prefer **route query** as the source of truth (shareable URLs), not hidden store state.
- Use typed DTO → model mapping at the boundary where data enters UI/stores.
- For “fetch on init” patterns, require caching policy (TTL) to avoid per-navigation SSR churn.

---

## 4.5 Review Replies

Tasks:
- Add `replyToReview(reviewId, message)` in review store.
- Update UI to show reply thread and reply form.

Recommendations:
- Decide early whether replies are paginated or fully loaded.
- Add rate limiting / anti-spam UX (disable button while sending).

Acceptance criteria:
- Reply creation shows optimistic feedback (sending state) and handles validation errors cleanly.

---

## 4.6 Notifications Updates (All / Unread / Archived)

Tasks:
- Add filter tabs and backend query parameter integration.
- Add archive/unarchive actions.

Recommendations:
- Source of truth for filter: `route.query.filter`.
- Ensure “Unread count” is consistent after archiving.

Acceptance criteria:
- Navigating with URL preserves filter state and is link-shareable.

---

## 4.7 Orders Updates (Statuses, Filters, Details)

Tasks:
- Display status mapping, add filters, extend order details view.

Recommendations:
- Maintain a strict status mapping table (backend status → UI label/color/icon).
- Provide fallback rendering for unknown statuses.

Acceptance criteria:
- Unknown/new backend statuses do not break UI.

---

## 4.8 Loyalty Points

Tasks:
- Fetch points summary and render history.

Recommendations:
- Define formatting rules (points vs currency; pending vs available).
- Cache summary (short TTL) to reduce repeated calls.

Acceptance criteria:
- History pagination works and totals are consistent.

---

## 4.9 Site Contacts

Tasks:
- Fetch site contacts and render.

Recommendations:
- Avoid unconditional “app init fetch” in SSR for every request.
- Implement caching (server or client) with TTL; include i18n considerations if applicable.

Acceptance criteria:
- Contacts load reliably without causing extra requests on every navigation.

---

## 4.10 Customer Support Types

Tasks:
- Fetch support types and add dropdown to support form.

Recommendations:
- Graceful fallback if types fail to load:
  - show “General” or hide dropdown.

Acceptance criteria:
- Support submission works even if types endpoint is unavailable.

---

## 4.11 Blog Sort

Tasks:
- Add sort options.

Recommendations:
- Persist sort to `route.query.sort`.

Acceptance criteria:
- Sort is shareable via URL and survives refresh.

---

## 4.12 Payments API Updates

Tasks:
- Update endpoints and payloads.
- Ensure payment initiation is safe from double-submit.

Recommendations:
- Mark payment-init requests as `idempotent: true`.
- Add UI guards for double click and refresh/retry scenarios.
- Add an E2E test for accidental double-submit.

Acceptance criteria:
- Repeated initiation does not create duplicate payment sessions.

---

## 4.13 Audience Signed URL Flows

Objective:
Handle signed links securely without leaking tokens to logs/referrers or persisting them.

Recommendations:
- Treat processing as **client-first** unless SSR is required.
- After token consumption, immediately remove token from URL:
  - `navigateTo(cleanUrl, { replace: true })` or `history.replaceState`
- Do not store tokens in Pinia; keep in local scope and discard.
- Ensure analytics and error logs do not capture the raw token.

Acceptance criteria:
- Token is removed from the address bar after processing.
- No token is persisted in storage or state.

---

# Implementation Order (recommended)

1. 4.1 ADRs (including feature flags + shipping search + secure links)
2. 4.2 Feature flags migration to runtimeConfig
3. 4.3 Shipping search (server coalescing + client debounce) and checkout integration
4. 4.4 Zod validation composable + initial form migrations
5. 4.12 Payments API updates (idempotency + E2E)
6. 4.13 Signed URL flows (token stripping + logging policy)
7. 4.5–4.11 remaining features (parallelizable, follow common policies)

---

# Test Checklist

## Shipping search
- Coalescing: N identical concurrent requests → 1 upstream call per instance
- TTL cache: repeated requests within TTL do not hit provider
- Input validation: invalid params return safe error
- Security: no provider keys in client bundle; no token leakage in logs

## Validation
- Field-level validation returns correct per-field error arrays
- Form-level validation supports cross-field constraints

## Payments
- Double-submit protection works (UI + idempotent backend call)
- E2E: repeated actions do not create duplicate payment sessions

## Signed URLs
- Token removed from URL after processing
- No token stored in state or localStorage
- No token present in analytics payloads (where applicable)

## Feature flags
- SSR/CSR consistent values
- Toggle does not require rebuild in runtime-configured deployment
