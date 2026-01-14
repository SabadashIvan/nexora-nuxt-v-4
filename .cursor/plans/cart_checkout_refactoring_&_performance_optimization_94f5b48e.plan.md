---
name: Cart Checkout Refactoring & Performance Optimization
overview: Implement Phase 2 (Cart & Checkout Clean Architecture) and Phase 3 (Rendering & Performance) to refactor stores for lean architecture, add optimistic UI, modularize checkout, migrate SEO to declarative approach, and optimize rendering with server components.
todos: []
---

# Cart Checkout Refactoring & Performance Optimization Plan

This plan implements Phases 2-3 from the API implementation plan, focusing on clean architecture refactoring, optimistic UI, modular checkout, SEO migration, and performance optimizations.

## Phase 2: Cart & Checkout (Clean Architecture)

### 2.1 Store Cleanup

**Goal:** Remove manual HTTP concerns from stores, making them lean and focused on business logic only.

**Files to Modify:**

- `app/stores/cart.store.ts` - Remove manual If-Match, retry, and version logic

**Implementation Steps:**

1. **Remove Manual If-Match Headers:**

   - Remove all `headers['If-Match']` assignments from cart mutations
   - Remove `ensureCartVersion()` calls before mutations
   - Network layer (Phase 0.2) handles this automatically

2. **Remove Manual Retry Logic:**

   - Remove try-catch blocks with 409 retry logic
   - Remove `fetchCart()` calls in catch blocks for version refresh
   - Network layer (Phase 0.2) handles retries automatically

3. **Remove Version Management Methods:**

   - Keep `cartVersion` in state (needed for network layer)
   - Remove `ensureCartVersion()` method (if exists)
   - Keep `fetchCartVersion()` if used elsewhere, otherwise remove
   - Remove `updateVersion()` method (version updated automatically)

4. **Simplify Store Methods:**

   - Methods should only:
     - Prepare payload
     - Call `useApi()` (network layer handles headers/retries)
     - Update state with response
     - Handle business logic errors

5. **Example Before/After:**
   ```typescript
   // Before (manual version/retry)
   async addItem(payload: AddToCartPayload) {
     await this.ensureCartVersion()
     const headers = { 'If-Match': String(this.cartVersion) }
     try {
       const response = await useApi().post('/cart/items', { 
         body: payload, 
         headers 
       })
       this.cart = response
     } catch (error) {
       if (error.status === 409) {
         await this.fetchCart()
         // retry logic...
       }
     }
   }
   
   // After (lean, network layer handles everything)
   async addItem(payload: AddToCartPayload) {
     this.loading = true
     try {
       this.cart = await useApi().post('/cart/items', { body: payload })
     } catch (error) {
       this.error = getErrorMessage(error)
       throw error
     } finally {
       this.loading = false
     }
   }
   ```

6. **Testing:**

   - Verify all cart mutations still work
   - Verify 409 retries happen automatically (check network logs)
   - Verify version is updated automatically

**Dependencies:**

- Phase 0.2 (auto-retry interceptor) must be complete
- Phase 0.3 (error taxonomy) for proper error handling

**Expected Results:**

- Store methods become 70-80% shorter
- No HTTP concerns in store code
- All version/retry logic in network layer

### 2.2 Optimistic UI with Rollback

**Goal:** Provide instant UI feedback for cart operations with automatic rollback on errors.

**Files to Create:**

- `app/composables/useFeatureFlag.ts` - Feature flag composable

**Files to Modify:**

- `app.config.ts` - Add feature flags configuration
- `app/stores/cart.store.ts` - Add optimistic UI logic
- `app/stores/favorites.store.ts` - Add optimistic UI (optional)
- `app/stores/comparison.store.ts` - Add optimistic UI (optional)

**Implementation Steps:**

1. **Feature Flag Configuration:**
   ```typescript
   // app.config.ts
   export default defineAppConfig({
     features: {
       cart_optimistic_ui: {
         enabled: process.env.FEATURE_CART_OPTIMISTIC_UI === 'true' || false,
         description: 'Enable optimistic UI updates for cart operations',
         version: '2.0.0'
       }
     }
   })
   ```

