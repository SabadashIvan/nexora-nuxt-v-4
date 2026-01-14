---
name: Documentation Support & Remaining Features
overview: Implement Phase 4 (Documentation & Support) including ADRs, feature flags, shipping search, Zod validation, and all remaining medium/low priority features across notifications, orders, loyalty, site configuration, and content domains.
todos: []
---

# Documentation Support & Remaining Features Plan

This plan implements Phase 4 from the API implementation plan, covering documentation, feature flags, shipping search, form validation, and all remaining medium/low priority features.

## Phase 4: Documentation & Support

### 4.1 ADR Creation

**Goal:** Document architectural decisions for future developers.

**Files to Create:**

- `docs/adr/000-template.md` - ADR template
- `docs/adr/001-network-layer-architecture.md` - Network layer ADR
- `docs/adr/002-cart-concurrency-control.md` - Cart concurrency ADR
- `docs/adr/003-optimistic-ui-pattern.md` - Optimistic UI ADR

**Implementation Steps:**

1. **Create ADR Directory:**

   - Create `docs/adr/` directory
   - Add to `.gitignore` if needed (or commit ADRs)

2. **Create ADR Template:**
   ```markdown
   # ADR 000: Template
   
   ## Status
   [Proposed | Accepted | Deprecated | Superseded]
   
   ## Context
   [Describe the issue motivating this decision]
   
   ## Decision
   [Describe the change that we're proposing or have agreed to implement]
   
   ## Consequences
   [What becomes easier or more difficult to do because of this change]
   
   ## Alternatives Considered
   [What other options did we consider and why did we reject them]
   ```

3. **ADR 001: Network Layer Architecture**

   - Document `ofetch.create()` approach
   - Explain automatic If-Match header management
   - Explain automatic retry on 409/419
   - Document idempotency key generation
   - Consequences: stores become 70-80% shorter
   - Alternatives: manual header management (rejected)

4. **ADR 002: Cart Concurrency Control**

   - Document cart versioning approach
   - Explain If-Match header usage
   - Document 409 conflict handling
   - Explain automatic retry with version refresh
   - Consequences: prevents lost updates
   - Alternatives: last-write-wins (rejected)

5. **ADR 003: Optimistic UI Pattern**

   - Document optimistic UI approach
   - Explain rollback mechanism
   - Document feature flag usage
   - Explain error handling (409/422 rollback)
   - Consequences: better perceived performance
   - Alternatives: wait-for-server (rejected)

6. **ADR Maintenance:**

   - Keep ADRs brief and focused
   - Update status when decisions change
   - Link related ADRs

**Dependencies:**

- Phase 0 (Network Layer) - For ADR 001
- Phase 2 (Cart Concurrency, Optimistic UI) - For ADR 002, 003

**Expected Results:**

- Clear documentation of architectural decisions
- Easier onboarding for new developers
- Historical record of why decisions were made

### 4.2 Feature Flags Configuration

**Goal:** Complete feature flags system with environment variable support and documentation.

**Files to Modify:**

- `app.config.ts` - Add feature flags (if not already done in Phase 2)
- `.env.example` - Add feature flag environment variables
- `README.md` - Document feature flags

**Implementation Steps:**

1. **Verify Feature Flags in app.config.ts:**

   - Ensure `cart_optimistic_ui` flag exists
   - Add other flags as needed:
     ```typescript
     features: {
       cart_optimistic_ui: {
         enabled: process.env.FEATURE_CART_OPTIMISTIC_UI === 'true' || false,
         description: 'Enable optimistic UI updates for cart operations',
         version: '2.0.0'
       },
       // Add more flags as needed
     }
     ```


2. **Environment Variable Support:**

   - Add to `.env.example`:
     ```
     FEATURE_CART_OPTIMISTIC_UI=false
     ```

   - Document in README

3. **Feature Flag Documentation:**

   - Document each flag in README
   - Explain how to enable/disable
   - Document version and description

