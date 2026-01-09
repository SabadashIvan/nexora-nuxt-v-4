# Test Implementation Plan

This document outlines the specific test files and test cases to implement for complete test coverage.

## Implementation Priority

### Phase 1: Critical Business Logic (Week 1-2)

#### 1.1 Checkout Store Tests
**File**: `test/nuxt/stores/checkout.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('checkout store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
    it('should have correct initial addresses')
    it('should have correct initial pricing')
  })

  describe('startCheckout', () => {
    it('should start checkout successfully')
    it('should load cart items into checkout')
    it('should set initial addresses from user')
    it('should handle empty cart error')
    it('should handle API errors')
  })

  describe('updateShippingAddress', () => {
    it('should update shipping address')
    it('should update billing address if same as shipping')
    it('should handle validation errors')
    it('should update pricing after address change')
  })

  describe('updateBillingAddress', () => {
    it('should update billing address')
    it('should handle validation errors')
  })

  describe('setShippingMethod', () => {
    it('should set shipping method')
    it('should update pricing')
    it('should handle invalid method')
  })

  describe('setPaymentProvider', () => {
    it('should set payment provider')
    it('should handle invalid provider')
  })

  describe('confirmCheckout', () => {
    it('should confirm checkout successfully')
    it('should return order details')
    it('should handle payment errors')
    it('should clear checkout state after success')
  })

  describe('getters', () => {
    it('should check if can proceed to shipping')
    it('should check if can proceed to payment')
    it('should check if can proceed to confirm')
    it('should check if checkout is complete')
    it('should calculate totals correctly')
  })

  describe('resetCheckout', () => {
    it('should reset all checkout state')
  })
})
```

**Dependencies**: Mock `useApi`, `useCartStore`

**Estimated Time**: 4-6 hours

---

#### 1.2 Product Store Tests
**File**: `test/nuxt/stores/product.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('product store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchProduct', () => {
    it('should fetch product by slug successfully')
    it('should handle product not found (404)')
    it('should handle API errors')
    it('should set loading state correctly')
  })

  describe('fetchVariants', () => {
    it('should fetch product variants')
    it('should handle no variants')
  })

  describe('selectVariant', () => {
    it('should select variant')
    it('should update product price')
    it('should handle invalid variant')
  })

  describe('fetchRelatedProducts', () => {
    it('should fetch related products')
    it('should handle empty related products')
  })

  describe('getters', () => {
    it('should get current variant')
    it('should check if variant selected')
    it('should get variant price')
  })
})
```

**Dependencies**: Mock `useApi`

**Estimated Time**: 3-4 hours

---

#### 1.3 Checkout E2E Tests
**File**: `test/e2e/checkout-flow.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('Checkout Flow E2E', () => {
  it('should complete guest checkout flow')
  it('should complete authenticated checkout flow')
  it('should validate address form')
  it('should select shipping method')
  it('should select payment provider')
  it('should show order confirmation')
  it('should handle checkout errors')
})
```

**Dependencies**: Test data setup, mock API responses

**Estimated Time**: 4-6 hours

---

### Phase 2: User Features (Week 3)

#### 2.1 Favorites Store Tests
**File**: `test/nuxt/stores/favorites.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('favorites store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchFavorites', () => {
    it('should fetch favorites list')
    it('should handle empty favorites')
    it('should handle API errors')
  })

  describe('addFavorite', () => {
    it('should add product to favorites')
    it('should handle duplicate favorite')
    it('should handle API errors')
  })

  describe('removeFavorite', () => {
    it('should remove product from favorites')
    it('should handle product not in favorites')
    it('should handle API errors')
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite status')
  })

  describe('getters', () => {
    it('should check if product is favorited')
    it('should get favorites count')
  })
})
```

**Dependencies**: Mock `useApi`, token utilities

**Estimated Time**: 2-3 hours

---