2. **Feature Flag Composable:**
   ```typescript
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
   ```

3. **Optimistic UI in Cart Store:**

   - **addItem():**
     - Save previous cart state
     - If flag enabled: optimistically add item to cart
     - Make API call
     - On success: use server response
     - On error (409/422): rollback to previous state, show notification

   - **updateItem():**
     - Save previous cart state
     - If flag enabled: optimistically update item quantity
     - Make API call
     - On error: rollback

   - **removeItem():**
     - Save previous cart state
     - If flag enabled: optimistically remove item
     - Make API call
     - On error: rollback

4. **Rollback Logic:**
   ```typescript
   async addItem(payload: AddToCartPayload) {
     const { enabled: optimisticUI } = useFeatureFlag('cart_optimistic_ui')
     const previousCart = this.cart ? { ...this.cart } : null
     
     // Optimistic update
     if (optimisticUI && this.cart) {
       this.cart = {
         ...this.cart,
         items: [...this.cart.items, {
           ...payload,
           id: `temp-${Date.now()}`,
           qty: payload.qty || 1
         }]
       }
     }
     
     this.loading = true
     try {
       this.cart = await useApi().post('/cart/items', { body: payload })
     } catch (error) {
       // Rollback on concurrency or validation errors
       if (optimisticUI && previousCart) {
         if (isConcurrencyEvent(error) || isValidationError(error)) {
           this.cart = previousCart
           // Show notification via notifications store
           const notificationsStore = useNotificationsStore()
           notificationsStore.show('Cart was updated, please try again', 'error')
         }
       }
       throw error
     } finally {
       this.loading = false
     }
   }
   ```

5. **Loading States:**

   - Show loading indicator during optimistic updates
   - Distinguish between optimistic state and confirmed state
   - Use skeleton loaders or disabled states

6. **Apply to Other Stores (Optional):**

   - Favorites: optimistic add/remove
   - Comparison: optimistic add/remove
   - Use same feature flag or separate flags

7. **Testing:**

   - Test with network throttling (slow 3G)
   - Test rollback on 409 errors
   - Test rollback on 422 validation errors
   - Test with feature flag disabled
   - Verify SSR/CSR compatibility

**Dependencies:**

- Phase 0.2 (auto-retry interceptor)
- Phase 0.3 (error taxonomy - ConcurrencyEvent, ValidationError)
- Notifications store (for user feedback)

**Expected Results:**

- Instant UI feedback for cart operations
- Automatic rollback on errors
- Better perceived performance
- Feature flag allows gradual rollout

### 2.3 Checkout Refactoring

**Goal:** Split checkout logic into independent, modular composables for better maintainability.

**Files to Create:**

- `app/composables/checkout/useCheckoutCity.ts` - City selection composable
- `app/composables/checkout/useCheckoutWarehouse.ts` - Warehouse selection composable
- `app/composables/checkout/useCheckoutDelivery.ts` - Delivery method composable

**Files to Modify:**

- `app/stores/checkout.store.ts` - Refactor to use composables
- `app/pages/checkout.vue` - Update to use modular composables
- `app/components/checkout/AddressForm.vue` - Use city composable
- `app/components/checkout/ShippingMethodCard.vue` - Use delivery composable

**Implementation Steps:**

1. **City Selection Composable:**
   ```typescript
   // app/composables/checkout/useCheckoutCity.ts
   export function useCheckoutCity() {
     const checkoutStore = useCheckoutStore()
     
     const searchCities = async (query: string) => {
       // Use shipping search API (Phase 4) or current implementation
       // Return cities list
     }
     
     const selectCity = (city: City) => {
       checkoutStore.setShippingCity(city)
       // Clear warehouse selection when city changes
       checkoutStore.setShippingWarehouse(null)
     }
     
     return {
       searchCities,
       selectCity,
       selectedCity: computed(() => checkoutStore.shippingCity),
       isLoading: computed(() => checkoutStore.loading)
     }
   }
   ```

