# Testing Documentation

## Overview

This document provides comprehensive documentation for the testing strategy, structure, and coverage of the Nexora Nuxt 4 E-commerce project.

## Test Structure

The project uses **Vitest** as the testing framework with three distinct test types:

### 1. Unit Tests (`test/unit/`)
- **Location**: `test/unit/`
- **Environment**: Node.js
- **Purpose**: Test pure functions, utilities, and composables in isolation
- **Examples**: 
  - `composables/useDebounce.test.ts`
  - `utils/price.test.ts`
  - `utils/errors.test.ts`
  - `utils/tokens.test.ts`

### 2. Nuxt Component/Store Tests (`test/nuxt/`)
- **Location**: `test/nuxt/`
- **Environment**: Nuxt (via `@nuxt/test-utils`)
- **Purpose**: Test Vue components, Pinia stores, and Nuxt-specific composables
- **Examples**:
  - `stores/auth.store.test.ts`
  - `stores/cart.store.test.ts`
  - `stores/catalog.store.test.ts`
  - `components/cart/CartCounter.test.ts`
  - `components/ui/Price.test.ts`
  - `components/ui/Badge.test.ts`
  - `composables/useApi.test.ts`

### 3. E2E Tests (`test/e2e/`)
- **Location**: `test/e2e/`
- **Environment**: Node.js with Playwright
- **Purpose**: Test full user flows and page rendering
- **Examples**:
  - `home.test.ts`
  - `cart-flow.test.ts`
  - `product-page.test.ts`

## Test Configuration

### Vitest Config (`vitest.config.ts`)

The project uses a multi-project configuration:

```typescript
{
  unit: {
    include: ['test/unit/**/*.{test,spec}.ts'],
    environment: 'node'
  },
  nuxt: {
    include: ['test/nuxt/**/*.{test,spec}.ts'],
    environment: 'nuxt'
  },
  e2e: {
    include: ['test/e2e/**/*.{test,spec}.ts'],
    environment: 'node',
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } }
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit      # Unit tests only
npm run test:nuxt      # Nuxt tests only
npm run test:e2e       # E2E tests only

# Watch mode
npm run test:watch
```

## Current Test Coverage

### ✅ Covered Areas

#### Stores (3/16 stores tested)
- ✅ **auth.store.ts** - Comprehensive coverage
  - Initialization
  - Login/Register/Logout
  - Password reset flow
  - Email verification
  - Address management (CRUD)
  - Getters (isAuthenticated, addresses, etc.)

- ✅ **cart.store.ts** - Comprehensive coverage
  - Initialization and token management
  - Load cart
  - Add/Update/Remove items
  - Coupon application
  - Getters (itemCount, totals, etc.)
  - Error handling (404, IF_MATCH_REQUIRED)

- ✅ **catalog.store.ts** - Comprehensive coverage
  - Fetch categories
  - Fetch products with filters
  - Apply filters and sorting
  - Pagination
  - Getters (rootCategories, hasActiveFilters, etc.)

#### Components (3 components tested)
- ✅ **CartCounter** - Full coverage
  - Rendering
  - Item count display
  - Badge visibility
  - 99+ limit handling
  - Cart loading on mount

- ✅ **Price** - Basic coverage
- ✅ **Badge** - Basic coverage

#### Composables (2/5 tested)
- ✅ **useApi** - Comprehensive coverage
  - Header building
  - URL building
  - HTTP methods (GET, POST, PUT, PATCH, DELETE)
  - Error handling (401, 419 CSRF)
  - Token management

- ✅ **useDebounce** - Full coverage
  - useDebouncedRef
  - useDebounce function
  - useThrottle
  - Cancellation

#### Utils (3/6 tested)
- ✅ **price.test.ts** - Price formatting utilities
- ✅ **errors.test.ts** - Error handling utilities
- ✅ **tokens.test.ts** - Token management utilities

#### E2E (3 pages tested)
- ✅ **Home page** - Basic rendering
- ✅ **Cart page** - Navigation and empty state
- ✅ **Product page** - Route handling and 404

### ❌ Missing Test Coverage

#### Stores (13/16 stores missing tests)
- ❌ **checkout.store.ts** - Critical store, no tests
  - Start checkout
  - Address management
  - Shipping method selection
  - Payment provider selection
  - Checkout confirmation
  - Error handling

- ❌ **product.store.ts** - No tests
  - Fetch product by slug
  - Product variants
  - Related products
  - Product reviews/comments integration

- ❌ **blog.store.ts** - No tests
  - Fetch blog posts
  - Fetch categories
  - Fetch single post
  - Pagination

- ❌ **favorites.store.ts** - No tests
  - Add/Remove favorites
  - Fetch favorites list
  - Token management

- ❌ **comparison.store.ts** - No tests
  - Add/Remove products
  - Fetch comparison list
  - Token management