#### 2.2 Comparison Store Tests
**File**: `test/nuxt/stores/comparison.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('comparison store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchComparison', () => {
    it('should fetch comparison list')
    it('should handle empty comparison')
  })

  describe('addProduct', () => {
    it('should add product to comparison')
    it('should handle maximum items limit')
    it('should handle duplicate product')
  })

  describe('removeProduct', () => {
    it('should remove product from comparison')
  })

  describe('clearComparison', () => {
    it('should clear all products')
  })

  describe('getters', () => {
    it('should get comparison count')
    it('should check if product in comparison')
  })
})
```

**Dependencies**: Mock `useApi`, token utilities

**Estimated Time**: 2-3 hours

---

#### 2.3 Orders Store Tests
**File**: `test/nuxt/stores/orders.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('orders store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchOrders', () => {
    it('should fetch orders list')
    it('should handle pagination')
    it('should handle empty orders')
    it('should handle API errors')
  })

  describe('fetchOrder', () => {
    it('should fetch single order')
    it('should handle order not found')
    it('should handle API errors')
  })

  describe('getters', () => {
    it('should get order by id')
    it('should filter orders by status')
  })
})
```

**Dependencies**: Mock `useApi`

**Estimated Time**: 2-3 hours

---

### Phase 3: Content & Blog (Week 4)

#### 3.1 Blog Store Tests
**File**: `test/nuxt/stores/blog.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('blog store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchPosts', () => {
    it('should fetch blog posts')
    it('should handle pagination')
    it('should handle filters')
    it('should handle API errors')
  })

  describe('fetchPost', () => {
    it('should fetch single post by slug')
    it('should handle post not found')
  })

  describe('fetchCategories', () => {
    it('should fetch blog categories')
  })

  describe('getters', () => {
    it('should get posts by category')
    it('should get featured posts')
  })
})
```

**Dependencies**: Mock `useApi`

**Estimated Time**: 2-3 hours

---

#### 3.2 Reviews Store Tests
**File**: `test/nuxt/stores/reviews.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('reviews store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchReviews', () => {
    it('should fetch product reviews')
    it('should handle pagination')
    it('should handle filters')
  })

  describe('submitReview', () => {
    it('should submit review successfully')
    it('should validate review data')
    it('should handle API errors')
  })

  describe('getters', () => {
    it('should calculate average rating')
    it('should get rating distribution')
  })
})
```

**Dependencies**: Mock `useApi`

**Estimated Time**: 2-3 hours

---

#### 3.3 Comments Store Tests
**File**: `test/nuxt/stores/comments.store.test.ts`

**Status**: ❌ Not Started

**Test Cases**:
```typescript
describe('comments store', () => {
  describe('initialization', () => {
    it('should initialize with empty state')
  })

  describe('fetchComments', () => {
    it('should fetch comments')
    it('should handle threading')
    it('should handle pagination')
  })

  describe('submitComment', () => {
    it('should submit comment successfully')
    it('should handle reply to comment')
    it('should validate comment data')
  })

  describe('getters', () => {
    it('should get top-level comments')
    it('should get replies for comment')
  })
})
```

**Dependencies**: Mock `useApi`

**Estimated Time**: 2-3 hours

---

### Phase 4: Components (Week 5-6)

#### 4.1 Cart Components

**CartItem.test.ts**
```typescript
describe('CartItem component', () => {
  it('should render product information')
  it('should display quantity')
  it('should update quantity on change')
  it('should remove item on delete')
  it('should display price correctly')
  it('should handle loading state')
})
```

**CartSummary.test.ts**
```typescript
describe('CartSummary component', () => {
  it('should display subtotal')
  it('should display discounts')
  it('should display total')
  it('should display applied coupons')
  it('should handle empty cart')
})
```

**Estimated Time**: 3-4 hours

---

#### 4.2 Product Components

**ProductCard.test.ts**
```typescript
describe('ProductCard component', () => {
  it('should render product information')
  it('should display image')
  it('should display price')
  it('should link to product page')
  it('should show favorite button')
  it('should show add to cart button')
})
```

