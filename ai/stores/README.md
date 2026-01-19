# Stores Documentation Index

Pinia store patterns and state management for the Nuxt 4 e-commerce application.

---

## 📁 Store Files

### [stores.md](stores.md) (17KB, 1028 lines)
**Complete Pinia store definitions and patterns**

Contains all 17 store specifications with:
- State structure
- Getters
- Actions
- API endpoints used
- SSR/CSR behavior
- Token requirements

---

## 📚 Available Stores

### 1. Auth Store (`auth.store.ts`)
**Purpose:** User authentication and session management

**Key Features:**
- Login/logout/register
- User profile management
- Address CRUD
- Session persistence

**SSR Behavior:** Partial SSR (user hydration only)
**Tokens:** Cookie-based session (HTTP-only, Laravel Sanctum)

---

### 2. System Store (`system.store.ts`)
**Purpose:** Global system configuration

**Key Features:**
- Languages and currencies
- Locale/currency switching
- Feature toggles
- System initialization

**SSR Behavior:** SSR required (startup load)
**Tokens:** None

---

### 3. Catalog Store (`catalog.store.ts`)
**Purpose:** Product catalog and categories

**Key Features:**
- Category tree
- Brand list
- Product filters
- Category navigation

**SSR Behavior:** SSR required (SEO-critical)
**Tokens:** None

---

### 4. Product Store (`product.store.ts`)
**Purpose:** Individual product details

**Key Features:**
- Product variant details
- Images and specifications
- Pricing and availability
- Related products

**SSR Behavior:** SSR required (SEO-critical)
**Tokens:** None

---

### 5. Cart Store (`cart.store.ts`)
**Purpose:** Shopping cart management

**Key Features:**
- Add/update/remove items
- Cart versioning (optimistic locking)
- Coupon management
- Item options

**SSR Behavior:** CSR-only (never SSR)
**Tokens:** `X-Cart-Token`

**⚠️ Important:** Cart uses versioning with `If-Match` and `Idempotency-Key` headers

---

### 6. Favorites Store (`favorites.store.ts`)
**Purpose:** Wishlist/favorites management

**Key Features:**
- Add/remove favorites
- Favorites list
- Product availability tracking

**SSR Behavior:** CSR-only
**Tokens:** `X-Guest-Id`

---

### 7. Comparison Store (`comparison.store.ts`)
**Purpose:** Product comparison table

**Key Features:**
- Add/remove products to compare
- Comparison table display
- Max items limit

**SSR Behavior:** CSR-only
**Tokens:** `X-Comparison-Token`

---

### 8. Checkout Store (`checkout.store.ts`)
**Purpose:** Multi-step checkout orchestration

**Key Features:**
- Checkout session management
- Address handling
- Shipping method selection
- Payment provider selection
- Order confirmation
- Warehouse selection support

**SSR Behavior:** CSR-only (never SSR)
**Tokens:** `X-Cart-Token`

**See also:** [../flows/checkout-flow.md](../flows/checkout-flow.md) for complete flow

---

### 9. Orders Store (`orders.store.ts`)
**Purpose:** Order history and details

**Key Features:**
- Paginated order list
- Order details
- Status filtering
- Order status list

**SSR Behavior:** CSR-only (requires auth)
**Tokens:** Cookie-based session (authenticated)

---

### 10. Blog Store (`blog.store.ts`)
**Purpose:** Blog content management

**Key Features:**
- Blog post listing
- Post details
- Category filtering
- SEO data

**SSR Behavior:** SSR required (SEO-critical)
**Tokens:** None

---

### 11. SEO Store (`seo.store.ts`)
**Purpose:** SEO metadata management

**Key Features:**
- Page SEO data
- Navigation menus
- Static pages
- Site contacts

**SSR Behavior:** SSR required (SEO-critical)
**Tokens:** None

---

### 12. Support Store (`support.store.ts`)
**Purpose:** Customer support requests

**Key Features:**
- Submit support requests
- Request types
- Rate limiting handling

