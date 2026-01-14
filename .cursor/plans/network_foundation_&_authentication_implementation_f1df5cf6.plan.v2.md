---
name: Network Foundation & Authentication Implementation
overview: Implement Phase 0 (Network Layer & Error Taxonomy) and Phase 1 (Authentication & Global Logic) to establish a robust foundation with automatic concurrency control, error handling, and complete authentication flow including OAuth.
todos: []
---

# Network Foundation & Authentication Implementation Plan

This plan implements Phases 0-1 from the API implementation plan, establishing a smart network layer with automatic concurrency control and complete authentication system.

## Phase 0: Network & Error Taxonomy

### 0.1 Ofetch Instance Refactoring

#### 0.1.x SSR Forwarded Headers: Minimal Set

Forward only what the backend truly requires.

**Implementation Tasks:**
- [ ] Always forward: `cookie`
- [ ] Forward `accept-language` only if the backend uses it for localization (menus/content). Otherwise omit.
- [ ] Forward `user-agent` only if the backend uses it for device logic/analytics. Otherwise omit.
- [ ] Do not forward unrelated headers by default (principle of minimal disclosure).



#### 0.1.x SSR Instance Isolation (MUST)

**Requirement:** Do **not** create a module-scope (singleton) `$fetch` / ofetch client on the server.  
All SSR requests must use a **per-request/per-call** instance to prevent cookie/header/context leakage between users.

**Implementation Tasks:**
- [ ] Ensure `$fetch.create()` is invoked **inside** `useApi()` (function scope), not at file/module scope.
- [ ] If you cache the client, cache it **only** inside the current Nuxt request context (e.g., on `nuxtApp`), never globally.
- [ ] Add a code comment / ADR note explaining why server singletons are forbidden (multi-user SSR leakage risk).


**Goal:** Refactor `useApi.ts` to use `$fetch.create()` for centralized configuration and interceptors with SSR cookie forwarding.

**Files to Modify:**

- `app/composables/useApi.ts` - Complete refactor to use `$fetch.create()`

**Implementation Steps:**

1. Replace current `$fetch` calls with `$fetch.create()` instance
2. Move base configuration (baseURL, headers) to ofetch instance
3. **Set `credentials: 'include'` in base configuration** for cookie handling
4. Add `onRequest` interceptor for automatic header management:

   - **If-Match Scope Rule:** Auto-add `If-Match` header ONLY for:
     - URLs matching `/api/v1/cart/**` (cart mutations)
     - Additional routes (if needed, explicitly list them)
     - Non-GET requests when `cartVersion` exists
     - Do NOT add `If-Match` for other endpoints
   - Auto-add `Idempotency-Key` when `options.idempotent` is true
   - **SSR Header Forwarding (server-side only):**
     - Use `useRequestHeaders(['cookie'])` to forward cookies; forward `accept-language`/`user-agent` only if the backend requires them
     - Forward only required headers (cookie always; `accept-language` for localization if used; `user-agent` only if needed)
     - Avoid leaking hop-by-hop headers
     - Only apply on server-side (check `import.meta.server`)

5. **SSR Instance Isolation (CRITICAL):**

   - **FORBIDDEN:** Server-side singleton $fetch client
   - **REQUIRED:** Per-request/per-call instance creation on server
   - Create new ofetch instance for each SSR request to prevent state leakage
   - Client-side: Can use singleton (safe in browser)
   - Implementation: Check `import.meta.server` and create instance per request context

6. Add `onResponseError` interceptor for automatic retry (placeholder for Phase 0.2)
7. Maintain backward compatibility with existing API calls
8. Preserve SSR/CSR handling and cookie management
9. **Fetch Context Preservation:**

   - Call `const nuxtApp = useNuxtApp()` at the start of `useApi()` function (synchronous context)
   - Use `nuxtApp` reference inside interceptors (not calling `useNuxtApp()` in async callbacks)
   - Access injected logger/sentry/runtime via `nuxtApp` reference

**Key Changes:**

- Create ofetch instance with `baseURL` from runtime config
- Set `credentials: 'include'` in base configuration
- Move header building logic to `onRequest` hook
- **If-Match scope:** Only for `/api/v1/cart/**` routes (explicitly scoped)
- **SSR instance isolation:** Per-request instances on server (no singleton)
- **SSR cookie forwarding** to prevent "new session" issues on backend
- Keep existing token management (cart, guest, comparison)
- Maintain CSRF token handling

**SSR Cookie Forwarding Rationale:**

Without proxying cookies during SSR, the backend sees a "new" session, and any cookie-auth logic fails. Forwarding cookies ensures session continuity between SSR and CSR.

### 0.2 Ofetch Hardening with Retry Strategy

#### 0.2.x Cart Retry Safety Contract (MUST)