**ProductReviews.test.ts**
```typescript
describe('ProductReviews component', () => {
  it('should display reviews list')
  it('should handle pagination')
  it('should display average rating')
  it('should handle empty reviews')
})
```

**ReviewForm.test.ts**
```typescript
describe('ReviewForm component', () => {
  it('should render form fields')
  it('should validate required fields')
  it('should submit review')
  it('should handle errors')
  it('should reset form after submission')
})
```

**Estimated Time**: 4-5 hours

---

#### 4.3 Checkout Components

**AddressForm.test.ts**
```typescript
describe('AddressForm component', () => {
  it('should render form fields')
  it('should validate required fields')
  it('should validate email format')
  it('should validate postal code')
  it('should submit address')
  it('should handle errors')
})
```

**OrderSummary.test.ts**
```typescript
describe('OrderSummary component', () => {
  it('should display order items')
  it('should display totals')
  it('should display shipping cost')
  it('should display discounts')
})
```

**Estimated Time**: 3-4 hours

---

#### 4.4 UI Components

**Pagination.test.ts**
```typescript
describe('Pagination component', () => {
  it('should render page numbers')
  it('should handle page navigation')
  it('should show previous/next buttons')
  it('should handle edge cases (first/last page)')
})
```

**QuantitySelector.test.ts**
```typescript
describe('QuantitySelector component', () => {
  it('should display current quantity')
  it('should increment quantity')
  it('should decrement quantity')
  it('should enforce min/max limits')
  it('should handle input changes')
})
```

**Rating.test.ts**
```typescript
describe('Rating component', () => {
  it('should display stars')
  it('should handle interactive rating')
  it('should display average rating')
  it('should handle readonly mode')
})
```

**Estimated Time**: 4-5 hours

---

### Phase 5: Composables & Utils (Week 7)

#### 5.1 Composables

**useCountries.test.ts**
```typescript
describe('useCountries', () => {
  it('should fetch countries list')
  it('should cache countries')
  it('should handle API errors')
  it('should get country by code')
})
```

**useLocaleCurrency.test.ts**
```typescript
describe('useLocaleCurrency', () => {
  it('should get current locale')
  it('should get current currency')
  it('should switch locale')
  it('should switch currency')
  it('should format price with locale')
})
```

**usePagination.test.ts**
```typescript
describe('usePagination', () => {
  it('should calculate page numbers')
  it('should handle page navigation')
  it('should calculate total pages')
  it('should handle edge cases')
})
```

**Estimated Time**: 3-4 hours

---

#### 5.2 Utils

**format.test.ts**
```typescript
describe('format utilities', () => {
  it('should format date')
  it('should format currency')
  it('should format number')
  it('should format phone number')
})
```

**image.test.ts**
```typescript
describe('image utilities', () => {
  it('should generate image URL')
  it('should handle image variants')
  it('should handle missing images')
})
```

**validator.test.ts**
```typescript
describe('validator utilities', () => {
  it('should validate email')
  it('should validate phone')
  it('should validate postal code')
  it('should validate required fields')
})
```

**locale-link.test.ts**
```typescript
describe('locale-link utilities', () => {
  it('should generate locale link')
  it('should preserve query params')
  it('should handle current locale')
})
```

**Estimated Time**: 3-4 hours

---

### Phase 6: E2E Coverage (Week 8)

#### 6.1 Auth Flow E2E
**File**: `test/e2e/auth-flow.test.ts`

```typescript
describe('Auth Flow E2E', () => {
  it('should login successfully')
  it('should handle login errors')
  it('should register new user')
  it('should reset password')
  it('should verify email')
  it('should logout')
})
```

**Estimated Time**: 4-6 hours

---

#### 6.2 Catalog E2E
**File**: `test/e2e/catalog-flow.test.ts`

```typescript
describe('Catalog Flow E2E', () => {
  it('should browse categories')
  it('should view category products')
  it('should search products')
  it('should apply filters')
  it('should sort products')
  it('should paginate results')
})
```