2. **Warehouse Selection Composable:**
   ```typescript
   // app/composables/checkout/useCheckoutWarehouse.ts
   export function useCheckoutWarehouse() {
     const checkoutStore = useCheckoutStore()
     const { selectedCity } = useCheckoutCity()
     
     const searchWarehouses = async (cityId: string) => {
       if (!cityId) return []
       // Use shipping search API (Phase 4)
       // Return warehouses list
     }
     
     const selectWarehouse = (warehouse: Warehouse) => {
       checkoutStore.setShippingWarehouse(warehouse)
     }
     
     return {
       searchWarehouses,
       selectWarehouse,
       selectedWarehouse: computed(() => checkoutStore.shippingWarehouse),
       isLoading: computed(() => checkoutStore.loading)
     }
   }
   ```

3. **Delivery Method Composable:**
   ```typescript
   // app/composables/checkout/useCheckoutDelivery.ts
   export function useCheckoutDelivery() {
     const checkoutStore = useCheckoutStore()
     
     const fetchDeliveryMethods = async () => {
       await checkoutStore.fetchShippingMethods()
     }
     
     const selectDeliveryMethod = (method: ShippingMethod) => {
       checkoutStore.applyShippingMethod(method)
     }
     
     return {
       fetchDeliveryMethods,
       selectDeliveryMethod,
       methods: computed(() => checkoutStore.shippingMethods),
       selectedMethod: computed(() => checkoutStore.selectedShipping),
       isLoading: computed(() => checkoutStore.loading)
     }
   }
   ```

4. **Refactor Checkout Store:**

   - Keep state management in store
   - Move business logic to composables
   - Store methods become simple setters/getters
   - Composables handle API calls and validation

5. **Update Checkout Components:**

   - `AddressForm.vue`: Use `useCheckoutCity()` for city search
   - `ShippingMethodCard.vue`: Use `useCheckoutDelivery()` for methods
   - Add warehouse selection component using `useCheckoutWarehouse()`

6. **Module Independence:**

   - Each composable can be tested independently
   - Composables can be reused in different contexts
   - Clear separation: City → Warehouse → Delivery

7. **Error Handling:**

   - Each composable handles its own errors
   - Errors bubble up to store/component level
   - User-friendly error messages

**Dependencies:**

- Checkout store (current implementation)
- Shipping search API (Phase 4 - can use placeholder for now)
- Checkout components

**Expected Results:**

- Modular, testable checkout logic
- Clear separation of concerns
- Easier to add new checkout steps
- Better code organization

## Phase 3: Rendering & Performance

### 3.1 SEO Migration

**Goal:** Migrate from Pinia SEO store to declarative `useSeoMeta()` for better performance and DX.

**Files to Modify:**

- All page components using SEO store
- `app/stores/seo.store.ts` - Delete after migration
- `nuxt.config.ts` - Verify Nuxt SEO module is installed

**Pages to Update:**

- `app/pages/index.vue` - Homepage
- `app/pages/product/[slug].vue` - Product page
- `app/pages/categories/[category].vue` - Category page
- `app/pages/blog/posts/[slug].vue` - Blog post page
- `app/pages/blog/index.vue` - Blog listing
- `app/pages/categories/index.vue` - Categories listing
- Any other pages using `useSeoStore()`

**Implementation Steps:**

1. **Verify Nuxt SEO Module:**

   - Check if `@nuxtjs/seo` or similar is installed
   - Install if missing: `npm install @nuxtjs/seo`
   - Add to `nuxt.config.ts` modules if needed

2. **Migration Pattern for Each Page:**
   ```typescript
   // Before (Pinia SEO Store)
   const seoStore = useSeoStore()
   const { data: product } = await useAsyncData('product', ...)
   seoStore.apply({
     title: product.value.name,
     description: product.value.description,
     ogImage: product.value.image,
   })
   
   // After (Declarative SEO)
   const { data: product } = await useAsyncData('product', ...)
   useSeoMeta({
     title: product.value?.name,
     description: product.value?.description,
     ogTitle: product.value?.name,
     ogDescription: product.value?.description,
     ogImage: product.value?.image,
     twitterCard: 'summary_large_image',
   })
   
   useSchemaOrg([
     defineProduct({
       name: product.value?.name,
       description: product.value?.description,
       image: product.value?.image,
       offers: {
         price: product.value?.price.amount,
         priceCurrency: product.value?.price.currency,
       }
     })
   ])
   ```

