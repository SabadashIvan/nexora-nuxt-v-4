# API Implementation Plan (Nuxt 4 Senior Edition)

This document outlines the implementation plan for new and updated API endpoints, organized by business domain and implementation phases.

**Last Updated:** Based on Scribe documentation analysis + codebase review + Nuxt 4 architecture updates
**Total New Endpoints:** ~30+
**Total Updated Endpoints:** ~15+

**Status Legend:**
- ✅ **DONE** - Fully implemented
- 🟡 **PARTIAL** - Partially implemented, needs updates
- ❌ **NOT DONE** - Not implemented yet

**See also:** `implementation-status.md` for detailed analysis of what's implemented.

---

## Implementation Status Summary

Based on codebase analysis, here's the current implementation status:

| Domain | Done | Partial | Not Done | Progress |
|--------|------|---------|----------|----------|
| Authentication & Identity | 0 | 0 | 2 | 0% |
| Cart & Checkout | 1 | 1 | 0 | 50% |
| Catalog & Products | 2 | 0 | 0 | 100% |
| User Account & Profile | 0 | 0 | 1 | 0% |
| Content (Blog/Reviews/Comments) | 2 | 1 | 0 | 67% |
| Notifications | 0 | 1 | 0 | 50% |
| Shipping & Delivery | 0 | 0 | 1 | 0% |
| Payments | 0 | 1 | 0 | 50% |
| Orders | 0 | 1 | 0 | 50% |
| Marketing & Audience | 1 | 1 | 0 | 50% |
| Site Configuration | 1 | 1 | 0 | 50% |
| Support & Leads | 1 | 1 | 0 | 50% |
| **TOTAL** | **10** | **8** | **4** | **~55%** |

**Key Findings:**
- ✅ **Cart versioning** is fully implemented (excellent work!)
- ✅ **Search suggestions** are fully implemented
- ✅ **Reviews & Comments** are mostly done (missing review replies)
- ✅ **Banners** are implemented
- ✅ **Menu tree** is implemented
- 🟡 **Checkout** needs warehouse metadata support
- 🟡 **Notifications** needs filter parameter and preferences matrix
- ❌ **OAuth** not implemented
- ❌ **Loyalty** not implemented
- ❌ **Shipping search** not implemented

---

## Implementation Priority

1. **Critical** - Core functionality required for basic operations
2. **High** - Important features that enhance user experience
3. **Medium** - Nice-to-have features that improve functionality
4. **Low** - Optional features or internal endpoints

---

## Phase 0: Network & Error Taxonomy (Week 1)

**Goal:** Подготовка "умного" сетевого слоя для автоматизации Concurrency и Idempotency с четкой таксономией ошибок.

**Status:** ❌ **NOT DONE** - Infrastructure foundation

### 0.1 Ofetch Instance Refactoring (NEW - Critical Priority)

**Implementation Tasks:**
- [ ] Refactor `useApi.ts` to use `$fetch.create()` from ofetch
- [ ] Create centralized ofetch instance with base configuration
- [ ] Move all API configuration to ofetch instance
- [ ] Update all API calls to use the new instance
- [ ] Ensure SSR/CSR compatibility with ofetch
- [ ] Add TypeScript generics support for typed responses

**Reference Implementation:**

```typescript
// app/composables/useApi.ts
import { $fetch, type FetchOptions } from 'ofetch'

export const useApi = () => {
  const cartStore = useCartStore()
  const { public: { apiBackendUrl } } = useRuntimeConfig()

  return $fetch.create({
    baseURL: apiBackendUrl,
    async onRequest({ options }) {
      const headers = (options.headers ||= {}) as Record<string, string>
      
      // Авто-версия корзины для всех мутаций
      if (options.method !== 'GET' && cartStore.cartVersion) {
        headers['If-Match'] = String(cartStore.cartVersion)
      }
      
      // Авто-идемпотентность (для платежей и заказов)
      if (options.idempotent) {
        headers['Idempotency-Key'] = crypto.randomUUID()
      }
    },
    async onResponseError({ response, retry }) {
      // 409 Conflict: Бэкенд говорит, что корзина изменилась
      if (response.status === 409) {
        await cartStore.fetchCart() // Обновляем версию в сторе
        return retry() // Магия: запрос повторяется с новым If-Match!
      }
    }
  })
}
```

**Dependencies:**
- `useApi()` composable
- All stores using API calls
- Cart store (for version tracking)

**Technical Notes:**
- `$fetch.create()` provides better type safety and configuration
- Allows centralized interceptors and error handling
- Better integration with Nuxt 4's fetch utilities
- **Revolutionary approach**: Headers are managed automatically in the network layer, not in stores
- Stores become "lean" - they only contain business logic, not HTTP concerns

---

### 0.2 Ofetch Hardening with Retry Strategy (NEW - Critical Priority)

**Implementation Tasks:**
- [ ] **Retry Strategy:** Implement retry logic: 409 (max 3 attempts), 419 (max 1 attempt)
- [ ] **Idempotency-Key Persistence:** Fix `Idempotency-Key` for the entire cycle "Request -> 409 -> Retry" (same key for all retries)
- [ ] **Retry Logging:** Add `logger.debug` for all retry events (request, retry attempt, success/failure)
- [x] ✅ Implement interceptor for `409 Conflict` (cart version mismatch) - **Included in useApi.ts**
- [ ] Implement interceptor for `419 CSRF Token Mismatch` (Sanctum)
- [x] ✅ Handle cart version refresh on 409 - **Included in useApi.ts**
- [ ] Handle CSRF token refresh on 419
- [ ] Remove manual retry logic from cart store (move to interceptor) - **Phase 2 task**

**Implementation Pattern:**

Enhanced retry strategy with logging and persistent Idempotency-Key:

```typescript
async onRequest({ options, request }) {
  const headers = (options.headers ||= {}) as Record<string, string>
  
  // Авто-версия корзины для всех мутаций
  if (options.method !== 'GET' && cartStore.cartVersion) {
    headers['If-Match'] = String(cartStore.cartVersion)
  }
  
  // Авто-идемпотентность (для платежей и заказов)
  // Зафиксировать ключ для всего цикла Request -> 409 -> Retry
  if (options.idempotent && !headers['Idempotency-Key']) {
    headers['Idempotency-Key'] = crypto.randomUUID()
    // Store in request context for retry persistence
    options._idempotencyKey = headers['Idempotency-Key']
  } else if (options._idempotencyKey) {
    // Reuse same key on retry
    headers['Idempotency-Key'] = options._idempotencyKey
  }
}

async onResponseError({ response, request, retry, options }) {
  const logger = useLogger('api:retry')
  
  // 409 Conflict: Бэкенд говорит, что корзина изменилась (max 3 retries)
  if (response.status === 409) {
    const retryCount = (options._retryCount || 0) + 1
    const maxRetries = 3
    
    if (retryCount <= maxRetries) {
      logger.debug('Cart version conflict, refreshing and retrying', {
        url: request,
        attempt: retryCount,
        maxRetries
      })
      
      await cartStore.fetchCart() // Обновляем версию в сторе
      
      // Persist Idempotency-Key for retry
      if (options._idempotencyKey) {
        options.headers['Idempotency-Key'] = options._idempotencyKey
      }
      
      options._retryCount = retryCount
      return retry() // Магия: запрос повторяется с новым If-Match!
    } else {
      logger.debug('Max retries reached for 409 conflict', { url: request })
      throw new ConcurrencyEvent('Cart version conflict after max retries')
    }
  }
  
  // 419 CSRF: Refresh token (max 1 retry)
  if (response.status === 419) {
    const retryCount = (options._retryCount || 0) + 1
    const maxRetries = 1
    
    if (retryCount <= maxRetries) {
      logger.debug('CSRF token mismatch, refreshing and retrying', {
        url: request,
        attempt: retryCount
      })
      
      await refreshCsrfToken() // Refresh CSRF token via Sanctum
      options._retryCount = retryCount
      return retry()
    } else {
      logger.debug('Max retries reached for 419 CSRF', { url: request })
      throw new SessionError('CSRF token refresh failed')
    }
  }
}
```