- ❌ **orders.store.ts** - No tests
  - Fetch orders list
  - Fetch single order
  - Order status tracking

- ❌ **reviews.store.ts** - No tests
  - Submit review
  - Fetch reviews
  - Review moderation

- ❌ **comments.store.ts** - No tests
  - Submit comment
  - Fetch comments
  - Comment threading

- ❌ **audience.store.ts** - No tests
  - Newsletter subscription
  - Audience management

- ❌ **notifications.store.ts** - No tests
  - Notification management
  - Mark as read

- ❌ **support.store.ts** - No tests
  - Support ticket creation
  - Ticket management

- ❌ **seo.store.ts** - No tests
  - SEO metadata management
  - Meta tags

- ❌ **system.store.ts** - No tests
  - System configuration
  - Feature flags

#### Components (30+ components missing tests)
- ❌ **Cart Components**
  - CartItem
  - CartSummary

- ❌ **Product Components**
  - ProductCard
  - ProductReviews
  - ProductComments
  - ReviewForm
  - ReviewItem
  - CommentForm
  - CommentItem

- ❌ **Catalog Components**
  - ProductGrid
  - FiltersSidebar
  - ActiveFilters
  - SortDropdown

- ❌ **Checkout Components**
  - AddressForm
  - OrderSummary
  - PaymentProviderCard
  - ShippingMethodCard

- ❌ **Blog Components**
  - BlogPostCard
  - BlogComments
  - BlogCommentForm
  - BlogCommentItem

- ❌ **Layout Components**
  - AppHeader
  - AppFooter
  - MegaMenu
  - MobileMenu

- ❌ **UI Components**
  - Breadcrumbs
  - Checkbox
  - CurrencySwitcher
  - EmptyState
  - LanguageSwitcher
  - Pagination
  - QuantitySelector
  - Rating
  - Spinner

- ❌ **Other Components**
  - NewsletterForm
  - BannerSlideshow
  - LiveSearch

#### Composables (3/5 missing tests)
- ❌ **useCountries** - Country data management
- ❌ **useLocaleCurrency** - Locale/currency handling
- ❌ **usePagination** - Pagination logic

#### Utils (3/6 missing tests)
- ❌ **format.ts** - Formatting utilities
- ❌ **image.ts** - Image utilities
- ❌ **validator.ts** - Validation utilities
- ❌ **locale-link.ts** - Locale link utilities

#### E2E Tests (20+ pages missing)
- ❌ **Auth Pages**
  - Login flow
  - Registration flow
  - Password reset flow
  - Email verification

- ❌ **Catalog Pages**
  - Category listing
  - Category detail
  - Product search
  - Filter application

- ❌ **User Pages**
  - Profile page
  - Orders list
  - Order detail
  - Addresses management
  - Favorites
  - Comparison

- ❌ **Checkout Flow**
  - Complete checkout process
  - Address selection
  - Shipping selection
  - Payment selection
  - Order confirmation

- ❌ **Blog Pages**
  - Blog listing
  - Blog category
  - Blog post detail

- ❌ **Other Pages**
  - Contact
  - FAQ
  - Returns
  - Shipping info
  - Privacy/Terms

#### Middleware (0/6 tested)
- ❌ **auth.global.ts** - Authentication middleware
- ❌ **cart-token.global.ts** - Cart token middleware
- ❌ **comparison-token.global.ts** - Comparison token middleware
- ❌ **guest-token.global.ts** - Guest token middleware
- ❌ **locale.global.ts** - Locale middleware
- ❌ **seo.global.ts** - SEO middleware

#### Server Routes (0 tested)
- ❌ **API routes** - Server-side API endpoints
- ❌ **Auth routes** - Login, register, logout
- ❌ **Email routes** - Email verification

## Testing Strategy

### Unit Tests

**Purpose**: Test pure functions and utilities in isolation.

**Best Practices**:
- Mock external dependencies
- Test edge cases
- Test error handling
- Keep tests fast and isolated

**Example Pattern**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('utility function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle normal case', () => {
    // Test implementation
  })

  it('should handle edge case', () => {
    // Test implementation
  })

  it('should handle errors', () => {
    // Test error handling
  })
})
```

### Nuxt Tests

**Purpose**: Test Vue components and Pinia stores with Nuxt context.

**Best Practices**:
- Mock `useApi` composable
- Mock Pinia stores when testing components
- Use `@vue/test-utils` for component testing
- Test SSR/CSR behavior appropriately
- Mock Nuxt auto-imports (`#app`, `useRouter`, etc.)

**Example Pattern**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock dependencies
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
  })),
}))