3. **Product Page Example:**

   - Remove `useSeoStore()` import
   - Add `useSeoMeta()` and `useSchemaOrg()`
   - Use product data directly
   - Add structured data for products

4. **Category Page Example:**

   - Use category name/description for SEO
   - Add breadcrumb structured data
   - Add collection structured data

5. **Blog Post Example:**

   - Use post title/description
   - Add article structured data
   - Add author information

6. **Remove SEO Store:**

   - Delete `app/stores/seo.store.ts`
   - Remove from Pinia stores index (if exists)
   - Remove all imports of `useSeoStore()`

7. **Testing:**

   - Verify meta tags in page source
   - Test with SEO tools (Google Rich Results Test)
   - Verify structured data is valid JSON-LD
   - Test on all page types

**Dependencies:**

- Nuxt SEO module (`@nuxtjs/seo` or built-in)
- All page components
- Product/category/blog data

**Expected Results:**

- Better SSR performance (no store hydration)
- Type-safe SEO with TypeScript
- Co-located SEO data with components
- Valid structured data for search engines

### 3.2 Nitro Debounce

**Goal:** Implement server-side debouncing and caching for shipping search to reduce API calls.

**Files to Create:**

- `server/api/shipping/search.ts` - Nitro endpoint for shipping search

**Files to Modify:**

- `app/composables/checkout/useCheckoutCity.ts` - Use Nitro endpoint
- `app/composables/checkout/useCheckoutWarehouse.ts` - Use Nitro endpoint

**Implementation Steps:**

1. **Create Nitro Endpoint:**
   ```typescript
   // server/api/shipping/search.ts
   import { debounce } from 'lodash-es'
   
   interface SearchCache {
     data: any
     timestamp: number
   }
   
   const searchCache = new Map<string, SearchCache>()
   const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
   const DEBOUNCE_MS = 300
   
   export default defineEventHandler(async (event) => {
     const query = getQuery(event)
     const { type, provider, ...searchParams } = query
     
     // Create cache key from query params
     const cacheKey = JSON.stringify({ type, provider, ...searchParams })
     
     // Check cache
     const cached = searchCache.get(cacheKey)
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data
     }
     
     // Debounce search requests
     const debouncedSearch = debounce(async () => {
       const api = useApi()
       const endpoint = type === 'warehouses' 
         ? `/shipping/${provider}/warehouses/search`
         : `/shipping/${provider}/settlements/search`
       
       const results = await api.get(endpoint, searchParams)
       
       // Cache results
       searchCache.set(cacheKey, {
         data: results,
         timestamp: Date.now()
       })
       
       return results
     }, DEBOUNCE_MS)
     
     return await debouncedSearch()
   })
   ```

2. **Update City Composable:**
   ```typescript
   // app/composables/checkout/useCheckoutCity.ts
   const searchCities = async (query: string) => {
     if (!query || query.length < 2) return []
     
     // Use Nitro endpoint instead of direct API call
     const { data } = await useFetch('/api/shipping/search', {
       query: {
         type: 'settlements',
         provider: 'nova_post', // or from config
         query: query
       }
     })
     
     return data.value || []
   }
   ```

3. **Update Warehouse Composable:**
   ```typescript
   // app/composables/checkout/useCheckoutWarehouse.ts
   const searchWarehouses = async (cityId: string) => {
     if (!cityId) return []
     
     const { data } = await useFetch('/api/shipping/search', {
       query: {
         type: 'warehouses',
         provider: 'nova_post',
         city_external_id: cityId
       }
     })
     
     return data.value || []
   }
   ```

4. **Cache Management:**

   - Implement cache cleanup (remove old entries)
   - Set appropriate TTL (5 minutes default)
   - Consider cache size limits

5. **Error Handling:**

   - Handle debounce errors
   - Handle API errors
   - Return empty array on error

6. **Testing:**

   - Test debounce behavior (rapid typing)
   - Test cache hits (same query)
   - Test cache expiration
   - Test error scenarios