**Estimated Time**: 3-4 hours

---

#### 6.3 User Pages E2E
**File**: `test/e2e/user-pages.test.ts`

```typescript
describe('User Pages E2E', () => {
  it('should view profile')
  it('should view orders list')
  it('should view order details')
  it('should manage addresses')
  it('should view favorites')
  it('should view comparison')
})
```

**Estimated Time**: 6-8 hours

---

### Phase 7: Middleware & Server Routes (Week 9)

#### 7.1 Middleware Tests

**auth.global.test.ts**
```typescript
describe('auth middleware', () => {
  it('should allow authenticated users')
  it('should redirect unauthenticated users')
  it('should handle token expiration')
})
```

**cart-token.global.test.ts**
```typescript
describe('cart-token middleware', () => {
  it('should initialize cart token')
  it('should preserve existing token')
  it('should handle token errors')
})
```

**locale.global.test.ts**
```typescript
describe('locale middleware', () => {
  it('should set default locale')
  it('should detect locale from URL')
  it('should preserve locale in navigation')
})
```

**Estimated Time**: 4-6 hours

---

#### 7.2 Server Route Tests

**API route tests**
```typescript
describe('API routes', () => {
  it('should proxy requests correctly')
  it('should handle errors')
  it('should set headers correctly')
})
```

**Auth route tests**
```typescript
describe('Auth routes', () => {
  it('should handle login')
  it('should handle registration')
  it('should handle logout')
})
```

**Estimated Time**: 4-6 hours

---

## Test Implementation Checklist

### Phase 1: Critical Business Logic
- [ ] Checkout Store Tests
- [ ] Product Store Tests
- [ ] Checkout E2E Tests

### Phase 2: User Features
- [ ] Favorites Store Tests
- [ ] Comparison Store Tests
- [ ] Orders Store Tests

### Phase 3: Content & Blog
- [ ] Blog Store Tests
- [ ] Reviews Store Tests
- [ ] Comments Store Tests

### Phase 4: Components
- [ ] Cart Components (CartItem, CartSummary)
- [ ] Product Components (ProductCard, ProductReviews, ReviewForm)
- [ ] Checkout Components (AddressForm, OrderSummary)
- [ ] UI Components (Pagination, QuantitySelector, Rating)

### Phase 5: Composables & Utils
- [ ] useCountries
- [ ] useLocaleCurrency
- [ ] usePagination
- [ ] format utilities
- [ ] image utilities
- [ ] validator utilities
- [ ] locale-link utilities

### Phase 6: E2E Coverage
- [ ] Auth Flow E2E
- [ ] Catalog E2E
- [ ] User Pages E2E

### Phase 7: Middleware & Server Routes
- [ ] Middleware Tests
- [ ] Server Route Tests

## Estimated Total Time

- **Phase 1**: 11-16 hours
- **Phase 2**: 6-9 hours
- **Phase 3**: 6-9 hours
- **Phase 4**: 14-18 hours
- **Phase 5**: 6-8 hours
- **Phase 6**: 13-18 hours
- **Phase 7**: 8-12 hours

**Total**: ~64-90 hours (8-11 weeks at 8 hours/week)

## Notes

1. **Prioritize by business impact**: Focus on Phase 1 first
2. **Reuse patterns**: Follow existing test patterns from `auth.store.test.ts`, `cart.store.test.ts`
3. **Mock dependencies**: Always mock `useApi` and external dependencies
4. **Test both success and error cases**: Don't forget error handling
5. **Keep tests isolated**: Each test should be independent
6. **Update documentation**: Update `TESTS.md` as you add tests

## Quick Start Template

When creating a new test file, use this template:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStoreName } from '~/stores/store-name.store'
import { useApi } from '~/composables/useApi'

// Mock useApi
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

describe('store-name store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = useStoreName()
      // Add assertions
    })
  })

  // Add more test suites
})
```

---

**Last Updated**: 2024
**Status**: Planning Phase