**Dependencies:**
- Ofetch instance (0.1)
- Cart store
- Auth store (for CSRF handling)
- Logger utility

**Technical Notes:**
- **409 Conflict:** Max 3 retries - fetches latest cart, retries with new `If-Match` header
- **419 CSRF:** Max 1 retry - refreshes CSRF token via Sanctum endpoint
- **Idempotency-Key Persistence:** Same key used for entire retry cycle (stored in `options._idempotencyKey`)
- **Retry Logging:** All retry events logged with `logger.debug` for debugging
- Retry is transparent to store methods - stores don't need to know about retries
- The `retry()` function from ofetch automatically retries the original request
- All retries automatically include updated headers (If-Match, Idempotency-Key)

---

### 0.3 Error Taxonomy (NEW - Critical Priority)

**Implementation Tasks:**
- [ ] Update `utils/errors.ts` with error taxonomy
- [ ] Create `ConcurrencyEvent` class (for 409 conflicts)
- [ ] Create `ValidationError` class (for 422 validation errors)
- [ ] Create `SessionError` class (for 419 CSRF, 401 unauthorized)
- [ ] Add error type discrimination utilities
- [ ] Update error handling in stores to use new error types
- [ ] Add error translation/messaging for each error type

**Implementation Pattern:**

```typescript
// app/utils/errors.ts

export class ConcurrencyEvent extends Error {
  constructor(
    message: string,
    public readonly resource: string = 'cart',
    public readonly version?: string
  ) {
    super(message)
    this.name = 'ConcurrencyEvent'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]> = {}
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class SessionError extends Error {
  constructor(
    message: string,
    public readonly code: 'csrf' | 'unauthorized' | 'expired' = 'unauthorized'
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

// Type guard utilities
export function isConcurrencyEvent(error: unknown): error is ConcurrencyEvent {
  return error instanceof ConcurrencyEvent
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError
}
```

**Usage in Stores:**

```typescript
try {
  await useApi().post('/cart/items', { body: payload })
} catch (error) {
  if (isConcurrencyEvent(error)) {
    // Handle concurrency conflict
    showNotification('Cart was updated, please try again')
  } else if (isValidationError(error)) {
    // Handle validation errors
    showValidationErrors(error.errors)
  } else if (isSessionError(error)) {
    // Handle session errors
    if (error.code === 'csrf') {
      showNotification('Session expired, please refresh')
    } else {
      redirectToLogin()
    }
  }
}
```

**Dependencies:**
- Error utilities
- All stores using error handling

**Technical Notes:**
- **ConcurrencyEvent:** Represents 409 conflicts (cart version, optimistic locking)
- **ValidationError:** Represents 422 validation errors with field-level messages
- **SessionError:** Represents 419 CSRF, 401 unauthorized, session expiration
- Error taxonomy enables type-safe error handling
- Each error type has specific properties for better handling
- Error types can be used for i18n error messages

---

### 0.4 Idempotency Support (NEW - Critical Priority)

**Implementation Tasks:**
- [x] ✅ Add `Idempotency-Key` generation utility - **Using `crypto.randomUUID()`**
- [x] ✅ Automatically add `Idempotency-Key` header when `options.idempotent` is set
- [ ] Store idempotency keys in memory/cache for retry scenarios (optional)
- [x] ✅ Ensure unique keys per operation (UUID v4) - **crypto.randomUUID()**
- [ ] Update cart mutations to use `{ idempotent: true }` option
- [ ] Update payment initiation to use `{ idempotent: true }` option
- [ ] Handle idempotency key conflicts (409 response) - **Handled by backend**

**Implementation Pattern:**

Idempotency is handled automatically in `onRequest` hook:

```typescript
async onRequest({ options }) {
  const headers = (options.headers ||= {}) as Record<string, string>
  
  // Авто-идемпотентность (для платежей и заказов)
  if (options.idempotent) {
    headers['Idempotency-Key'] = crypto.randomUUID()
  }
}
```

**Usage in Stores:**

```typescript
// Payment initiation with idempotency
await useApi().post('/payments/init', {
  body: paymentData,
  idempotent: true  // Automatically adds Idempotency-Key header
})

// Cart mutations (idempotency handled automatically via retry)
await useApi().post('/cart/items', {
  body: itemData
  // idempotent: true can be added if needed
})
```

**Dependencies:**
- Ofetch instance (0.1)
- Auto-retry interceptor (0.2)
- Cart store
- Payments store

**Technical Notes:**
- Idempotency keys prevent duplicate operations on retry
- Keys are generated using `crypto.randomUUID()` (UUID v4)
- Keys are generated per-request when `idempotent: true` is set
- Backend validates idempotency keys and returns cached response if duplicate
- **Opt-in approach**: Only requests with `idempotent: true` get the header (not all POST requests)

---

### 0.5 Type Generation from Swagger/OpenAPI (NEW - High Priority)

**Implementation Tasks:**
- [ ] Set up OpenAPI/Swagger type generation tool (e.g., `openapi-typescript`)
- [ ] Configure automatic type generation from API documentation
- [ ] Add type generation script to package.json
- [ ] Generate types to `app/types/api/` directory
- [ ] Update existing types to use generated types
- [ ] Set up CI/CD integration for type generation
- [ ] Document type generation process
- [ ] Add type validation in development mode

**Dependencies:**
- API documentation (Swagger/OpenAPI spec)
- TypeScript configuration
- Build tools

**Technical Notes:**
- Types should be generated from backend API documentation
- Types should be regenerated on API changes
- Generated types replace manual type definitions in `types/` folder
- Keep custom types for frontend-specific structures
- Can enhance `useApi()` with TypeScript generics: `useApi().get<Product>('/products/1')`

---

### Phase 0 Summary: Benefits of "Smart" Network Layer

**What This Gives You as a Senior Developer:**

1. **Масштабируемость (Scalability):** 
   - When adding Reviews, Comments, or any new features in Phase 3+, you don't need to think about CSRF tokens or headers
   - Everything works "out of the box" through the smart network layer
   - New stores can focus purely on business logic

2. **Типизация (Type Safety):** 
   - Can add ofetch generics: `useApi().get<Product>('/products/1')` immediately returns typed response
   - Type generation from OpenAPI ensures types stay in sync with backend
   - Compile-time safety for all API calls

3. **Производительность (Performance):** 
   - Using SWR in `nuxt.config.ts` (Phase 3) makes category navigation instant
   - Optimistic UI (Phase 2) provides instant feedback
   - Automatic retry prevents unnecessary user actions

4. **Maintainability:**
   - Stores become 70-80% shorter and more readable
   - HTTP concerns (headers, retries, versioning) are centralized
   - Easy to add new interceptors or modify behavior globally

5. **Developer Experience:**
   - No more manual header management in stores
   - No more manual retry logic
   - No more version checking before mutations
   - Focus on business logic, not HTTP plumbing

---

## Phase 0.5: Type Integrity

**Goal:** Обеспечение строгой типизации с изоляцией DTO и запретом использования OpenAPI-типов в UI.

**Status:** ❌ **NOT DONE** - Type integrity layer

### 0.5.1 DTO Isolation (NEW - High Priority)

**Implementation Tasks:**
- [ ] Configure OpenAPI type generation **only** for request/response DTOs
- [ ] Generate DTO types to `app/types/api/dto/` directory (isolated from UI types)
- [ ] Create mapper functions to convert DTOs to UI models
- [ ] Document DTO isolation pattern
- [ ] Add linting rules to prevent DTO usage in components

**Implementation Pattern:**

```typescript
// app/types/api/dto/product.dto.ts (Generated from OpenAPI)
export interface ProductDTO {
  id: number
  name: string
  price: { amount: number; currency: string }
  // ... other DTO fields
}

// app/types/product.ts (UI Model)
export interface Product {
  id: number
  name: string
  price: Price
  // ... UI-optimized structure
}

// app/utils/mappers/product.mapper.ts
export function mapProductDTOToModel(dto: ProductDTO): Product {
  return {
    id: dto.id,
    name: dto.name,
    price: {
      amount: dto.price.amount,
      currency: dto.price.currency,
      formatted: formatPrice(dto.price.amount, dto.price.currency)
    }
  }
}
```