**Dependencies:**

- Shipping search API (Phase 4)
- Checkout composables
- Nitro server
- `lodash-es` for debounce

**Expected Results:**

- Reduced API calls (debouncing + caching)
- Faster responses from cache
- Better user experience
- Lower backend load

### 3.3 Server Components

**Goal:** Use `.server.vue` components for heavy catalog filtering to reduce bundle size.

**Files to Create:**

- `app/components/catalog/FiltersSidebar.server.vue` - Server component for filters

**Files to Modify:**

- `app/pages/categories/[category].vue` - Use server component
- `app/pages/categories/index.vue` - Use server component

**Implementation Steps:**

1. **Create Server Component:**
   ```vue
   <!-- app/components/catalog/FiltersSidebar.server.vue -->
   <script setup lang="ts">
   const props = defineProps<{
     filters: FilterParams
     categoryId?: string
   }>()
   
   // Heavy filtering logic runs on server only
   const { data: filteredProducts } = await useAsyncData(
     `filtered-products-${props.categoryId}`,
     () => {
       // Heavy computation: filtering, sorting, aggregation
       return computeFilteredProducts(props.filters, props.categoryId)
     }
   )
   
   // Aggregations for filter options
   const { data: aggregations } = await useAsyncData(
     `aggregations-${props.categoryId}`,
     () => computeAggregations(props.filters, props.categoryId)
   )
   </script>
   
   <template>
     <div class="filters-sidebar">
       <!-- Filter UI rendered on server -->
       <!-- No client-side JavaScript for filtering -->
       <FilterGroup 
         v-for="group in aggregations" 
         :key="group.id"
         :group="group"
       />
     </div>
   </template>
   ```

2. **Update Category Pages:**

   - Replace client-side `FiltersSidebar` with `FiltersSidebar.server`
   - Pass filters and category ID as props
   - Server component handles all filtering logic

3. **Client-Side Interactivity:**

   - Keep filter UI interactive (checkboxes, sliders)
   - Use `useFetch` with `watch` for reactive updates
   - Server component re-renders on filter changes

4. **Bundle Size Measurement:**

   - Measure bundle size before/after
   - Verify JavaScript reduction
   - Check initial load performance

5. **Performance Testing:**

   - Test initial render time
   - Test filter interaction
   - Compare with client-side filtering
   - Measure bundle size reduction

6. **Fallback Strategy:**

   - If server components cause issues, keep client version
   - Use feature flag to toggle between server/client

**Dependencies:**

- Catalog store
- Category pages
- Nuxt 4 server components support
- Filter components

**Expected Results:**

- Reduced client-side JavaScript bundle
- Faster initial render (computation on server)
- No hydration needed for filters
- Better performance on low-end devices

## Implementation Order

1. **Phase 2.1** - Store cleanup (depends on Phase 0.2)
2. **Phase 2.2** - Optimistic UI (depends on 2.1, Phase 0.3)
3. **Phase 2.3** - Checkout refactoring (can be parallel with 2.2)
4. **Phase 3.1** - SEO migration (independent)
5. **Phase 3.2** - Nitro debounce (depends on 2.3)
6. **Phase 3.3** - Server components (independent, experimental)

## Testing Checklist

- [ ] Test cart mutations after store cleanup (verify network layer handles retries)
- [ ] Test optimistic UI with network throttling
- [ ] Test optimistic UI rollback on 409/422 errors
- [ ] Test checkout composables independently
- [ ] Test SEO meta tags on all pages
- [ ] Test structured data validity
- [ ] Test Nitro debounce with rapid typing
- [ ] Test cache hits and expiration
- [ ] Test server components bundle size reduction
- [ ] Test server components performance vs client
- [ ] Test feature flags (enable/disable optimistic UI)

## Dependencies

- Phase 0.2 (auto-retry interceptor) - Required for store cleanup
- Phase 0.3 (error taxonomy) - Required for optimistic UI
- Notifications store - For user feedback in optimistic UI
- Nuxt SEO module - For SEO migration
- Shipping search API (Phase 4) - For checkout refactoring (can use placeholder)
- Nuxt 4 server components - For server components feature