describe('Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    const wrapper = mount(Component)
    expect(wrapper.exists()).toBe(true)
  })
})
```

### E2E Tests

**Purpose**: Test complete user flows and page rendering.

**Best Practices**:
- Test critical user journeys
- Use `@nuxt/test-utils/e2e` for setup
- Wait for proper page load states
- Handle CSR pages with appropriate waits
- Test SSR pages for SEO content

**Example Pattern**:
```typescript
import { describe, it, expect } from 'vitest'
import { $fetch, setup, createPage } from '@nuxt/test-utils/e2e'

describe('Page Flow', async () => {
  await setup({
    rootDir: '.',
    browser: true,
    server: { port: 0 },
  })

  it('should load page', async () => {
    const html = await $fetch('/page')
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('should handle user interaction', async () => {
    const page = await createPage('/page')
    await page.waitForLoadState('networkidle')
    // Test interactions
  })
})
```

## Test Plan for Missing Coverage

### Priority 1: Critical Business Logic

#### 1. Checkout Store Tests
**File**: `test/nuxt/stores/checkout.store.test.ts`

**Test Cases**:
- ✅ Initialization with empty state
- ✅ Start checkout flow
- ✅ Update shipping address
- ✅ Update billing address
- ✅ Set shipping method
- ✅ Set payment provider
- ✅ Confirm checkout
- ✅ Handle checkout errors
- ✅ Reset checkout state
- ✅ Getters (canProceed, isComplete, etc.)

**Estimated Effort**: 4-6 hours

#### 2. Product Store Tests
**File**: `test/nuxt/stores/product.store.test.ts`

**Test Cases**:
- ✅ Fetch product by slug
- ✅ Handle product not found
- ✅ Fetch product variants
- ✅ Select variant
- ✅ Fetch related products
- ✅ Loading and error states

**Estimated Effort**: 3-4 hours

#### 3. Checkout E2E Tests
**File**: `test/e2e/checkout-flow.test.ts`

**Test Cases**:
- ✅ Complete checkout flow (guest)
- ✅ Complete checkout flow (authenticated)
- ✅ Address form validation
- ✅ Shipping method selection
- ✅ Payment provider selection
- ✅ Order confirmation

**Estimated Effort**: 4-6 hours

### Priority 2: User Features

#### 4. Favorites Store Tests
**File**: `test/nuxt/stores/favorites.store.test.ts`

**Test Cases**:
- ✅ Add product to favorites
- ✅ Remove product from favorites
- ✅ Fetch favorites list
- ✅ Token management
- ✅ Error handling

**Estimated Effort**: 2-3 hours

#### 5. Comparison Store Tests
**File**: `test/nuxt/stores/comparison.store.test.ts`

**Test Cases**:
- ✅ Add product to comparison
- ✅ Remove product from comparison
- ✅ Fetch comparison list
- ✅ Token management
- ✅ Error handling

**Estimated Effort**: 2-3 hours

#### 6. Orders Store Tests
**File**: `test/nuxt/stores/orders.store.test.ts`

**Test Cases**:
- ✅ Fetch orders list
- ✅ Fetch single order
- ✅ Order status tracking
- ✅ Pagination
- ✅ Error handling

**Estimated Effort**: 2-3 hours

### Priority 3: Content & Blog

#### 7. Blog Store Tests
**File**: `test/nuxt/stores/blog.store.test.ts`

**Test Cases**:
- ✅ Fetch blog posts
- ✅ Fetch blog categories
- ✅ Fetch single post
- ✅ Pagination
- ✅ Error handling

**Estimated Effort**: 2-3 hours

#### 8. Reviews Store Tests
**File**: `test/nuxt/stores/reviews.store.test.ts`

**Test Cases**:
- ✅ Submit review
- ✅ Fetch reviews
- ✅ Review moderation
- ✅ Rating calculation
- ✅ Error handling

**Estimated Effort**: 2-3 hours

#### 9. Comments Store Tests
**File**: `test/nuxt/stores/comments.store.test.ts`

**Test Cases**:
- ✅ Submit comment
- ✅ Fetch comments
- ✅ Comment threading
- ✅ Error handling

**Estimated Effort**: 2-3 hours

### Priority 4: Components

#### 10. Critical Component Tests

**Cart Components**:
- `CartItem.test.ts` - Item display, quantity update, removal
- `CartSummary.test.ts` - Totals calculation, coupon display

**Product Components**:
- `ProductCard.test.ts` - Product display, link, image
- `ProductReviews.test.ts` - Reviews display, pagination
- `ReviewForm.test.ts` - Form validation, submission

**Checkout Components**:
- `AddressForm.test.ts` - Form validation, address selection
- `OrderSummary.test.ts` - Order totals, items display
- `PaymentProviderCard.test.ts` - Provider selection
- `ShippingMethodCard.test.ts` - Method selection

**Estimated Effort**: 8-12 hours

### Priority 5: Composables & Utils

#### 11. Missing Composable Tests
- `useCountries.test.ts` - Country data fetching
- `useLocaleCurrency.test.ts` - Locale/currency switching
- `usePagination.test.ts` - Pagination logic

**Estimated Effort**: 3-4 hours

#### 12. Missing Util Tests
- `format.test.ts` - Formatting utilities
- `image.test.ts` - Image utilities
- `validator.test.ts` - Validation utilities
- `locale-link.test.ts` - Locale link utilities

**Estimated Effort**: 3-4 hours

### Priority 6: E2E Coverage

#### 13. Auth Flow E2E
- Login flow
- Registration flow
- Password reset flow
- Email verification

**Estimated Effort**: 4-6 hours

#### 14. Catalog E2E
- Category browsing
- Product search
- Filter application
- Sorting

**Estimated Effort**: 3-4 hours

#### 15. User Pages E2E
- Profile page
- Orders list
- Order detail
- Addresses management
- Favorites
- Comparison

**Estimated Effort**: 6-8 hours

### Priority 7: Middleware & Server Routes

#### 16. Middleware Tests
- `auth.global.test.ts` - Authentication checks
- `cart-token.global.test.ts` - Cart token initialization
- `locale.global.test.ts` - Locale handling
- `seo.global.test.ts` - SEO metadata

**Estimated Effort**: 4-6 hours

#### 17. Server Route Tests
- API endpoint tests
- Auth route tests
- Email route tests

**Estimated Effort**: 4-6 hours

## Test Coverage Goals

### Current Coverage
- **Stores**: ~19% (3/16)
- **Components**: ~8% (3/35+)
- **Composables**: ~40% (2/5)
- **Utils**: ~50% (3/6)
- **E2E**: ~15% (3/20+)
- **Overall**: ~25%

### Target Coverage
- **Stores**: 100% (16/16) - Critical business logic
- **Components**: 80% (28/35+) - Focus on complex components
- **Composables**: 100% (5/5) - All composables
- **Utils**: 100% (6/6) - All utilities
- **E2E**: 60% (12/20+) - Critical user flows
- **Overall**: 75%+

## Testing Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking Strategy
- Mock external dependencies (API, stores, Nuxt auto-imports)
- Use `vi.mock()` for module-level mocks
- Create reusable mock factories

### 3. Test Data
- Use factories for creating test data
- Keep test data minimal and focused
- Use realistic but simple data

### 4. Assertions
- Use specific assertions
- Test both positive and negative cases
- Test edge cases and error conditions

### 5. Performance
- Keep unit tests fast (< 100ms each)
- Use `vi.useFakeTimers()` for time-dependent tests
- Avoid unnecessary async operations

### 6. Maintainability
- Keep tests DRY (Don't Repeat Yourself)
- Extract common setup to `beforeEach`
- Use helper functions for complex assertions

## Common Patterns

### Mocking useApi
```typescript
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetchCsrfCookie: vi.fn(),
    buildHeaders: vi.fn(),
    buildUrl: vi.fn(),
  })),
}))
```

### Mocking Pinia Stores
```typescript
vi.mock('~/stores/cart.store', () => ({
  useCartStore: vi.fn(() => ({
    itemCount: 0,
    cart: null,
    loadCart: vi.fn(),
  })),
}))
```

### Mocking Nuxt Auto-imports
```typescript
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app')
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      push: vi.fn(),
    })),
    useLocalePath: vi.fn(() => (path: string) => path),
  }
})
```

### Testing Pinia Stores
```typescript
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})
```

### Testing Vue Components
```typescript
import { mount } from '@vue/test-utils'

const wrapper = mount(Component, {
  global: {
    stubs: {
      NuxtLink: {
        template: '<a :to="to"><slot /></a>',
        props: ['to'],
      },
    },
  },
})
```

## Running Tests in CI/CD

### Recommended CI Configuration

```yaml
# Example GitHub Actions
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:nuxt
      - run: npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Tests failing due to SSR/CSR mismatch**
   - Ensure proper mocking of `useNuxtApp`, `useRouter`
   - Use appropriate wait states in E2E tests

2. **Pinia store not initialized**
   - Always call `setActivePinia(createPinia())` in `beforeEach`

3. **Mock not working**
   - Ensure mocks are defined before imports
   - Use `vi.mock()` at module level

4. **E2E tests timing out**
   - Increase timeout for slow operations
   - Use appropriate wait states (`load`, `networkidle`)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [@nuxt/test-utils Documentation](https://nuxt.com/docs/getting-started/testing)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Pinia Testing Guide](https://pinia.vuejs.org/cookbook/testing.html)

## Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Ensure tests are isolated and independent
3. Use descriptive test names
4. Mock external dependencies
5. Test both success and error cases
6. Update this documentation if adding new test categories

---

**Last Updated**: 2026
**Maintained By**: Development Team