**Usage in Stores:**

```typescript
// app/stores/product.store.ts
async fetchProduct(id: number) {
  // useApi returns DTO
  const dto = await useApi<ProductDTO>().get(`/products/${id}`)
  
  // Map to UI model
  this.product = mapProductDTOToModel(dto)
}
```

**Dependencies:**
- Type generation (Phase 0.5)
- Mapper utilities

**Technical Notes:**
- DTOs are generated from OpenAPI and represent exact API structure
- UI models are optimized for frontend needs (formatted values, computed properties)
- Mappers provide type-safe conversion between DTOs and UI models
- Components should **never** import DTO types directly
- This pattern allows API changes without breaking UI components

---

### 0.5.2 Strict Dependency Injection (NEW - High Priority)

**Implementation Tasks:**
- [ ] Bind types to `useApi<T>()` generic parameter
- [ ] Add ESLint rule to prevent OpenAPI type imports in `app/components/` and `app/pages/`
- [ ] Create type-safe API client with DTO generics
- [ ] Document strict DI pattern
- [ ] Add pre-commit hook to check for DTO usage in UI

**Implementation Pattern:**

```typescript
// app/composables/useApi.ts
export function useApi<T = unknown>() {
  // ... implementation
  return {
    get: <R = T>(url: string) => $fetch<R>(url),
    post: <R = T>(url: string, options?: FetchOptions) => $fetch<R>(url, { ...options, method: 'POST' }),
    // ... other methods
  }
}

// Usage with DTO types
const productDTO = await useApi<ProductDTO>().get('/products/1')
const product = mapProductDTOToModel(productDTO)
```

**ESLint Rule:**

```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['**/types/api/dto/**'],
          message: 'DTO types should not be used in UI components. Use mappers to convert to UI models.'
        }
      ]
    }
  ]
}
```

**Dependencies:**
- Type generation (Phase 0.5.1)
- ESLint configuration

**Technical Notes:**
- `useApi<T>()` generic parameter enforces DTO type usage
- UI components are prohibited from importing DTO types
- Mappers provide the only bridge between DTOs and UI models
- This ensures API changes don't break UI components
- Type safety is maintained throughout the application

---

## Phase 1: Authentication & Global Logic

**Goal:** Реализация состояния авторизации и автоматической синхронизации сессий.

**Status:** ❌ **NOT DONE** - Authentication foundation

### 1.1 Auth State Machine (NEW - High Priority)

**Implementation Tasks:**
- [ ] Describe authentication states in `auth.store.ts`: `guest`, `auth`, `linking`
- [ ] Implement state machine with transitions
- [ ] Add state validation and guards
- [ ] Handle state transitions (guest → auth, auth → linking, etc.)
- [ ] Add state persistence (cookies/localStorage)
- [ ] Create state machine types and utilities

**Implementation Pattern:**

```typescript
// app/stores/auth.store.ts

type AuthState = 'guest' | 'auth' | 'linking'

interface AuthStateMachine {
  state: AuthState
  user: User | null
  isGuest: boolean
  isAuthenticated: boolean
  isLinking: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthStateMachine => ({
    state: 'guest',
    user: null,
    isGuest: true,
    isAuthenticated: false,
    isLinking: false
  }),

  actions: {
    setGuest() {
      this.state = 'guest'
      this.user = null
      this.isGuest = true
      this.isAuthenticated = false
      this.isLinking = false
    },

    setAuthenticated(user: User) {
      this.state = 'auth'
      this.user = user
      this.isGuest = false
      this.isAuthenticated = true
      this.isLinking = false
    },

    setLinking() {
      if (this.state !== 'auth') {
        throw new Error('Can only link account when authenticated')
      }
      this.state = 'linking'
      this.isLinking = true
    },

    async login(credentials: LoginCredentials) {
      // Transition: guest → auth
      const user = await useApi().post('/auth/login', { body: credentials })
      this.setAuthenticated(user)
    },

    async linkOAuthAccount(provider: string) {
      // Transition: auth → linking → auth
      this.setLinking()
      try {
        await useApi().get(`/oauth/${provider}/redirect`)
      } catch (error) {
        this.setAuthenticated(this.user!) // Rollback
        throw error
      }
    }
  }
})
```

**Dependencies:**
- Auth store
- Auth API endpoints

**Technical Notes:**
- **guest:** User is not authenticated (anonymous)
- **auth:** User is authenticated (logged in)
- **linking:** User is authenticated and linking OAuth account
- State machine ensures valid transitions only
- State changes trigger middleware sync (cart.attach())

---

### 1.2 Middleware Sync (NEW - High Priority)

**Implementation Tasks:**
- [ ] Move `cart.attach()` logic from UI components to `auth.global.ts` middleware
- [ ] Trigger cart attachment on auth state changes (guest → auth)
- [ ] Handle cart attachment on OAuth callback
- [ ] Ensure cart attachment happens before route navigation
- [ ] Add error handling for cart attachment failures
- [ ] Add logging for cart sync events

**Implementation Pattern:**

```typescript
// app/middleware/auth.global.ts

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  
  // Watch for auth state changes
  watch(() => authStore.state, async (newState, oldState) => {
    // When transitioning from guest to auth, attach cart
    if (oldState === 'guest' && newState === 'auth') {
      try {
        await cartStore.attach()
        logger.debug('Cart attached to user account', {
          userId: authStore.user?.id
        })
      } catch (error) {
        logger.error('Failed to attach cart to user account', error)
        // Don't block navigation, but log error
      }
    }
    
    // When transitioning from auth to guest, clear cart
    if (oldState === 'auth' && newState === 'guest') {
      cartStore.clear()
    }
  }, { immediate: false })
})
```

**Dependencies:**
- Auth store (Phase 1.1)
- Cart store
- Auth middleware