4. **Development Mode Toggles (Optional):**

   - Create admin panel for toggling flags (if needed)
   - Or use browser console for development

**Dependencies:**

- Phase 2.2 (Optimistic UI) - Feature flag usage

**Expected Results:**

- Feature flags documented and configurable
- Easy to enable/disable features
- Support for gradual rollout

### 4.3 Shipping Search Implementation

**Goal:** Implement shipping settlements and warehouses search with reactive `useAsyncData` pattern.

**Files to Create:**

- `app/composables/useShippingSearch.ts` - Shipping search composable
- `app/types/shipping.ts` - Shipping search types
- `app/components/checkout/CitySearch.vue` - City search component
- `app/components/checkout/WarehouseSelect.vue` - Warehouse selection component

**Files to Modify:**

- `server/api/shipping/search.ts` - Update Nitro endpoint (from Phase 3.2)
- `app/composables/checkout/useCheckoutCity.ts` - Use shipping search
- `app/composables/checkout/useCheckoutWarehouse.ts` - Use shipping search

**Implementation Steps:**

1. **Shipping Search Types:**
   ```typescript
   // app/types/shipping.ts
   export interface Settlement {
     id: string
     name: string
     region: string
     external_id: string
   }
   
   export interface Warehouse {
     id: string
     name: string
     address: string
     city_external_id: string
     external_id: string
   }
   ```

2. **Shipping Search Composable:**
   ```typescript
   // app/composables/useShippingSearch.ts
   export function useShippingSearch() {
     const searchQuery = ref('')
     const provider = ref('nova_post') // or from config
     
     // Reactive search with useAsyncData
     const { data: settlements, refresh, pending } = useAsyncData(
       `shipping-settlements-${searchQuery.value}`,
       () => {
         if (!searchQuery.value || searchQuery.value.length < 2) {
           return []
         }
         // Use Nitro endpoint from Phase 3.2
         return $fetch('/api/shipping/search', {
           query: {
             type: 'settlements',
             provider: provider.value,
             query: searchQuery.value
           }
         })
       },
       {
         watch: [searchQuery], // Reactive: triggers refresh on query change
         debounce: 300 // Debounce handled server-side
       }
     )
     
     const searchWarehouses = async (cityExternalId: string) => {
       if (!cityExternalId) return []
       return $fetch('/api/shipping/search', {
         query: {
           type: 'warehouses',
           provider: provider.value,
           city_external_id: cityExternalId
         }
       })
     }
     
     return {
       searchQuery,
       settlements,
       searchWarehouses,
       pending
     }
   }
   ```

3. **City Search Component:**

   - Autocomplete input field
   - Display settlements list
   - Handle selection
   - Integrate with checkout city composable

4. **Warehouse Selection Component:**

   - Display warehouses list for selected city
   - Filter/search warehouses
   - Handle selection
   - Show warehouse details (address, etc.)

5. **Update Checkout Composables:**

   - `useCheckoutCity()`: Use `useShippingSearch()` for city search
   - `useCheckoutWarehouse()`: Use `useShippingSearch()` for warehouse search

6. **Integration:**

   - Add city search to checkout address form
   - Add warehouse selection for warehouse shipping methods
   - Handle provider-specific logic (Nova Post, etc.)

7. **Error Handling:**

   - Handle API errors
   - Show user-friendly error messages
   - Handle empty results

**Dependencies:**

- Phase 3.2 (Nitro debounce) - Server-side debouncing
- Checkout composables (Phase 2.3)
- Shipping API endpoints

**Expected Results:**

- Reactive city/warehouse search
- Server-side debouncing reduces API calls
- Better user experience in checkout

### 4.4 Zod Form Validation

**Goal:** Add client-side validation for all forms using Zod.

**Files to Create:**

- `app/utils/validation/schemas/review.schema.ts` - Review form schema
- `app/utils/validation/schemas/comment.schema.ts` - Comment form schema
- `app/utils/validation/schemas/contact.schema.ts` - Contact form schema
- `app/utils/validation/schemas/checkout.schema.ts` - Checkout form schema
- `app/composables/useFormValidation.ts` - Form validation composable