To make `409 Conflict` retries safe, the project must adopt a **single explicit contract**:

**Contract (recommended):** All **cart mutations** MUST be sent with `idempotent: true` so the `Idempotency-Key` is always present for the entire retry cycle.

**Implementation Tasks:**
- [ ] Enforce `idempotent: true` for all cart mutation calls (`POST/PATCH/DELETE /api/v1/cart/**`).
- [ ] Prefer centralized enforcement in `useApi()`: if URL matches `/api/v1/cart/**` and method != `GET`, auto-set `options.idempotent = true` (unless explicitly overridden).
- [ ] In the retry strategy: allow `409` retry for cart mutations **only if** `Idempotency-Key` is present; otherwise throw `ConcurrencyEvent` immediately.
- [ ] Document this contract in ADR 002 (Cart Concurrency) and in the cart store code comments.



#### 0.2.x Fetch Options Cloning Rules (MUST)

When re-invoking the request for retry, ensure fetch options are cloned safely to avoid mutation bugs.

**Implementation Tasks:**
- [ ] When cloning `options`, clone `headers` separately (deep copy) to prevent shared references across attempts.
- [ ] Avoid retry for `FormData`, streams, or non-replayable bodies (keep as a hard rule).


**Goal:** Implement automatic retry logic for 409 (cart version) and 419 (CSRF) errors with persistent Idempotency-Key using manual re-invoke (not relying on ofetch's built-in retry).

**Files to Modify:**

- `app/composables/useApi.ts` - Add retry logic to `onResponseError` interceptor
- `app/stores/cart.store.ts` - Remove manual retry logic (Phase 2 cleanup)

**Implementation Steps:**

1. **Create `retryRequest()` helper function:**

   - Re-invoke the same ofetch instance with original request + options
   - Do NOT rely on ofetch's built-in `retry()` method (may not exist or behave unexpectedly)
   - Manually call the ofetch instance again with updated headers/options
   - **Important:** Use `structuredClone()` or object spread (`{ ...options }`) to create new options object
   - Prevents mutation of retry counters for parallel requests

2. **Cart Retry Safety Rule (409 Conflict Retry):**

   - **CRITICAL:** 409 retry for cart mutations ONLY allowed if `Idempotency-Key` is present
   - **Alternative rule:** All cart mutations MUST set `idempotent: true` (enforced in Phase 0.1)
   - Detect 409 status in `onResponseError`
   - Check if request URL matches `/api/v1/cart/**` AND has `Idempotency-Key`
   - If no `Idempotency-Key` for cart mutation → throw error immediately (no retry)
   - Track retry count separately: `options._retry409Count` (default: 0)
   - If `options._retry409Count < 3` AND `Idempotency-Key` exists:
     - Fetch latest cart version via `cartStore.fetchCart()`
     - Increment `_retry409Count`
     - Re-invoke request with new `If-Match` header using `retryRequest()`
   - Hard stop at 3 attempts (prevents infinite loops)

3. **419 CSRF Retry (max 1 attempt):**

   - Detect 419 status in `onResponseError`
   - Track retry count separately: `options._retry419Count` (default: 0)
   - If `options._retry419Count < 1`:
     - Refresh CSRF token via `fetchCsrfCookie()`
     - Increment `_retry419Count`
     - Re-invoke request using `retryRequest()`

4. **Separate Retry Counters:**

   - Use `_retry409Count` and `_retry419Count` separately (not combined)
   - Prevents cross-contamination between different error types

5. **Idempotency-Key Persistence:**

   - Store `Idempotency-Key` in `options._idempotencyKey` on first request
   - Reuse same key for all retries in the cycle
   - Generate new UUID only if key doesn't exist

6. **Request Body Retry Constraint:**

   - **CRITICAL:** Retry applies ONLY to JSON body requests
   - Do NOT retry requests with:
     - Streams (ReadableStream, Blob streams)
     - FormData (multipart/form-data)
     - File uploads
     - Binary data
   - Reason: Retry may be impossible (stream already consumed) or dangerous (duplicate uploads)
   - Check `options.body` type before retry:
     - If `body instanceof FormData` → no retry
     - If `body instanceof ReadableStream` → no retry
     - If `body instanceof Blob` → no retry
     - Only retry if `body` is plain object/string (JSON)

7. **Retry Meta Contract:**

   - Formally define internal meta as part of API client contract
   - Type the retry meta in TypeScript:
     ```typescript
     interface ApiFetchOptions extends FetchOptions {
       idempotent?: boolean
       _retry409Count?: number
       _retry419Count?: number
       _idempotencyKey?: string
     }
     ```

   - Document that these are internal implementation details
   - Do NOT expose to external API consumers
   - Use for retry logic only

8. **No Retry Rule:**

   - Do NOT retry non-idempotent mutations unless `options.idempotent === true`
   - Only retry safe operations (GET) or explicitly idempotent mutations

9. **Retry Logging Policy:**

   - **Development:** Use `logger.debug` for all retry attempts
   - **Production:**
     - 409 retry: Log to Sentry breadcrumbs (not console spam)
     - 419 retry: Log to Sentry breadcrumbs
     - Add rate limiting for logs (prevent Sentry flooding during bad internet)
   - Log: request URL, attempt number, max retries, success/failure
   - Create logger abstraction with environment-based level

**Dependencies:**

- Phase 0.1 (ofetch instance)
- Phase 0.3 (error taxonomy for proper error handling)
- Cart store (for version refresh)
- Logger utility (create if missing)
- Sentry integration (for production breadcrumbs)

**Important:** Retry is implemented via manual re-invoke of the ofetch instance, NOT via ofetch's built-in retry mechanism.

### 0.3 Error Taxonomy

#### 0.3.x `parseApiError()` Payload & Fallback Rules (MUST)

Because ofetch typically exposes error payload via `error.data` (and sometimes `error.response?._data`), `parseApiError()` must extract both `message` and validation payload robustly.

**Implementation Tasks:**
- [ ] Prefer message source order: `data.message` → `data.error`/`data.detail` → `response.statusText` → generic fallback.
- [ ] For `422`: if `data.errors` is missing, still throw `ValidationError` with an empty `errors` object (do not downgrade to generic Error).
- [ ] Central rule: after retries are exhausted, always `throw parseApiError(response)` (no raw status checks in stores).


**Goal:** Create structured error classes for type-safe error handling with single mapping point and optional Nuxt error integration.

**Files to Create/Modify:**

- `app/utils/errors.ts` - Add error classes, type guards, and parseApiError function

**Implementation Steps:**

1. Create `ConcurrencyEvent` class:

   - Extends `Error`
   - Properties: `resource` (default: 'cart'), `version?`
   - For 409 conflicts
   - **Behavior:** Does NOT trigger error page, only UI notification

2. Create `ValidationError` class:

   - Extends `Error`
   - Properties: `errors: Record<string, string[]>`
   - For 422 validation errors
   - **Behavior:** Shows validation errors in form, no error page

3. Create `SessionError` class:

   - Extends `Error`
   - Properties: `code: 'csrf' | 'unauthorized' | 'expired'`
   - For 419 CSRF, 401 unauthorized
   - **Behavior:** May redirect to login, no error page for 401/419

4. Create `UnknownApiError` class:

   - Extends `Error`
   - Properties: `statusCode: number`, `data?: unknown`
   - For unhandled error codes (5xx, etc.)
   - **Behavior:** May trigger Nuxt error page for 5xx (optional)

5. Add type guard functions:

   - `isConcurrencyEvent(error: unknown): error is ConcurrencyEvent`
   - `isValidationError(error: unknown): error is ValidationError`
   - `isSessionError(error: unknown): error is SessionError`
   - `isUnknownApiError(error: unknown): error is UnknownApiError`

6. **Create `parseApiError()` function (single mapping point):**

   - Takes ofetch error response and returns appropriate error type
   - **Adaptation for ofetch:** Extract errors from `response._data` (ofetch wraps response)
   - Single source of truth for HTTP → typed error mapping
   - Signature: `parseApiError(error: FetchError | any): ConcurrencyEvent | ValidationError | SessionError | UnknownApiError`
   - **422 Validation Error Format:**
     - Extract from `error.data?.errors` or `error._data?.errors`
     - Expected format: `{ errors: Record<string, string[]> }`
     - Example: `{ errors: { email: ['Invalid email'], password: ['Too short'] } }`
   - Mapping:
     - 409 → throw `ConcurrencyEvent`
     - 422 → throw `ValidationError` (with `errors` from `_data`)
     - 419/401 → throw `SessionError`
     - 5xx → throw `UnknownApiError` (with statusCode)
     - Other → throw `UnknownApiError`

7. **Unified Error Throwing Mechanism:**

   - **CRITICAL:** After retries are exhausted, ALWAYS throw `parseApiError(response)`
   - Do NOT throw raw errors or "as it happens"
   - In `onResponseError` interceptor:
     - If retries exhausted → call `parseApiError(error)` and throw result
     - Ensures all errors go through single mapping point
     - Guarantees consistent error types across codebase

8. **Optional Nuxt Error Integration:**

   - For fatal errors (5xx), optionally create Nuxt error:
     ```typescript
     if (isUnknownApiError(error) && error.statusCode >= 500) {
       throw createError({
         statusCode: error.statusCode,
         message: error.message,
         data: error.data,
         fatal: true  // Only for critical errors that break app functionality
       })
     }
     ```

   - **Important:** Set `fatal: true` ONLY for critical errors (app cannot function)
   - For recoverable 5xx errors, use `fatal: false` or omit (default)

   - Document: ConcurrencyEvent (409) → UI notification only
   - Document: SessionError → redirect to login (no error page)
   - Document: 5xx → optional Nuxt error page trigger

9. Update error handling in stores to use new error types (examples in cart store)

**Usage Pattern:**

```typescript
try {
  await useApi().post('/cart/items', { body: payload })
} catch (error) {
  if (isConcurrencyEvent(error)) {
    showNotification('Cart was updated, please try again')
  } else if (isValidationError(error)) {
    showValidationErrors(error.errors)
  } else if (isSessionError(error)) {
    if (error.code === 'unauthorized') {
      navigateTo('/auth/login')
    }
  }
}
```

**Error Handling Rules:**

- **ConcurrencyEvent (409):** UI notification only, no error page
- **ValidationError (422):** Show in form, no error page
- **SessionError (401/419):** Redirect to login, no error page
- **UnknownApiError (5xx):** Optional Nuxt error page (configurable)

### 0.4 Idempotency Support

**Goal:** Automatic Idempotency-Key generation for payment and order operations.

**Files to Modify:**

- `app/composables/useApi.ts` - Already handled in Phase 0.1 `onRequest` hook
- `app/stores/checkout.store.ts` - Add `idempotent: true` to payment initiation
- `app/stores/orders.store.ts` - Add `idempotent: true` to order creation (if exists)

**Implementation Steps:**

1. Verify `onRequest` hook adds `Idempotency-Key` when `options.idempotent === true`
2. Update payment initiation to use `{ idempotent: true }`:
   ```typescript
   await useApi().post('/payments/init', {
     body: paymentData,
     idempotent: true
   })
   ```

3. Document idempotency usage in checkout/orders stores

**Note:** Idempotency-Key persistence for retries is handled in Phase 0.2.

### 0.5 Type Generation from Swagger/OpenAPI (Optional - High Priority)

**Goal:** Set up automatic type generation from API documentation.

**Files to Create/Modify:**

- `package.json` - Add type generation script
- `app/types/api/dto/` - Directory for generated DTO types
- `.gitignore` - Ignore generated types (or commit them)

**Implementation Steps:**

1. Install `openapi-typescript` or similar tool
2. Add script to `package.json`:
   ```json
   "scripts": {
     "generate:types": "openapi-typescript <api-spec-url> -o app/types/api/dto/api.d.ts"
   }
   ```

3. Configure type generation from Swagger/OpenAPI spec URL
4. Generate types to `app/types/api/dto/` directory
5. Document type generation process in README

**Note:** This is optional but recommended for type safety. Can be deferred if API spec is not available.

### 0.5.3 Runtime Validation (Optional - Future Enhancement)

**Goal:** Add Zod runtime validation for mapper boundary, especially useful for unstable API.

**Files to Create:**

- `app/utils/validators/` - Directory for Zod schemas
- `app/utils/validators/product.validator.ts` - Example validator

**Implementation Steps:**

1. Install `zod` package
2. Create Zod schemas matching DTO types
3. Validate DTOs in mappers before conversion:
   ```typescript
   const validatedDTO = productDTOSchema.parse(dto)
   return mapProductDTOToModel(validatedDTO)
   ```

4. Handle validation errors gracefully (log and return safe defaults)

**Note:** Optional enhancement for production stability. Can be added later if API is unstable.

## Phase 0.5: Type Integrity

### 0.5.1 DTO Isolation

**Goal:** Isolate DTO types from UI models using mappers.

**Files to Create:**

- `app/types/api/dto/` - Directory for DTO types (from Phase 0.5)
- `app/utils/mappers/` - Directory for mapper functions
- `app/utils/mappers/product.mapper.ts` - Example mapper

**Implementation Steps:**

1. Create mapper utilities directory
2. Create example mapper for Product:

   - `mapProductDTOToModel(dto: ProductDTO): Product`
   - Convert DTO structure to UI-optimized model
   - Add formatted values (e.g., `price.formatted`)

3. Update product store to use mapper:
   ```typescript
   const dto = await useApi<ProductDTO>().get(`/products/${id}`)
   this.product = mapProductDTOToModel(dto)
   ```

4. Document DTO isolation pattern

**Note:** Full implementation requires Phase 0.5 (type generation). This sets up the pattern.

### 0.5.2 Strict Dependency Injection

#### 0.5.2.x ESLint Enforcement & CI Proof (MUST)

Nuxt projects often use either classic `.eslintrc.*` or flat config `eslint.config.*`. The plan must specify which one the repo uses, and prove the rule works.

**Implementation Tasks:**
- [ ] Confirm the repository ESLint format: **flat config** (`eslint.config.mjs/js`) or **classic** (`.eslintrc.*`).
- [ ] Implement `no-restricted-imports` (or equivalent) scoped to `app/components/**` and `app/pages/**` to forbid importing `app/types/api/dto/**`.
- [ ] Add a CI check: a tiny “intentional violation” test (or a scripted grep) to ensure DTO imports in UI fail the pipeline.


**Goal:** Prevent DTO usage in UI components via ESLint rules with proper scope and CI enforcement.

**Files to Modify:**

- `eslint.config.mjs` - Add restricted import rule with proper scope
- `.github/workflows/ci.yml` or CI config - Add ESLint check step

**Implementation Steps:**

1. **Verify base ESLint config:**

   - Confirm project uses `@nuxt/eslint-config` or another Nuxt 4-compatible base config
   - Ensure ESLint is properly configured for Nuxt 4

2. **Add ESLint rule with UI-only scope:**
   ```javascript
   'no-restricted-imports': [
     'error',
     {
       patterns: [
         {
           group: ['**/types/api/dto/**'],
           message: 'DTO types should not be used in UI components. Use mappers to convert to UI models.',
           // Only restrict in UI directories
           importNames: ['**'],
           paths: [
             {
               group: ['app/components/**', 'app/pages/**'],
               message: 'DTO types should not be used in UI components. Use mappers to convert to UI models.'
             }
           ]
         }
       ]
     }
   ]
   ```


   - **Scope:** Only restrict DTO imports in `app/components` and `app/pages`
   - **Allow:** DTO imports in `app/stores`, `app/utils/mappers`, `app/composables`

3. **Verify rule works:**

   - Test with intentional DTO import in component (should fail)
   - Test with DTO import in mapper (should pass)
   - Test with DTO import in store (should pass)

4. **Add CI enforcement:**

   - Add ESLint check step to CI pipeline: `eslint .`
   - Ensure CI fails on ESLint errors
   - Prevent silent bypass of rules

**Note:** Full enforcement requires Phase 0.5.1 (mappers) to be in place. Rule scope ensures mappers and stores can still use DTOs.

## Phase 1: Authentication & Global Logic

### 1.1 Auth State Machine

**Goal:** Implement state machine for authentication states (guest, auth, linking).

**Files to Modify:**

- `app/stores/auth.store.ts` - Add state machine logic

**Implementation Steps:**

1. Add `state: AuthState` property to store state:
   ```typescript
   state: 'guest' | 'auth' | 'linking'
   ```

2. Add computed getters:

   - `isGuest: boolean`
   - `isAuthenticated: boolean`
   - `isLinking: boolean`

3. Add state transition methods:

   - `setGuest()` - Clear user, set state to 'guest'
   - `setAuthenticated(user: User)` - Set user, set state to 'auth'
   - `setLinking()` - Set state to 'linking' (only from 'auth')

4. Add state validation:

   - `setLinking()` throws if current state is not 'auth'
   - Document valid transitions

5. Update existing methods to use state machine:

   - `login()` → calls `setAuthenticated()`
   - `logout()` → calls `setGuest()`
   - `register()` → calls `setAuthenticated()`

6. Add state persistence (cookies/localStorage) if needed

**State Transitions:**

- `guest` → `auth` (login/register)
- `auth` → `guest` (logout)
- `auth` → `linking` (OAuth account linking)
- `linking` → `auth` (OAuth success/error)

### 1.2 Middleware Sync

#### 1.2.x Logger Wiring (MUST)

If the sync implementation logs errors/events, the plan must define where the logger comes from.

**Implementation Tasks:**
- [ ] Standardize logger access: either `const { $logger } = useNuxtApp()` or `useLogger('auth:sync')`.
- [ ] In production: avoid noisy console logs; use breadcrumbs/telemetry for expected events (e.g., `409` retries).


**Goal:** Move cart attachment logic from UI components to a centralized location (plugin or store actions). **ANTI-PATTERN:** Do NOT use `watch()` in `auth.global.ts` middleware.

**⚠️ IMPORTANT: `watch()` in middleware is FORBIDDEN (anti-pattern).** Middleware runs on every route change, and `watch()` creates reactive subscriptions that can cause memory leaks and unexpected behavior.

**Files to Create/Modify:**

- **Option A (Recommended):** `app/plugins/auth-sync.client.ts` - Client-side plugin with single subscription
- **Option B:** `app/stores/auth.store.ts` - Add cart sync in login/logout actions
- **Option C:** `app/stores/auth.store.ts` - Use `store.$onAction` or `store.$subscribe` for state transitions
- `app/stores/cart.store.ts` - Ensure `attach()` method exists and is idempotent
- Remove cart sync from login/register components (if exists)

**Implementation Options:**

#### Option A: Nuxt Plugin (Recommended) - **OFFICIAL DEFAULT**

**File:** `app/plugins/auth-sync.client.ts`

**Implementation (choose one approach):**

**Approach A1: Using `watch()` (simpler):**

```typescript
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  const logger = useLogger('auth:sync')

  // Single watch for entire app lifecycle
  watch(() => authStore.state, (nextState, prevState) => {
    // guest → auth: attach cart
    if (prevState === 'guest' && nextState === 'auth') {
      cartStore.attach().catch(err => {
        logger.error('Failed to attach cart on login', err)
      })
    }
    
    // auth → guest: clear cart
    if (prevState === 'auth' && nextState === 'guest') {
      cartStore.clear()
    }
  }, { immediate: false })
})
```

**Approach A2: Using `$subscribe` with manual state tracking:**

```typescript
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  const logger = useLogger('auth:sync')

  // Track previous state
  let lastState = authStore.state

  // Single subscription for entire app lifecycle
  authStore.$subscribe((mutation, state) => {
    const currentState = state.state
    
    // guest → auth: attach cart
    if (lastState === 'guest' && currentState === 'auth') {
      cartStore.attach().catch(err => {
        logger.error('Failed to attach cart on login', err)
      })
    }
    
    // auth → guest: clear cart
    if (lastState === 'auth' && currentState === 'guest') {
      cartStore.clear()
    }
    
    lastState = currentState
  })
})
```

**Benefits:**

- Runs once on app initialization (client-side only)
- Single subscription/watch for entire app lifecycle
- No memory leaks from multiple watches
- Clean separation of concerns
- **Official default:** Use this approach in the project

#### Option B: Store Actions (Alternative)

**File:** `app/stores/auth.store.ts`

```typescript
async login(credentials) {
  const user = await useApi().post('/auth/login', { body: credentials })
  this.setAuthenticated(user)
  
  // Attach cart after successful login
  const cartStore = useCartStore()
  const logger = useLogger('auth:sync')
  await cartStore.attach().catch(err => {
    logger.error('Failed to attach cart on login', err)
  })
}

async logout() {
  await useApi().post('/auth/logout')
  this.setGuest()
  
  // Clear cart after logout
  const cartStore = useCartStore()
  cartStore.clear()
}
```

**Benefits:**

- Direct action in store (explicit)
- Easy to understand flow
- No reactive subscriptions needed

**Note:** This is an alternative approach. Use Option A as the default unless there's a specific reason to use store actions.

#### Option C: Store Subscriptions

**File:** `app/stores/auth.store.ts` or separate composable

```typescript
// In auth.store.ts or composable
authStore.$onAction(({ name, after, args }) => {
  if (name === 'setAuthenticated') {
    after(() => {
      const cartStore = useCartStore()
      cartStore.attach().catch(err => {
        logger.error('Failed to attach cart', err)
      })
    })
  }
  if (name === 'setGuest') {
    after(() => {
      const cartStore = useCartStore()
      cartStore.clear()
    })
  }
})
```

**Implementation Steps:**

1. **Choose implementation option:**

   - **Default (Official):** Option A (Nuxt Plugin) - Use Approach A1 (watch) or A2 ($subscribe)
   - **Alternative:** Option B (Store Actions) - Only if plugin approach doesn't fit
   - **Not Recommended:** Option C - Keep as reference only
   - **CRITICAL:** Define ONE official approach for the project to ensure consistency
   - Document the chosen approach in project README or architecture docs

2. **Define exact sync triggers:**

   - `guest` → `auth`: Call `cartStore.attach()` (idempotent)
   - `auth` → `guest`: Call `cartStore.clear()` or `cartStore.detach()`
   - `auth` → `auth`: No-op (user already authenticated, no action needed)

3. **Add safeguard against double attach:**

   - Ensure `cartStore.attach()` is idempotent on frontend side
   - Check if cart is already attached before calling
   - Or rely on backend idempotency

4. **Add error handling (non-blocking):**

   - Log errors but don't prevent state transitions
   - Use `logger.debug` for success, `logger.error` for failures
   - Don't throw errors (non-blocking)

5. **Verify `cartStore.attach()` method:**

   - Exists and works correctly
   - Is idempotent (safe to call multiple times)
   - Handles errors gracefully

6. **Remove any manual `cart.attach()` calls from:**

   - Login components
   - Register components
   - OAuth callback handlers

**Recommendation:** Use Option A (plugin) as the official default. This ensures consistency across the team and prevents different developers from implementing different approaches.

### 1.3 OAuth Authentication

**Goal:** Implement OAuth login/registration and account linking.

**Files to Create:**

- `app/composables/useOAuth.ts` - OAuth composable
- `app/pages/auth/oauth/[provider]/callback.vue` - OAuth callback page

**Files to Modify:**

- `app/stores/auth.store.ts` - Add OAuth methods
- `app/pages/auth/login.vue` - Add OAuth buttons
- `app/pages/auth/register.vue` - Add OAuth buttons
- `app/pages/profile/settings.vue` - Add account linking UI
- `nuxt.config.ts` - Configure OAuth providers (if using module)

**Implementation Steps:**

1. **OAuth Composable (`useOAuth.ts`):**

   - `initiateOAuth(provider: 'google' | 'facebook')` - Redirect to OAuth
   - `handleOAuthCallback(provider, code, state)` - Handle callback
   - Uses state machine for transitions

2. **OAuth Store Methods:**

   - `loginWithOAuth(provider)` - For unauthenticated users
   - `linkOAuthAccount(provider)` - For authenticated users (linking)
   - Both use state machine transitions

3. **OAuth Callback Page:**

   - Handle success/error query parameters
   - Call `handleOAuthCallback()` from composable
   - Redirect to appropriate page

4. **OAuth UI:**

   - Add "Sign in with Google/Facebook" buttons to login/register
   - Add "Link Google/Facebook account" in profile settings
   - Show linked accounts in profile

5. **Error Handling:**

   - Handle OAuth errors (user cancelled, provider error)
   - Show user-friendly error messages
   - Rollback state on error

**Endpoints:**

- `GET /oauth/{provider}/redirect` - Initiate OAuth
- `GET /oauth/{provider}/callback` - Handle callback

**State Machine Integration:**

- Unauthenticated OAuth: `guest` → `auth`
- Account linking: `auth` → `linking` → `auth` (or rollback to `auth` on error)

### 1.4 Password & Email Management (Optional - Medium Priority)

**Goal:** Add password and email change functionality.

**Files to Create/Modify:**

- `app/stores/auth.store.ts` - Add password/email change methods
- `app/pages/profile/settings.vue` - Add password/email change UI

**Implementation Steps:**

1. Add store methods:

   - `requestPasswordChange(currentPassword: string)`
   - `confirmPasswordChange(token: string, newPassword: string)`
   - `requestEmailChange(newEmail: string)`
   - `confirmEmailChange(token: string)`

2. Create UI components for password/email change forms

3. Handle confirmation tokens (from email links)

**Endpoints:**

- `POST /change-password/request`
- `POST /change-password/confirm/{token}`
- `POST /change-email/request`
- `POST /change-email/confirm/{token}`

**Note:** Can be deferred if not critical for MVP.

## Implementation Order

1. **Phase 0.1** - Ofetch refactoring with SSR cookie forwarding (foundation)
2. **Phase 0.3** - Error taxonomy with parseApiError (needed for Phase 0.2)
3. **Phase 0.2** - Retry strategy with manual re-invoke (depends on 0.1, 0.3)
4. **Phase 0.4** - Idempotency (verification, already in 0.1)
5. **Phase 0.5** - Type integrity (optional, can be parallel)
6. **Phase 1.1** - Auth state machine (foundation for 1.2, 1.3)
7. **Phase 1.2** - Auth-cart sync via plugin/store (depends on 1.1, NO watch in middleware)
8. **Phase 1.3** - OAuth (depends on 1.1, 1.2)

## Future Enhancements (Optional)

### Network Layer as Nuxt Layer

**Goal:** Isolate network layer (useApi, error taxonomy, mappers) as a Nuxt layer for scalability.

**When to Consider:**

- Project becomes large (>50 stores, >100 components)
- Network layer needs to be shared across multiple Nuxt apps
- Need strict isolation of network concerns

**Implementation:**

- Create `layers/network/` directory
- Move `app/composables/useApi.ts` to layer
- Move `app/utils/errors.ts` to layer
- Move `app/utils/mappers/` to layer
- Configure layer in `nuxt.config.ts`

**Note:** This is a structural enhancement for future scaling. Not required for MVP.

## Testing Checklist

### Phase 0: Network & Error Taxonomy

- [ ] Test ofetch instance with all request types (GET, POST, PATCH, DELETE)
- [ ] Test SSR cookie forwarding (verify cookies are sent to backend during SSR)
- [ ] Test `credentials: 'include'` configuration
- [ ] Test If-Match scope rule (only added for `/api/v1/cart/**` routes)
- [ ] Test SSR instance isolation (per-request instances, no singleton on server)
- [ ] Test 409 retry (cart version conflict) - verify max 3 retries, separate counter
- [ ] Test cart retry safety rule (409 retry only with Idempotency-Key for cart mutations)
- [ ] Test 419 retry (CSRF) - verify max 1 retry, separate counter
- [ ] Test retry re-invoke (not relying on ofetch retry, using structuredClone)
- [ ] Test request body retry constraint (no retry for FormData/streams)
- [ ] Test Idempotency-Key persistence across retries
- [ ] Test no retry for non-idempotent mutations (unless `idempotent: true`)
- [ ] Test retry meta contract (typed internal meta)
- [ ] Test error taxonomy classes (ConcurrencyEvent, ValidationError, SessionError, UnknownApiError)
- [ ] Test `parseApiError()` single mapping point (extracts from `response._data`)
- [ ] Test 422 validation error format (extract errors from `_data.errors`)
- [ ] Test unified error throwing (always throws parseApiError after retries)
- [ ] Test error handling rules (409 → notification, 422 → form, 401 → redirect)
- [ ] Test Nuxt error integration (fatal: true only for critical errors)
- [ ] Test logging policy (dev debug, prod Sentry breadcrumbs)
- [ ] Test rate limiting for logs (prevent Sentry flooding)

### Phase 1: Authentication & Global Logic

- [ ] Test auth state machine transitions (guest → auth, auth → guest, auth → linking)
- [ ] Test cart attachment on login (guest → auth) via plugin (official Option A)
- [ ] Test cart clearing on logout (auth → guest) via plugin
- [ ] Test idempotent attach (no double attach)
- [ ] Test auth → auth transition (no-op, no cart action)
- [ ] Test plugin approach consistency (single watch/subscription per app lifecycle)
- [ ] Test OAuth login flow
- [ ] Test OAuth account linking
- [ ] Test OAuth error handling

### ESLint & Type Safety

- [ ] Test ESLint rule prevents DTO imports in UI components
- [ ] Test ESLint rule allows DTO imports in stores/mappers
- [ ] Test CI fails on ESLint errors

## Dependencies

- Cart store (for version tracking and attach method)
- Auth store (for state machine)
- Logger utility (create if missing, with environment-based levels)
- Sentry integration (for production breadcrumbs, optional)
- Nuxt 4 runtime config (for API base URL)
- ESLint with @nuxt/eslint-config or compatible base config
- CI/CD pipeline (for ESLint enforcement)

## Summary of Key Changes

### Critical Updates

1. **Phase 0.1:** 

   - Added SSR cookie forwarding via `useRequestHeaders(['cookie'])` to prevent "new session" issues
   - Added If-Match scope rule (only for `/api/v1/cart/**` routes)
   - Added SSR instance isolation (per-request instances, no singleton on server)
   - Fixed `useNuxtApp()` usage (call at function start, use reference in interceptors)

2. **Phase 0.2:** 

   - Clarified retry mechanism uses manual re-invoke (not ofetch's retry), separate counters for 409/419
   - Added cart retry safety rule (409 retry only with Idempotency-Key)
   - Added request body retry constraint (only JSON, not streams/FormData)
   - Added retry meta contract (typed internal meta)
   - Added `structuredClone()` usage for retry options
   - Logging policy (dev debug, prod Sentry breadcrumbs)

3. **Phase 0.3:** 

   - Added `parseApiError()` as single mapping point (adapts to ofetch, extracts from `_data`)
   - Added unified error throwing mechanism (always throws parseApiError after retries)
   - Added 422 validation error format documentation
   - Nuxt error integration with `fatal: true` only for critical errors
   - Error handling rules (409 → notification, 422 → form, 401 → redirect)

4. **Phase 1.2:** 

   - **FORBIDDEN** `watch()` in middleware, replaced with plugin/store alternatives
   - Fixed Option A with proper `watch()` or `$subscribe` + manual state tracking
   - Defined Option A as official default for project consistency

5. **Phase 0.5.2:** Enhanced ESLint rule with UI-only scope and CI enforcement

### Implementation Highlights

- **SSR Cookie Forwarding:** Ensures session continuity between SSR and CSR
- **Manual Retry:** Re-invoke ofetch instance, not relying on built-in retry
- **Error Taxonomy:** Single `parseApiError()` function for all HTTP → typed error mapping
- **Auth-Cart Sync:** Plugin-based (recommended) or store-action-based, NO watch in middleware
- **ESLint Enforcement:** Scoped to UI only, CI-enforced
- **Logging Policy:** Dev debug, prod Sentry breadcrumbs with rate limiting
- **Error Taxonomy:** Single `parseApiError()` function for all HTTP → typed error mapping
- **Auth-Cart Sync:** Plugin-based (recommended) or store-action-based, NO watch in middleware
- **ESLint Enforcement:** Scoped to UI only, CI-enforced
- **Logging Policy:** Dev debug, prod Sentry breadcrumbs with rate limiting