**Technical Notes:**
- Cart attachment happens automatically in middleware, not in UI components
- Middleware runs on every route change, ensuring cart sync
- Cart attachment is non-blocking (errors don't prevent navigation)
- State changes trigger cart sync automatically
- This removes cart sync logic from login/register components

---

### 1.3 OAuth Authentication (NEW - High Priority)

**Status:** ❌ **NOT DONE** - Not implemented yet

**Endpoints:**
- `GET /oauth/{provider}/redirect` - Initiate OAuth flow
- `GET /oauth/{provider}/callback` - Handle OAuth callback

**Implementation Tasks:**
- [ ] Install and configure Nuxt Auth Utils module
- [ ] Set up OAuth providers (Google, Facebook) in Nuxt config
- [ ] Create OAuth composable (`useOAuth.ts`) using Nuxt Auth Utils
- [ ] Add OAuth provider types (Google, Facebook)
- [ ] Implement OAuth redirect handler
- [ ] Implement OAuth callback handler
- [ ] Update auth store to handle OAuth login/registration (using state machine)
- [ ] Update auth store to handle account linking (using state machine)
- [ ] Add OAuth buttons to login/register pages
- [ ] Add account linking UI in profile settings
- [ ] Handle OAuth errors and edge cases

**Dependencies:**
- Auth store (with state machine - Phase 1.1)
- Profile store
- Cart store (for session sync - Phase 1.2)
- Auth middleware (Phase 1.2)
- Frontend callback URL configuration
- Nuxt Auth Utils module

**Technical Notes:**
- OAuth flow works for both unauthenticated (login/register) and authenticated (link account) users
- Frontend must handle redirects with success/error query parameters
- Need to configure frontend callback URLs in backend
- OAuth state transitions use auth state machine (Phase 1.1)
- Cart sync happens automatically via middleware (Phase 1.2)
- Nuxt Auth Utils provides built-in OAuth flow management

---

### 1.2 Password & Email Management (NEW - Medium Priority)

**Endpoints:**
- `POST /change-password/request` - Request password change
- `POST /change-password/confirm/{token}` - Confirm password change
- `POST /change-email/request` - Request email change
- `POST /change-email/confirm/{token}` - Confirm email change

**Implementation Tasks:**
- [ ] Add password change request to auth store
- [ ] Add password change confirmation to auth store
- [ ] Add email change request to auth store
- [ ] Add email change confirmation to auth store
- [ ] Create password change page/component
- [ ] Create email change page/component
- [ ] Add password change UI in profile settings
- [ ] Add email change UI in profile settings
- [ ] Handle confirmation token validation
- [ ] Add success/error messaging

**Dependencies:**
- Auth store
- Profile pages

**Technical Notes:**
- Password change requires current password validation
- Both operations use email confirmation flow
- Tokens are sent via email and must be confirmed

---

## 2. Cart & Checkout Domain

### 2.1 Cart Versioning & Concurrency Control (UPDATED - Critical)

**Status:** ✅ **DONE** - Fully Implemented (Needs Refactoring for Phase 2)

**Changed Endpoints:**
- ✅ `GET /api/v1/cart` - Returns version in response
- ✅ `HEAD /api/v1/cart/v` - Get cart version only
- ✅ `POST /api/v1/cart/items` - Requires `If-Match` header
- ✅ `PATCH /api/v1/cart/items/{itemId}` - Changed from PUT, requires `If-Match`
- ✅ `DELETE /api/v1/cart/items/{itemId}` - Requires `If-Match` header
- ✅ `PATCH /api/v1/cart/items/{itemId}/options` - Changed from PUT, requires `If-Match`
- ✅ `POST /api/v1/cart/coupons` - Requires `If-Match` header
- ✅ `DELETE /api/v1/cart/coupons/{code}` - Requires `If-Match` header

**Implementation Tasks:**
- [x] ✅ Update cart store to track cart version
- [x] ✅ Add `fetchCartVersion()` method to cart store
- [x] ✅ Add `ensureCartVersion()` method with fallback
- [x] ✅ Add `Idempotency-Key` support
- [x] ✅ Update all cart mutation methods with If-Match headers
- [x] ✅ Handle 409 Conflict (version mismatch) with retry logic
- [x] ✅ Update cart response type to include `version` field
- [x] ✅ Add version mismatch error handling
- [x] ✅ Update cart item update method (PUT → PATCH)
- [x] ✅ Update cart options method (PUT → PATCH)
- [x] ✅ Version tracking in state and response headers
- [ ] 🔄 **Phase 2 Refactoring:** Remove manual `If-Match` and retry logic (move to interceptor)
- [ ] 🔄 **Phase 2 Refactoring:** Implement optimistic UI updates with `useOptimistic` pattern

**Verified in:** `app/stores/cart.store.ts`

**Dependencies:**
- Cart store
- `useApi()` composable
- Error handling utilities
- Auto-retry interceptor (Phase 0.2)

**Technical Notes:**
- Cart version is returned in response headers (`X-Cart-Version`) and body
- Version mismatch (409) requires fetching latest cart and retrying
- `Idempotency-Key` prevents duplicate operations on retry
- All cart mutations invalidate checkout sessions
- **Phase 2:** Manual retry logic will be moved to auto-retry interceptor (Phase 0.2)
- **Phase 2:** Optimistic UI will provide instant feedback before server confirmation

---

### 2.2 Checkout API Updates (UPDATED - High Priority)

**Status:** 🟡 **PARTIAL** - Mostly Done, Some Updates Needed

**Changed Endpoints:**
- ✅ `POST /api/v1/checkout/start` - Accepts `billing_same_as_shipping`
- 🟡 `PUT /api/v1/checkout/{id}/shipping-method` - Needs warehouse metadata support
- 🟡 `GET /api/v1/shipping/methods` - Needs checkout_session_id parameter

**Implementation Tasks:**
- [x] ✅ Update checkout store `startCheckout()` to accept `billing_same_as_shipping`
- [x] ✅ Update checkout store `applyShippingMethod()` to use `method_code` and `quote_id`
- [ ] 🟡 Add `provider_metadata.warehouse_external_id` support to shipping method
- [x] ✅ Update shipping methods fetch to use `dest.*` query parameters
- [ ] 🟡 Update shipping methods fetch to use `checkout_session_id` (currently uses cart token)
- [x] ✅ Update checkout flow UI to collect destination details
- [x] ✅ Update shipping method selection to use quote_id
- [ ] ❌ Add warehouse/pickup point selection for warehouse methods
- [x] ✅ Update checkout types to match new API structure

**Verified in:** `app/stores/checkout.store.ts` - Lines 157-383

**Dependencies:**
- Checkout store
- Shipping store
- Checkout pages/components

**Technical Notes:**
- Shipping quotes are cached for 15 minutes (900 seconds)
- Quote IDs must be used when setting shipping method
- Warehouse selection is required for warehouse shipping methods

---

## Phase 2: Cart & Checkout (Clean Architecture)

**Goal:** Рефакторинг корзины и чекаута с чистой архитектурой, оптимистичным UI и feature flags.

**Status:** ❌ **NOT DONE** - Refactoring planned for Phase 2

### 2.3 Store Cleanup (NEW - High Priority)

**Implementation Tasks:**
- [ ] **Lean Stores:** Remove manual `If-Match` header logic from cart store
- [ ] **Lean Stores:** Remove manual retry logic from cart store
- [ ] **Lean Stores:** Remove `ensureCartVersion()` method (handled by network layer)
- [ ] **Lean Stores:** Remove `version refresh` logic (handled by auto-retry interceptor)
- [ ] Move all version handling to network layer (Phase 0.2)
- [ ] Update cart store methods to be simpler (no manual retry/version logic)
- [ ] Test store methods with network layer retry
- [ ] Ensure stores work correctly with automatic version management

---

### 2.4 Optimistic UI with Rollback (NEW - High Priority)

**Implementation Tasks:**
- [ ] Add Feature Flag `cart_optimistic_ui` in `app.config.ts`
- [ ] Implement optimistic UI mechanism for cart operations
- [ ] Implement state rollback on 409/422 errors
- [ ] Add rollback error handling and user notification
- [ ] Implement `useOptimistic` pattern for cart item quantity updates
- [ ] Add instant UI feedback for add/remove/update operations
- [ ] Show loading states during optimistic updates
- [ ] Test optimistic updates with network throttling
- [ ] Ensure optimistic updates work with SSR/CSR
- [ ] Apply optimistic UI to favorites, comparison, and other instant actions (if flag enabled)

**Feature Flag Configuration:**

```typescript
// app.config.ts
export default defineAppConfig({
  features: {
    cart_optimistic_ui: {
      enabled: process.env.FEATURE_CART_OPTIMISTIC_UI === 'true',
      description: 'Enable optimistic UI updates for cart operations'
    }
  }
})
```

**Optimistic UI Implementation Pattern:**

```typescript
// app/stores/cart.store.ts
async addItem(payload: AddToCartPayload) {
  const config = useAppConfig()
  const previousCart = { ...this.cart }
  
  // Optimistic update (if feature flag enabled)
  if (config.features.cart_optimistic_ui.enabled) {
    this.cart = {
      ...this.cart,
      items: [...this.cart.items, { ...payload, id: 'temp-' + Date.now() }]
    }
  }
  
  this.loading = true
  try {
    // Network layer handles If-Match and retry automatically
    this.cart = await useApi().post('/cart/items', { body: payload })
  } catch (error) {
    // Rollback on error (409/422)
    if (config.features.cart_optimistic_ui.enabled) {
      if (isConcurrencyEvent(error) || isValidationError(error)) {
        this.cart = previousCart // Rollback optimistic update
        showNotification('Cart was updated, please try again', 'error')
      }
    }
    throw error
  } finally {
    this.loading = false
  }
}
```

**Dependencies:**
- Auto-retry interceptor (Phase 0.2)
- Error taxonomy (Phase 0.3)
- Feature flags configuration (Phase 4)
- Cart store (current implementation)

**Technical Notes:**
- **Feature Flag:** `cart_optimistic_ui` controls optimistic UI behavior
- **Optimistic UI:** Updates UI immediately, then syncs with server response
- **Rollback:** On 409/422 errors, rollback to previous state and show error
- **Error Handling:** Uses error taxonomy (ConcurrencyEvent, ValidationError) for type-safe rollback
- Improves perceived performance significantly
- All retry and version logic handled by infrastructure layer (Phase 0)
- **Code reduction:** Store methods become 70-80% shorter and more readable

---

### 2.5 Checkout Refactoring (NEW - High Priority)

**Implementation Tasks:**
- [ ] **Modular Architecture:** Split checkout logic into independent modules:
  - City selection module
  - Warehouse/pickup point selection module
  - Delivery method selection module
- [ ] Create `useCheckoutCity()` composable
- [ ] Create `useCheckoutWarehouse()` composable
- [ ] Create `useCheckoutDelivery()` composable
- [ ] Refactor checkout store to use modular composables
- [ ] Update checkout UI to use modular components
- [ ] Ensure modules are independent and testable
- [ ] Add error handling for each module

**Implementation Pattern:**

```typescript
// app/composables/checkout/useCheckoutCity.ts
export function useCheckoutCity() {
  const checkoutStore = useCheckoutStore()
  
  const searchCities = async (query: string) => {
    // City search logic
  }
  
  const selectCity = (city: City) => {
    checkoutStore.setShippingCity(city)
    // Trigger warehouse search for selected city
  }
  
  return {
    searchCities,
    selectCity,
    selectedCity: computed(() => checkoutStore.shippingCity)
  }
}

// app/composables/checkout/useCheckoutWarehouse.ts
export function useCheckoutWarehouse() {
  const checkoutStore = useCheckoutStore()
  
  const searchWarehouses = async (cityId: string) => {
    // Warehouse search logic
  }
  
  const selectWarehouse = (warehouse: Warehouse) => {
    checkoutStore.setShippingWarehouse(warehouse)
  }
  
  return {
    searchWarehouses,
    selectWarehouse,
    selectedWarehouse: computed(() => checkoutStore.shippingWarehouse)
  }
}

// app/composables/checkout/useCheckoutDelivery.ts
export function useCheckoutDelivery() {
  const checkoutStore = useCheckoutStore()
  
  const fetchDeliveryMethods = async () => {
    // Delivery methods logic
  }
  
  const selectDeliveryMethod = (method: DeliveryMethod) => {
    checkoutStore.setShippingMethod(method)
  }
  
  return {
    fetchDeliveryMethods,
    selectDeliveryMethod,
    selectedMethod: computed(() => checkoutStore.shippingMethod)
  }
}
```

**Dependencies:**
- Checkout store
- Shipping search (Phase 4)
- Checkout components

**Technical Notes:**
- **Modular Architecture:** Each step (City → Warehouse → Delivery) is independent
- Modules can be tested separately
- Modules can be reused in different contexts
- Clear separation of concerns
- Easy to add new checkout steps or modify existing ones

---

## 3. Catalog & Products Domain

### 3.1 Search Suggestions / Autocomplete (NEW - High Priority)

**Status:** ✅ **DONE** - Fully Implemented

**Endpoints:**
- ✅ `GET /api/v1/catalog/suggest` - Fully implemented

**Implementation Tasks:**
- [x] ✅ `LiveSearch` component uses `/catalog/suggest` endpoint
- [x] ✅ Search suggestions types defined
- [x] ✅ Suggestion display with phrases, variants, brands, categories
- [x] ✅ Search history support
- [x] ✅ Favorite flags when `X-Guest-Id` available
- [x] ✅ Suggestion selection and navigation
- [x] ✅ Debouncing (300ms)
- [x] ✅ Loading states
- [x] ✅ Keyboard navigation
- [x] ✅ Empty state handling

**Verified in:** `app/components/search/LiveSearch.vue` - Lines 119-140

**Dependencies:**
- Catalog store
- Favorites store
- LiveSearch component

**Technical Notes:**
- History only contains "confirmed" searches (from actual catalog searches)
- Suggestions are ranked by relevance score
- Variant limit: 1-10 (default: 5)
- Suggestions limit: 1-10 (default: 5)

---

### 3.2 Catalog API Response Updates (UPDATED - Medium Priority)

**Changed Endpoints:**
- All catalog endpoints now return more detailed response structures

**Implementation Tasks:**
- [ ] Review and update catalog types to match new response structures
- [ ] Update catalog store to handle new response formats
- [ ] Update product card components if needed
- [ ] Update category components if needed

**Dependencies:**
- Catalog store
- Product components
- Type definitions

---

## Phase 3: Rendering & Performance

**Goal:** Оптимизация рендеринга, SEO и производительности через гибридный рендеринг и серверные компоненты.

**Status:** ❌ **NOT DONE** - Advanced features planned for Phase 3

### 3.3 SEO Migration (NEW - High Priority)

**Implementation Tasks:**
- [ ] **Remove SEO Store:** Delete `seo.store.ts` and all `apply()` logic
- [ ] **Declarative SEO:** Migrate all pages from Pinia SEO store to `useSeoMeta()`
- [ ] **Declarative SEO:** Use `useSeoMeta()` in page components directly
- [ ] **Declarative SEO:** Add structured data via `useSchemaOrg()`
- [ ] Update all page components to use `useSeoMeta()`
- [ ] Remove SEO store imports from all components
- [ ] Test SEO meta tags on all pages
- [ ] Verify structured data generation

**Implementation Pattern:**

```typescript
// Before (Pinia SEO Store)
// app/pages/product/[slug].vue
const seoStore = useSeoStore()
seoStore.apply({
  title: product.name,
  description: product.description,
  // ...
})

// After (Declarative SEO)
// app/pages/product/[slug].vue
useSeoMeta({
  title: product.name,
  description: product.description,
  ogTitle: product.name,
  ogDescription: product.description,
  ogImage: product.image,
  // ...
})

useSchemaOrg([
  defineProduct({
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      price: product.price.amount,
      priceCurrency: product.price.currency
    }
  })
])
```

**Dependencies:**
- SEO store (to be removed)
- All page components
- Nuxt SEO module

**Technical Notes:**
- **Declarative SEO:** `useSeoMeta()` is more performant and type-safe than Pinia
- **Declarative SEO:** SEO data is co-located with page components (better DX)
- **Structured Data:** `useSchemaOrg()` provides automatic structured data generation
- No need for store actions or state management for SEO
- Better SSR performance (no store hydration needed)

---

### 3.4 Nitro Debounce (NEW - High Priority)

**Implementation Tasks:**
- [ ] **Nitro Endpoint:** Create proxy endpoint for warehouse search with server-side debounce
- [ ] **Caching:** Implement caching for search results in Nitro endpoint
- [ ] **Debounce Logic:** Implement debounce logic in Nitro (not client-side)
- [ ] Update shipping search composable to use Nitro endpoint
- [ ] Update checkout components to use debounced search
- [ ] Test debounce behavior and caching
- [ ] Performance testing

**Implementation Pattern:**

```typescript
// server/api/shipping/search.ts
import { debounce } from 'lodash-es'

const searchCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cacheKey = JSON.stringify(query)
  
  // Check cache
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Debounce on server side
  const debouncedSearch = debounce(async () => {
    const api = useApi()
    const results = await api.get('/shipping/warehouses/search', { query })
    
    // Cache results
    searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    })
    
    return results
  }, 300) // 300ms debounce
  
  return await debouncedSearch()
})
```

**Dependencies:**
- Shipping search (Phase 4)
- Checkout components
- Nitro server

**Technical Notes:**
- **Server-Side Debounce:** Debounce happens on server, reducing API calls
- **Caching:** Search results are cached for 5 minutes
- **Performance:** Reduces load on backend API
- **Client-Side:** Client just calls Nitro endpoint, no debounce logic needed
- Better user experience (faster responses from cache)

---

### 3.5 Server Components (NEW - High Priority)

**Implementation Tasks:**
- [ ] **Server Components:** Create experimental `.server.vue` components for catalog filters
- [ ] **Server Components:** Move heavy filter logic to server components
- [ ] **Server Components:** Test server component performance vs client components
- [ ] Update catalog pages to use server components for filters
- [ ] Measure bundle size reduction
- [ ] Performance testing and optimization

**Implementation Pattern:**

```typescript
// app/components/catalog/FiltersSidebar.server.vue
<script setup lang="ts">
// This component runs only on server
// Heavy filtering, sorting, aggregation logic here
const props = defineProps<{
  filters: FilterParams
}>()

const { data: filteredProducts } = await useAsyncData('filtered-products', () => {
  // Heavy computation on server
  return computeFilteredProducts(props.filters)
})
</script>

<template>
  <div>
    <!-- Filter UI rendered on server -->
    <!-- No client-side JavaScript for filtering -->
  </div>
</template>
```

**Dependencies:**
- Catalog store
- Catalog pages
- Nuxt 4 server components support

**Technical Notes:**
- **Server Components:** `.server.vue` components run only on server, reduce bundle size
- **Heavy Computations:** Ideal for filtering, sorting, aggregations
- **Bundle Size:** Reduces client-side JavaScript bundle
- **Performance:** Faster initial render (computation on server)
- **Hydration:** No hydration needed for server components

---

## 4. User Account & Profile Domain

### 4.1 Loyalty Points System (NEW - Medium Priority)

**Endpoints:**
- `GET /api/v1/loyalty` - Get loyalty account details
- `GET /api/v1/loyalty/history` - Get transaction history

**Implementation Tasks:**
- [ ] Create loyalty store (`loyalty.store.ts`)
- [ ] Add loyalty types
- [ ] Implement `fetchLoyaltyAccount()` action
- [ ] Implement `fetchLoyaltyHistory()` action with pagination
- [ ] Create loyalty account page/component
- [ ] Create loyalty history page/component
- [ ] Add loyalty balance display in profile
- [ ] Add loyalty points display in order summary
- [ ] Format loyalty amounts (currency formatting)
- [ ] Handle transaction types (Accrual/Spending)
- [ ] Add expiration date display for accruals

**Dependencies:**
- Profile pages
- Orders store (for order summary)
- Format utilities

**Technical Notes:**
- Balance includes both active and pending amounts
- Transactions show formatted amounts with +/- signs
- History is paginated

---

## 5. Content Domain (Blog, Reviews, Comments)

### 5.1 Reviews System (NEW - High Priority)

**Status:** 🟡 **PARTIAL** - Mostly Done, Missing Replies

**Endpoints:**
- ✅ `GET /api/v1/reviews` - Implemented
- ✅ `POST /api/v1/reviews` - Implemented
- ❌ `POST /api/v1/reviews/{review_id}/replies` - Not implemented

**Implementation Tasks:**
- [x] ✅ Create reviews store (`reviews.store.ts`)
- [x] ✅ Add review types
- [x] ✅ Implement `fetchReviews()` action with pagination
- [x] ✅ Implement `createReview()` action
- [ ] ❌ Implement `createReply()` action
- [x] ✅ Update `ProductReviews` component to use new store
- [x] ✅ Update `ReviewForm` component
- [ ] ❌ Add reply functionality to review items
- [x] ✅ Handle review moderation (pending status)
- [x] ✅ Add rating validation (1-5)
- [x] ✅ Add pros/cons fields to review form
- [x] ✅ Update product page to show reviews
- [ ] 🟡 Add review count to product cards (may need verification)
- [x] ✅ Handle "one review per product" validation

**Verified in:** `app/stores/reviews.store.ts`, `app/components/product/ProductReviews.vue`

**Dependencies:**
- Product store
- Product pages
- Review components

**Technical Notes:**
- Only approved and active reviews are returned
- Users can leave only one review per product
- Replies are active by default
- Uses simple pagination (current_page, has_more_pages)

---

### 5.2 Comments System (NEW - Medium Priority)

**Status:** ✅ **DONE** - Fully Implemented

**Endpoints:**
- 🟡 `GET /api/v1/comments/types` - Endpoint exists, may not be used in UI
- ✅ `GET /api/v1/comments` - Implemented
- ✅ `POST /api/v1/comments` - Implemented

**Implementation Tasks:**
- [x] ✅ Create comments store (`comments.store.ts`)
- [x] ✅ Add comment types
- [ ] 🟡 Implement `fetchCommentTypes()` action (endpoint exists but may not be used)
- [x] ✅ Implement `fetchComments()` action with pagination
- [x] ✅ Implement `createComment()` action
- [x] ✅ Update `BlogComments` component to use new store
- [x] ✅ Update `BlogCommentForm` component
- [x] ✅ Add nested replies display
- [x] ✅ Add comment threading (parent_id)
- [x] ✅ Handle comment approval status
- [x] ✅ Update blog post pages to show comments
- [x] ✅ Add comment count display
- [x] ✅ Add comment moderation handling

**Verified in:** `app/stores/comments.store.ts`, `app/components/blog/BlogComments.vue`, `app/components/product/ProductComments.vue`

**Dependencies:**
- Blog store
- Blog pages
- Comment components

**Technical Notes:**
- Currently supports "blog:post" type
- Comments support nested replies
- Only approved comments are returned
- Uses simple pagination

---

### 5.3 Blog API Updates (UPDATED - Low Priority)

**Changed Endpoints:**
- `GET /api/v1/blog/posts` - Added `sort` parameter (newest/oldest)

**Implementation Tasks:**
- [ ] Update blog store to support sort parameter
- [ ] Add sort dropdown to blog listing page
- [ ] Update blog types if needed

**Dependencies:**
- Blog store
- Blog pages

---

## 6. Notifications Domain

### 6.1 Notifications API Updates (UPDATED - Medium Priority)

**Status:** 🟡 **PARTIAL** - Mostly Done, Missing Filter & Preferences Matrix

**Changed Endpoints:**
- 🟡 `GET /api/v1/notifications` - Missing `filter` parameter support
- ❌ `GET /api/v1/notifications/preferences` - Not implemented (GET version)
- ✅ `PUT /api/v1/notifications/preferences/{channel}/{group}` - Implemented

**Implementation Tasks:**
- [ ] ❌ Update notifications store to support `filter` parameter (currently client-side filtering)
- [ ] ❌ Add `fetchPreferences()` action to get preferences matrix
- [x] ✅ Update `updateChannelPreference()` action with new structure
- [ ] ❌ Add filter tabs/buttons to notifications page (All/Unread/Archived)
- [ ] ❌ Create notification preferences page/component
- [ ] ❌ Display preferences matrix (channels and groups)
- [x] ✅ Add toggle functionality for preferences
- [x] ✅ Update notification types to match new response structure
- [x] ✅ Handle preference update responses

**Verified in:** `app/stores/notifications.store.ts` - Lines 72-242

**Dependencies:**
- Notifications store
- Notifications pages
- Profile pages (for preferences)

**Technical Notes:**
- Preferences are organized by channel (Email, Database, Broadcast) and group (System, etc.)
- Each preference can be toggled independently
- Preferences include link/unlink status for contact channels

---

## 7. Shipping & Delivery Domain

### 7.1 Shipping Settlements & Warehouses Search (NEW - High Priority)

**Status:** ❌ **NOT DONE** - Planned for Phase 4

**Endpoints:**
- `GET /api/v1/shipping/{provider_code}/settlements/search` - Search cities
- `GET /api/v1/shipping/{provider_code}/warehouses/search` - Search warehouses

**Implementation Tasks:**
- [ ] Create shipping search composable (`useShippingSearch.ts`)
- [ ] Add shipping search types
- [ ] **Phase 4:** Implement `searchSettlements()` using `useAsyncData` with reactive `watch`
- [ ] **Phase 4:** Implement debounce at Nitro level (server-side debouncing)
- [ ] **Phase 4:** Use `watch` on input field to trigger `refresh()` on `useAsyncData`
- [ ] Implement `searchWarehouses()` function
- [ ] Create city search component for checkout
- [ ] Create warehouse/pickup point selection component
- [ ] Add autocomplete for city search
- [ ] Add warehouse list with filtering
- [ ] Integrate into checkout shipping step
- [ ] Handle provider-specific search (Nova Post, etc.)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Cache search results appropriately

**Dependencies:**
- Checkout store
- Checkout pages
- Shipping components
- `useAsyncData` composable
- Nitro server functions

**Technical Notes:**
- Settlements search supports city name or postal index
- Warehouses search requires city_external_id from settlements
- Warehouses are filtered by cargo dimensions/weight automatically
- Both endpoints support pagination
- **Phase 4:** Use `useAsyncData` with `watch` for reactive search (better than manual debounce)
- **Phase 4:** Debounce should be handled server-side in Nitro endpoint for better performance
- **Phase 4:** Pattern: `watch(input, () => refresh())` triggers search on input change

---

## 8. Payments Domain

### 8.1 Payments API Updates (UPDATED - High Priority)

**Changed Endpoints:**
- `POST /api/v1/payments/init` - Changed from `/api/v1/payments/{provider}/init`
- Response structure updated

**Implementation Tasks:**
- [ ] Update payments store to use new endpoint path
- [ ] Update `initiatePayment()` action
- [ ] Update payment types to match new response
- [ ] Add `Idempotency-Key` header support
- [ ] Update checkout payment step
- [ ] Handle new response structure (payment_intent_id, status, payment_url)
- [ ] Update payment redirect logic
- [ ] Test payment flow end-to-end

**Dependencies:**
- Payments store
- Checkout store
- Checkout pages

**Technical Notes:**
- Provider code is now optional (uses default if not specified)
- Response includes payment_intent_id for tracking
- Payment URL is provided for redirect

---

## 9. Orders Domain

### 9.1 Orders API Updates (UPDATED - Medium Priority)

**Endpoints:**
- `GET /api/v1/orders/statuses` - NEW: Get order statuses
- `GET /api/v1/orders` - Added `statuses` filter parameter
- `GET /api/v1/orders/{id}` - Enhanced response structure

**Implementation Tasks:**
- [ ] Add `fetchOrderStatuses()` action to orders store
- [ ] Update `fetchOrders()` to support status filtering
- [ ] Update order types to match enhanced response
- [ ] Add order status filter to orders list page
- [ ] Update order details page to show:
  - Enhanced item details (options, loyalty discounts)
  - Shipment tracking information
  - Payment intent status
  - Enhanced totals breakdown
- [ ] Add order status badge/display
- [ ] Update order card components

**Dependencies:**
- Orders store
- Orders pages
- Order components

**Technical Notes:**
- Order statuses are returned as array with id and title
- Orders can be filtered by multiple status IDs
- Order details include shipment tracking URLs

---

## 10. Marketing & Audience Domain

### 10.1 Audience API Updates (UPDATED - Medium Priority)

**Changed Endpoints:**
- `GET /api/v1/audience/confirm` - Changed from POST to GET (signed URL)
- `GET /api/v1/audience/unsubscribe` - NEW: Signed URL version
- `POST /api/v1/audience/unsubscribe` - NEW: From authenticated account
- `POST /api/v1/audience/webhooks/{provider}` - NEW: Webhook handler

**Implementation Tasks:**
- [ ] Update audience store to handle signed URL confirm/unsubscribe
- [ ] Add `unsubscribeFromAccount()` action for authenticated users
- [ ] Create email confirmation page (handles redirect from signed URL)
- [ ] Create unsubscribe page (handles redirect from signed URL)
- [ ] Add unsubscribe option in profile/account settings
- [ ] Update newsletter forms to handle new response messages
- [ ] Test signed URL flows

**Dependencies:**
- Audience store
- Profile pages
- Newsletter components

**Technical Notes:**
- Confirm and unsubscribe use signed URLs (GET requests)
- Signed URLs redirect to frontend pages
- Authenticated users can unsubscribe via POST endpoint
- Webhook endpoint is for internal use only

---

### 10.2 Banners API (NEW - Low Priority)

**Status:** ✅ **DONE** - Fully Implemented

**Endpoints:**
- ✅ `GET /api/v1/banners/homepage` - Implemented

**Implementation Tasks:**
- [x] ✅ Banners fetched on homepage (SSR)
- [x] ✅ Add banner types
- [x] ✅ Update `BannerSlideshow` component
- [x] ✅ Handle banner images (desktop/mobile)
- [x] ✅ Add banner positioning/sorting
- [x] ✅ Add banner link handling
- [x] ✅ Handle empty state

**Verified in:** `app/pages/index.vue` - Lines 18-37, `app/components/banner/BannerSlideshow.vue`

**Dependencies:**
- Homepage
- Banner components

**Technical Notes:**
- Returns only Hero type banners
- Banners include desktop and mobile image variants
- Position field determines display order

---

## 11. Site Configuration Domain

### 11.1 Site API Updates (UPDATED - Medium Priority)

**Status:** 🟡 **PARTIAL** - Menu Done, Contacts Missing

**Endpoints:**
- ✅ `GET /api/v1/site/menus/tree` - Implemented
- ❌ `GET /api/v1/site/contacts` - Not implemented

**Implementation Tasks:**
- [x] ✅ Menu fetched in `AppHeader` component
- [x] ✅ Add site types (menu)
- [x] ✅ Update `MegaMenu` component to use API menu
- [x] ✅ Update `MobileMenu` component to use API menu
- [x] ✅ Handle menu nesting and children
- [x] ✅ Handle menu banners (desktop/mobile)
- [x] ✅ Handle menu icons and CSS classes
- [ ] ❌ Create site store (`site.store.ts`) - Currently fetched in component
- [ ] ❌ Implement `fetchContacts()` action
- [ ] ❌ Create contacts display component
- [ ] ❌ Add contacts to footer

**Verified in:** `app/components/layout/AppHeader.vue` - Line 253

**Dependencies:**
- Layout components
- Footer component
- Menu components

**Technical Notes:**
- Menu is localized based on Accept-Language header
- Menu supports nested children (multi-level)
- Contacts include translatable fields
- Contacts include messengers and socials arrays

---

### 11.2 App API Updates (UPDATED - Low Priority)

**Status:** ✅ **DONE** - Fully Implemented

**Endpoints:**
- ✅ `GET /api/v1/app/currencies` - Implemented

**Implementation Tasks:**
- [x] ✅ Update system store to use new endpoint
- [x] ✅ Currency fetching implemented

**Verified in:** `app/stores/system.store.ts` - Lines 122-128

**Dependencies:**
- System store
- Currency components

---

## 12. Support & Leads Domain

### 12.1 Customer Support Updates (UPDATED - Low Priority)

**Status:** 🟡 **PARTIAL** - Missing Request Types

**Endpoints:**
- ✅ `POST /api/v1/customer-support/requests` - Implemented
- ❌ `GET /api/v1/customer-support/requests/types` - Not implemented

**Implementation Tasks:**
- [x] ✅ Support request submission implemented
- [ ] ❌ Add `fetchRequestTypes()` action to support store
- [ ] ❌ Update contact form to use request types
- [ ] ❌ Add request type dropdown to contact form
- [ ] ❌ Update support types

**Verified in:** `app/stores/support.store.ts`

**Dependencies:**
- Support store
- Contact page

---

### 12.2 Leads API Updates (UPDATED - Low Priority)

**Changed Endpoints:**
- `POST /api/v1/leads` - Enhanced with product items support

**Implementation Tasks:**
- [ ] Review leads endpoint usage
- [ ] Update leads types if needed
- [ ] Update lead submission if product items are needed

**Dependencies:**
- Leads/contact forms

---

### 12.3 Form Validation with Zod (Phase 4 - Medium Priority)

**Status:** ❌ **NOT DONE** - Planned for Phase 4

**Implementation Tasks:**
- [ ] Install and configure Zod validation library
- [ ] Create Zod schemas for review forms
- [ ] Create Zod schemas for comment forms
- [ ] Create Zod schemas for contact/support forms
- [ ] Create Zod schemas for checkout forms
- [ ] Integrate Zod validation in form components
- [ ] Add client-side validation before API submission
- [ ] Display validation errors in UI
- [ ] Create reusable validation composable (`useFormValidation.ts`)
- [ ] Type-safe form validation with TypeScript
- [ ] Test validation edge cases

**Dependencies:**
- Review forms
- Comment forms
- Contact forms
- Checkout forms
- Zod library

**Technical Notes:**
- Zod provides runtime type validation and TypeScript type inference
- Client-side validation reduces unnecessary API calls
- Validation schemas can be shared between client and server
- Better error messages and user experience
- Type-safe forms with automatic TypeScript types

---

## Phase 4: Documentation & Support

**Goal:** Документация архитектурных решений и конфигурация feature flags.

**Status:** ❌ **NOT DONE** - Documentation and support features

### 4.1 ADR Creation (NEW - Medium Priority)

**Implementation Tasks:**
- [ ] **ADR 001:** Write Architecture Decision Record for Network Layer
- [ ] **ADR 002:** Write Architecture Decision Record for Cart Concurrency
- [ ] **ADR 003:** Write Architecture Decision Record for Optimistic UI
- [ ] Create ADR template
- [ ] Document decision context, consequences, and alternatives
- [ ] Add ADR directory structure (`docs/adr/`)

**ADR Structure:**

```markdown
# ADR 001: Network Layer Architecture

## Status
Accepted

## Context
We need a centralized network layer that handles concurrency, idempotency, and error retry automatically.

## Decision
Implement smart network layer using `ofetch.create()` with interceptors for:
- Automatic `If-Match` header management
- Automatic retry on 409/419 errors
- Idempotency key generation and persistence

## Consequences
- Stores become 70-80% shorter
- HTTP concerns centralized in network layer
- Better error handling and retry logic
- Easier to add new features without worrying about headers/retries

## Alternatives Considered
- Manual header management in stores (rejected - too verbose)
- Separate retry utility (rejected - not integrated enough)
```

**Dependencies:**
- Phase 0 (Network Layer implementation)
- Phase 2 (Cart Concurrency, Optimistic UI)

**Technical Notes:**
- **ADR 001:** Documents the smart network layer architecture
- **ADR 002:** Documents cart versioning and concurrency control
- **ADR 003:** Documents optimistic UI pattern with rollback
- ADRs help future developers understand architectural decisions
- ADRs should be brief and focused on one decision

---

### 4.2 Feature Flags Configuration (NEW - High Priority)

**Implementation Tasks:**
- [ ] Configure feature flags in `app.config.ts`
- [ ] Add `cart_optimistic_ui` feature flag
- [ ] Create feature flag utilities (`useFeatureFlag()` composable)
- [ ] Document feature flag usage
- [ ] Add environment variable support for feature flags
- [ ] Add feature flag toggles in admin/development mode

**Implementation Pattern:**

```typescript
// app.config.ts
export default defineAppConfig({
  features: {
    cart_optimistic_ui: {
      enabled: process.env.FEATURE_CART_OPTIMISTIC_UI === 'true' || false,
      description: 'Enable optimistic UI updates for cart operations',
      version: '2.0.0'
    },
    // Add more feature flags as needed
  }
})

// app/composables/useFeatureFlag.ts
export function useFeatureFlag(flagName: keyof AppConfig['features']) {
  const config = useAppConfig()
  const feature = config.features[flagName]
  
  return {
    enabled: feature?.enabled ?? false,
    description: feature?.description,
    version: feature?.version
  }
}

// Usage in stores
const { enabled: optimisticUI } = useFeatureFlag('cart_optimistic_ui')
if (optimisticUI) {
  // Apply optimistic update
}
```

**Dependencies:**
- App config
- Feature flag utilities

**Technical Notes:**
- Feature flags allow gradual rollout of new features
- Flags can be controlled via environment variables
- Flags can be toggled in development/admin mode
- Feature flags enable A/B testing and gradual feature releases
- Flags should be documented with description and version

---

## Implementation Phases

### Phase 0: Network & Error Taxonomy (Week 1)
**Goal:** Подготовка "умного" сетевого слоя для автоматизации Concurrency и Idempotency с четкой таксономией ошибок.

1. **Ofetch Hardening** - Retry strategy: 409 (max 3), 419 (max 1), fixed Idempotency-Key for retry cycle, logger.debug for retry events
2. **Error Taxonomy** - Update `utils/errors.ts` with `ConcurrencyEvent`, `ValidationError`, `SessionError`
3. **Type Generation** - Set up automatic type generation from Swagger/OpenAPI

**Dependencies:** None (foundation layer)

---

### Phase 0.5: Type Integrity
**Goal:** Обеспечение строгой типизации с изоляцией DTO и запретом использования OpenAPI-типов в UI.

1. **DTO Isolation** - Configure OpenAPI type generation only for request/response DTOs
2. **Strict DI** - Bind types to `useApi<T>()`, prohibit OpenAPI type imports in UI components (use mappers)

**Dependencies:** Phase 0 (type generation)

---

### Phase 1: Authentication & Global Logic (Week 2)
**Goal:** Реализация состояния авторизации и автоматической синхронизации сессий.

1. **Auth State Machine** - Describe states (guest, auth, linking) in `auth.store.ts`
2. **Middleware Sync** - Move `cart.attach()` from UI to `auth.global.ts` middleware
3. **OAuth Authentication** - Implement OAuth using Nuxt Auth Utils with state machine

**Dependencies:** Phase 0 (infrastructure)

---

### Phase 2: Cart & Checkout (Clean Architecture) (Week 3)
**Goal:** Рефакторинг корзины и чекаута с чистой архитектурой, оптимистичным UI и feature flags.

1. **Store Cleanup** - Complete removal of `If-Match` and version refresh from stores (moved to network layer)
2. **Optimistic UI with Rollback** - Add Feature Flag `cart_optimistic_ui`, implement rollback mechanism for 409/422 errors
3. **Checkout Refactoring** - Split logic: City → Warehouse → Delivery into independent modules

**Dependencies:** Phase 0 (auto-retry interceptor, idempotency, error taxonomy), Phase 4 (feature flags)

---

### Phase 3: Rendering & Performance (Week 4)
**Goal:** Оптимизация рендеринга, SEO и производительности через гибридный рендеринг и серверные компоненты.

1. **SEO Migration** - Remove `seo.store.ts` (apply logic), migrate to declarative `useSeoMeta()`
2. **Nitro Debounce** - Implement endpoint-proxy for warehouse search with caching and server-side debounce
3. **Server Components** - Introduce `.server.vue` for heavy catalog filters

**Dependencies:** None (independent feature)

---

### Phase 4: Documentation & Support (Week 5+)
**Goal:** Документация архитектурных решений и конфигурация feature flags.

1. **ADR Creation** - Write 3 brief documents: Network Layer, Cart Concurrency, Optimistic UI
2. **Feature Flags** - Configure flags in `app.config.ts` (e.g., `cart_optimistic_ui`)
3. **Shipping Search** - Implement via `useAsyncData` with reactive `watch` (debounce at Nitro level)
4. **Zod Validation** - Client-side validation for forms (Reviews, Comments, Checkout)
5. Notifications updates (filter parameter, preferences matrix)
6. Orders updates
7. Loyalty points system
8. Site contacts
9. Customer support types
10. Other medium/low priority features

**Dependencies:** Phase 0 (for consistent API patterns), Phase 2 (for feature flags usage)

---

## Testing Checklist

For each implemented feature:
- [ ] Unit tests for stores
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests for critical flows
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Performance testing (for search/autocomplete)
- [ ] Accessibility testing

---

## Notes

- All new endpoints require proper TypeScript type definitions
- All mutations require CSRF token handling
- All authenticated endpoints require cookie-based auth
- Rate limiting should be handled gracefully
- Error messages should be user-friendly
- Loading states should be implemented
- Optimistic UI updates where appropriate (cart, favorites, etc.)

---

**Document Status:** Updated with Nuxt 4 Senior Edition architecture
**Last Review:** Based on latest Scribe documentation + Nuxt 4 phase-based implementation plan