**Files to Modify:**

- `app/components/product/ReviewForm.vue` - Add Zod validation
- `app/components/blog/BlogCommentForm.vue` - Add Zod validation
- `app/components/product/CommentForm.vue` - Add Zod validation
- `app/pages/contact.vue` - Add Zod validation
- `app/components/checkout/AddressForm.vue` - Add Zod validation
- `package.json` - Add zod dependency

**Implementation Steps:**

1. **Install Zod:**
   ```bash
   npm install zod
   ```

2. **Create Validation Schemas:**
   ```typescript
   // app/utils/validation/schemas/review.schema.ts
   import { z } from 'zod'
   
   export const reviewSchema = z.object({
     product_id: z.number().positive(),
     rating: z.number().min(1).max(5),
     title: z.string().min(3).max(255),
     comment: z.string().min(10).max(5000),
     pros: z.string().max(1000).optional(),
     cons: z.string().max(1000).optional(),
   })
   
   export type ReviewFormData = z.infer<typeof reviewSchema>
   ```

3. **Form Validation Composable:**
   ```typescript
   // app/composables/useFormValidation.ts
   import { z } from 'zod'
   
   export function useFormValidation<T extends z.ZodTypeAny>(schema: T) {
     const errors = ref<Record<string, string>>({})
     const isValid = ref(false)
     
     const validate = (data: unknown): data is z.infer<T> => {
       try {
         schema.parse(data)
         errors.value = {}
         isValid.value = true
         return true
       } catch (error) {
         if (error instanceof z.ZodError) {
           errors.value = error.flatten().fieldErrors as Record<string, string>
           isValid.value = false
         }
         return false
       }
     }
     
     const validateField = (field: string, value: unknown) => {
       try {
         schema.shape[field].parse(value)
         delete errors.value[field]
       } catch (error) {
         if (error instanceof z.ZodError) {
           errors.value[field] = error.errors[0].message
         }
       }
     }
     
     return {
       errors: readonly(errors),
       isValid: readonly(isValid),
       validate,
       validateField
     }
   }
   ```

4. **Update Review Form:**

   - Import `reviewSchema` and `useFormValidation`
   - Validate before submission
   - Display field errors
   - Prevent submission if invalid

5. **Update Comment Form:**

   - Create `commentSchema`
   - Add validation to comment forms
   - Display validation errors

6. **Update Contact Form:**

   - Create `contactSchema`
   - Add validation to contact/support forms
   - Display validation errors

7. **Update Checkout Forms:**

   - Create `addressSchema`, `shippingSchema`, etc.
   - Add validation to checkout steps
   - Prevent progression if invalid

8. **Testing:**

   - Test all validation rules
   - Test edge cases
   - Test error messages
   - Test form submission blocking

**Dependencies:**

- Zod library
- All form components
- Review, comment, contact, checkout forms

**Expected Results:**

- Client-side validation before API calls
- Better user experience (immediate feedback)
- Type-safe forms with TypeScript
- Reduced unnecessary API calls

## Remaining Features

### 4.5 Review Replies

**Goal:** Complete reviews system by adding reply functionality.

**Files to Modify:**

- `app/stores/reviews.store.ts` - Add `createReply()` action
- `app/components/product/ReviewItem.vue` - Add reply UI
- `app/types/reviews.ts` - Add reply types

**Implementation Steps:**

1. **Add Reply Types:**

   - `ReviewReply` interface
   - Update `Review` interface to include replies

2. **Store Method:**
   ```typescript
   async createReply(reviewId: number, comment: string) {
     this.loading = true
     try {
       const reply = await useApi().post(`/reviews/${reviewId}/replies`, {
         body: { comment }
       })
       // Update review with new reply
       const review = this.reviews.find(r => r.id === reviewId)
       if (review) {
         review.replies = [...(review.replies || []), reply]
       }
       return reply
     } finally {
       this.loading = false
     }
   }
   ```