**SSR Behavior:** CSR-only
**Tokens:** None (public endpoint)

---

### 13. Comments Store (`comments.store.ts`)
**Purpose:** Comments system

**Key Features:**
- Fetch comments
- Create comments
- Reply to comments
- Comment types

**SSR Behavior:** CSR-only (for creation)
**Tokens:** Cookie-based session (for creation)

---

### 14. Reviews Store (`reviews.store.ts`)
**Purpose:** Product reviews

**Key Features:**
- Fetch reviews
- Create reviews
- Reply to reviews
- Review moderation

**SSR Behavior:** CSR-only (for creation)
**Tokens:** Cookie-based session (for creation)

---

### 15. Loyalty Store (`loyalty.store.ts`)
**Purpose:** Loyalty points management

**Key Features:**
- Account balance (active + pending)
- Transaction history
- Loyalty point tracking

**SSR Behavior:** CSR-only (requires auth)
**Tokens:** Cookie-based session

---

### 16. Notifications Store (`notifications.store.ts`)
**Purpose:** User notifications

**Key Features:**
- Notification list with filtering
- Unread count
- Mark as read/archive/restore
- Notification preferences

**SSR Behavior:** CSR-only (requires auth)
**Tokens:** Cookie-based session

---

### 17. Token Notes

Stores requiring tokens:
- `cart` → `X-Cart-Token`
- `favorites` → `X-Guest-Id`
- `comparison` → `X-Comparison-Token`
- `checkout` → `X-Cart-Token`
- `auth`, `orders`, `loyalty`, `notifications` → Cookie-based session

---

## ⚠️ Critical Rules

### 1. Never Access Stores at Top Level
**❌ Wrong:**
```typescript
const authStore = useAuthStore()  // Top level - breaks SSR!
```

**✅ Correct:**
```typescript
// Inside onMounted
onMounted(() => {
  const authStore = useAuthStore()
})

// Inside computed
const user = computed(() => {
  const authStore = useAuthStore()
  return authStore.user
})

// Inside useAsyncData
const { data } = await useAsyncData(() => {
  const store = useStore()
  return store.fetchData()
})
```

### 2. Respect SSR/CSR Rules

**SSR Stores** (must fetch on server):
- `catalog.store`
- `product.store`
- `blog.store`
- `seo.store`
- `system.store`

**CSR-Only Stores** (never on server):
- `cart.store`
- `favorites.store`
- `comparison.store`
- `checkout.store`
- `auth.store` (partial SSR allowed for user hydration)
- `orders.store`
- `support.store`
- `comments.store`
- `reviews.store`
- `loyalty.store`
- `notifications.store`

### 3. Store Responsibilities

**✅ Stores should contain:**
- State management
- Business logic
- API calls
- Error handling
- Data transformation

**❌ Stores should NOT contain:**
- UI logic
- Component-specific code
- Direct DOM manipulation

### 4. API Integration

All stores use `useApi()` composable for API calls. Direct `fetch()` is forbidden.

---

## 🎯 Common Tasks

**Fetching data in SSR page:**
```typescript
const { data } = await useAsyncData('products', async () => {
  const catalogStore = useCatalogStore()
  await catalogStore.fetchProducts({ category: 'phones' })
  return catalogStore.products
})
```

**Fetching data in CSR component:**
```typescript
onMounted(async () => {
  const cartStore = useCartStore()
  await cartStore.fetchCart()
})
```

**Accessing store data:**
```typescript
const user = computed(() => {
  const authStore = useAuthStore()
  return authStore.user
})
```

---

## 📖 Related Documentation

- **[../api/README.md](../api/README.md)** - API endpoints used by stores
- **[../flows/checkout-flow.md](../flows/checkout-flow.md)** - Checkout store usage
- **[../constitution/rendering.md](../constitution/rendering.md)** - SSR/CSR rules
- **[../constitution/tokens.md](../constitution/tokens.md)** - Token management

---

**Navigate back:** [../README.md](../README.md)