3. **Review Item Component:**

   - Add reply button
   - Add reply form
   - Display replies nested under review
   - Handle reply submission

4. **Testing:**

   - Test reply creation
   - Test reply display
   - Test nested replies

**Dependencies:**

- Reviews store
- Review components
- Review API endpoint

### 4.6 Notifications Updates

**Goal:** Add filter parameter and preferences matrix support.

**Files to Modify:**

- `app/stores/notifications.store.ts` - Add filter and preferences support
- `app/pages/profile/notifications.vue` - Add filter tabs
- `app/pages/profile/notifications-preferences.vue` - Create preferences page

**Implementation Steps:**

1. **Update Store:**

   - Add `filter` parameter to `fetchNotifications()`
   - Add `fetchPreferences()` action
   - Update types for preferences matrix

2. **Filter Tabs:**

   - Add "All", "Unread", "Archived" tabs
   - Update notifications list based on filter
   - Use API filter parameter (not client-side)

3. **Preferences Page:**

   - Display preferences matrix (channels × groups)
   - Add toggle functionality
   - Show link/unlink status

**Dependencies:**

- Notifications store
- Notifications pages
- Notifications API endpoints

### 4.7 Orders Updates

**Goal:** Add order status filtering and enhanced order details.

**Files to Modify:**

- `app/stores/orders.store.ts` - Add status filtering
- `app/pages/profile/orders.vue` - Add status filter UI
- `app/pages/profile/orders/[id].vue` - Enhanced order details

**Implementation Steps:**

1. **Order Statuses:**

   - Add `fetchOrderStatuses()` action
   - Store statuses in state

2. **Status Filtering:**

   - Add status filter to `fetchOrders()`
   - Add filter dropdown to orders list
   - Update orders list based on filter

3. **Enhanced Order Details:**

   - Display shipment tracking
   - Display payment intent status
   - Show enhanced item details (options, loyalty discounts)
   - Show enhanced totals breakdown

**Dependencies:**

- Orders store
- Orders pages
- Orders API endpoints

### 4.8 Loyalty Points System

**Goal:** Implement loyalty points display and history.

**Files to Create:**

- `app/stores/loyalty.store.ts` - Loyalty store
- `app/types/loyalty.ts` - Loyalty types
- `app/pages/profile/loyalty.vue` - Loyalty account page

**Files to Modify:**

- `app/pages/profile/orders/[id].vue` - Add loyalty points to order summary
- `app/pages/profile/index.vue` - Add loyalty balance display

**Implementation Steps:**

1. **Loyalty Store:**

   - `fetchLoyaltyAccount()` action
   - `fetchLoyaltyHistory()` action with pagination
   - Store loyalty balance and history

2. **Loyalty Types:**

   - `LoyaltyAccount` interface
   - `LoyaltyTransaction` interface
   - Transaction types (Accrual/Spending)

3. **Loyalty Page:**

   - Display balance (active + pending)
   - Display transaction history
   - Format amounts with currency
   - Show expiration dates

4. **Order Summary:**

   - Display loyalty points used/earned
   - Show loyalty discount

**Dependencies:**

- Profile pages
- Orders store
- Loyalty API endpoints

### 4.9 Site Contacts

**Goal:** Add site contacts to footer.

**Files to Create:**

- `app/stores/site.store.ts` - Site store (if not exists)
- `app/components/layout/ContactsDisplay.vue` - Contacts component

**Files to Modify:**

- `app/components/layout/AppFooter.vue` - Add contacts display

**Implementation Steps:**

1. **Site Store:**

   - Add `fetchContacts()` action
   - Store contacts in state

2. **Contacts Component:**

   - Display contact information
   - Display messengers
   - Display social links
   - Handle translations

3. **Footer Integration:**

   - Add contacts to footer
   - Fetch contacts on app init

**Dependencies:**

- Layout components
- Site API endpoint

### 4.10 Customer Support Types

**Goal:** Add request types to contact form.

**Files to Modify:**

- `app/stores/support.store.ts` - Add `fetchRequestTypes()` action
- `app/pages/contact.vue` - Add request type dropdown

**Implementation Steps:**

1. **Store Method:**

   - Add `fetchRequestTypes()` action
   - Store types in state

2. **Contact Form:**

   - Add request type dropdown
   - Populate from store
   - Include in submission

**Dependencies:**

- Support store
- Contact page
- Support API endpoint

### 4.11 Blog Sort Parameter

**Goal:** Add sort option to blog listing.

**Files to Modify:**

- `app/stores/blog.store.ts` - Add sort parameter
- `app/pages/blog/index.vue` - Add sort dropdown

**Implementation Steps:**

1. **Store Update:**

   - Add `sort` parameter to `fetchPosts()`
   - Support 'newest' and 'oldest'

2. **Blog Page:**

   - Add sort dropdown
   - Update posts on sort change

**Dependencies:**

- Blog store
- Blog pages
- Blog API endpoint

### 4.12 Payments API Updates

**Goal:** Update payment initialization to use new endpoint structure.

**Files to Modify:**

- `app/stores/checkout.store.ts` - Update payment initiation
- `app/types/checkout.ts` - Update payment types

**Implementation Steps:**

1. **Endpoint Update:**

   - Change from `/payments/{provider}/init` to `/payments/init`
   - Provider code is now optional

2. **Response Structure:**

   - Handle new response (payment_intent_id, status, payment_url)
   - Update types

3. **Idempotency:**

   - Ensure `idempotent: true` is used (from Phase 0.4)

4. **Testing:**

   - Test payment flow end-to-end

**Dependencies:**

- Checkout store
- Payments API endpoint

### 4.13 Audience API Updates

**Goal:** Handle signed URL confirm/unsubscribe flows.

**Files to Create:**

- `app/pages/audience/confirm.vue` - Email confirmation page
- `app/pages/audience/unsubscribe.vue` - Unsubscribe page

**Files to Modify:**

- `app/stores/audience.store.ts` - Add unsubscribe methods
- `app/pages/profile/settings.vue` - Add unsubscribe option

**Implementation Steps:**

1. **Signed URL Pages:**

   - Handle redirect from signed URLs
   - Extract token from query params
   - Call appropriate API endpoint
   - Show success/error messages

2. **Store Methods:**

   - `unsubscribeFromAccount()` for authenticated users
   - Handle signed URL confirm/unsubscribe

3. **Profile Settings:**

   - Add unsubscribe option
   - Show subscription status

**Dependencies:**

- Audience store
- Profile pages
- Audience API endpoints

## Implementation Order

1. **4.1 ADR Creation** - Documentation (can be done in parallel)
2. **4.2 Feature Flags** - Configuration (if not done in Phase 2)
3. **4.3 Shipping Search** - High priority for checkout
4. **4.4 Zod Validation** - Improves UX for all forms
5. **4.5-4.13 Remaining Features** - Can be done in parallel based on priority

## Testing Checklist

- [ ] Test shipping search with reactive useAsyncData
- [ ] Test Zod validation on all forms
- [ ] Test review replies creation and display
- [ ] Test notifications filtering
- [ ] Test notifications preferences matrix
- [ ] Test order status filtering
- [ ] Test enhanced order details
- [ ] Test loyalty points display and history
- [ ] Test site contacts in footer
- [ ] Test customer support request types
- [ ] Test blog sort parameter
- [ ] Test payment flow with new endpoint
- [ ] Test audience signed URL flows

## Dependencies

- Phase 0 (Network Layer) - For consistent API patterns
- Phase 2 (Feature Flags) - For feature flag configuration
- Phase 3.2 (Nitro Debounce) - For shipping search
- All API endpoints for remaining features