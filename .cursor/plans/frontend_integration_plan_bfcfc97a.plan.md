---
name: Frontend Integration Plan
overview: Structured implementation plan for integrating all available backend API endpoints into the frontend, organized by 10 business domains with priority-based execution strategy.
todos:
  - id: phase1-payments
    content: Update checkout store to use unified payments endpoint (/payments/init)
    status: pending
  - id: phase1-shipping-composable
    content: Create useShippingSearch composable with settlements and warehouses search
    status: pending
  - id: phase1-shipping-components
    content: Build SettlementSearch and WarehouseSelector components
    status: pending
  - id: phase1-checkout-integration
    content: Integrate shipping search into checkout flow
    status: pending
  - id: phase2-loyalty-store
    content: Create loyalty store with account and history actions
    status: pending
  - id: phase2-loyalty-ui
    content: Build loyalty balance widget and history components
    status: pending
  - id: phase2-notifications-filtering
    content: Add notification filtering (all/unread/archived)
    status: pending
  - id: phase2-notifications-preferences
    content: Build notification preferences matrix UI
    status: pending
  - id: phase2-order-statuses
    content: Implement order status filtering
    status: pending
  - id: phase3-password-email
    content: Add password and email change functionality to profile
    status: pending
  - id: phase3-review-replies
    content: Implement review replies feature
    status: pending
  - id: phase3-site-contacts
    content: Display site contacts in footer
    status: pending
  - id: phase4-audience-pages
    content: Create audience confirmation and unsubscribe pages
    status: pending
  - id: phase4-support-types
    content: Add support request types to contact form
    status: pending
---

# Frontend Integration Implementation Plan

## Overview

This plan organizes the implementation of **20+ backend endpoints** across **10 business domains**. All backend APIs are fully available; frontend integration is pending.

**Total Scope:** 10 feature groups • 20+ endpoints • 17+ new files • 15+ file updates

---

## Priority-Based Execution Strategy

### Phase 1: Critical (Blocks Core Features)

**Timeline:** Immediate

- **Shipping Settlements/Warehouses** - Required for warehouse delivery
- **Payments API Migration** - Update to unified endpoint

### Phase 2: High Priority (UX Enhancement)

**Timeline:** Next sprint

- **Loyalty Points System** - User engagement
- **Notifications Filtering & Preferences** - Better notification management
- **Order Statuses & Filtering** - Enhanced order browsing

### Phase 3: Medium Priority (User Convenience)

**Timeline:** Following sprint

- **Password & Email Management** - Account security
- **Review Replies** - Complete review functionality
- **Site Contacts** - Display contact information

### Phase 4: Low Priority (Nice to Have)

**Timeline:** Future iterations

- **Audience Email Confirmation** - Complete subscription flow
- **Customer Support Types** - Form enhancement

---

## Business Block 1: Authentication & Identity

### Feature: Password & Email Management

**Priority:** Medium | **Endpoints:** 4 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/auth.ts`

Add interfaces:

```typescript
interface PasswordChangeRequest {
  current_password: string
  new_password: string
}

interface PasswordChangeConfirm {
  token: string
  email: string
}

interface EmailChangeRequest {
  new_email: string
}
```

**2. Store Actions**

File: `app/stores/auth.store.ts`

Add actions:

- `requestPasswordChange(currentPassword, newPassword)` - POST `/change-password/request`
- `confirmPasswordChange(token, email)` - POST `/change-password/confirm/{token}`
- `requestEmailChange(newEmail)` - POST `/change-email/request`
- `confirmEmailChange(id, hash)` - GET `/change-email/{id}/{hash}`

**3. New Pages**

Create:

- `app/pages/auth/change-password-confirm.vue` - Password change confirmation
- `app/pages/auth/change-email-confirm.vue` - Email change confirmation

Both pages:

- Extract token/hash from URL
- Call store action
- Display success/error message
- Redirect to profile on success

**4. Settings UI**

File: `app/pages/profile/settings.vue`

Add sections:

- Password change form (current + new password)
- Email change form (new email input)
- Form validation and error handling
- Success/error notifications

#### Technical Notes

- Password change requires current password validation before sending email
- Email change uses signed URLs (similar to email verification)
- Both features redirect to frontend after backend processing
- Handle 422 validation errors
- Show loading states during requests

---

## Business Block 2: User Account & Profile

### Feature: Loyalty Points System

**Priority:** High | **Endpoints:** 2 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/loyalty.ts` (create new)

```typescript
interface LoyaltyAccount {
  user_id: number
  balance: string  // Formatted currency
  pending: string  // Formatted currency
}

interface LoyaltyTransaction {
  id: number
  type: 'Accrual' | 'Spending'
  amount: string
  description: string
  expires_at: string | null
  created_at: string
}

interface LoyaltyHistoryResponse {
  data: LoyaltyTransaction[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
```

**2. Store Creation**

File: `app/stores/loyalty.store.ts` (create new)

State:

- `account: LoyaltyAccount | null`
- `history: LoyaltyTransaction[]`
- `historyPagination: PaginationMeta`
- `loading: boolean`
- `error: Error | null`

Actions:

- `fetchLoyaltyAccount()` - GET `/api/v1/loyalty`
- `fetchLoyaltyHistory(page?, perPage?)` - GET `/api/v1/loyalty/history`
- `resetHistory()` - Clear history state

**3. Components**

Create:

- `app/components/profile/LoyaltyBalance.vue` - Balance widget showing active + pending
- `app/components/profile/LoyaltyHistory.vue` - Transaction history with pagination

Balance component features:

- Display active balance prominently
- Show pending balance separately
- Visual distinction between types
- Loading skeleton

History component features:

- Transaction list with type badges (Accrual/Spending)
- Amount display with +/- indicators
- Expiration date display (if applicable)
- Pagination controls
- Empty state handling

**4. Pages**

Create:

- `app/pages/profile/loyalty.vue` - Full loyalty account page

Update:

- `app/pages/profile/index.vue` - Add LoyaltyBalance widget
- `app/pages/profile/orders/[id].vue` - Show points spent/earned per order

#### Technical Notes

- Points displayed as formatted currency strings ("$100.00")
- Separate pending vs. active balance
- Transactions can have expiration dates
- Standard pagination pattern
- CSR-only (requires authentication)
- Fetch on `onMounted`

---

## Business Block 3: Content Domain

### Feature: Review Replies

**Priority:** Medium | **Endpoints:** 1 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/reviews.ts`

Verify `ReviewReply` interface exists (likely already defined):

```typescript
interface ReviewReply {
  id: number
  review_id: number
  user_id: number
  body: string
  is_active: boolean
  created_at: string
  user?: User
}
```

**2. Store Action**

File: `app/stores/reviews.store.ts`

Add action:

- `createReply(reviewId: number, body: string)` - POST `/api/v1/reviews/{review_id}/replies`

Implementation:

- Use `useApi()` composable
- Handle 401 (authentication required)
- Handle 422 (validation errors)
- Return created reply
- Optionally update local review data

**3. Components**

Create:

- `app/components/product/ReviewReplyForm.vue`

Features:

- Textarea for reply body
- Character count
- Submit button
- Loading state
- Error display
- Clear form on success

Update:

- `app/components/product/ReviewItem.vue`

Add:

- Reply button (show only if authenticated)
- Toggle reply form visibility
- Display existing replies
- Add new reply to list on success

#### Technical Notes

- Authentication required (check auth state)
- Replies are active by default (no moderation)
- Review item component likely already displays replies array
- Form validation: min length, max length
- Clear form after successful submission
- Optimistic UI update optional

---

## Business Block 4: Notifications Domain

### Feature: Notifications Filtering & Preferences

**Priority:** High | **Endpoints:** 3 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/notifications.ts`

Add:

```typescript
interface NotificationChannel {
  value: number  // 1=Mail, 2=Database, 3=Broadcast
  title: string
  contact_channel: {
    value: number
    can_link: boolean
    can_unlink: boolean
    is_linked: boolean
  }
  groups: NotificationGroup[]
}

interface NotificationGroup {
  value: number  // Group ID
  title: string
  description: string
  enabled: boolean
}

type NotificationFilter = 'all' | 'unread' | 'archived'
```

**2. Store Updates**

File: `app/stores/notifications.store.ts`

Update state:

- Add `preferences: NotificationChannel[]`
- Add `currentFilter: NotificationFilter`

Update actions:

- Modify `fetchNotifications(filter?: NotificationFilter)` - Add filter parameter
- Add `fetchPreferences()` - GET `/api/v1/notifications/preferences`
- Add `togglePreference(channel: number, group: number)` - PUT `/api/v1/notifications/preferences/{channel}/{group}`

**3. Components**

Create:

- `app/components/profile/NotificationPreferencesMatrix.vue`

Features:

- Display channels as columns (Mail, Database, Broadcast)
- Display groups as rows (System, Orders, etc.)
- Toggle switches for each channel-group combination
- Show contact channel link status
- Disable toggles if contact channel not linked
- Loading state for toggle actions
- Optimistic UI updates

**4. Pages**

Update:

- `app/pages/profile/notifications.vue`

Add:

- Filter tabs (All, Unread, Archived)
- Active filter state
- Filter change handler
- Reload notifications on filter change

Create:

- `app/pages/profile/notifications-preferences.vue`

Features:

- Page header with description
- Integrate NotificationPreferencesMatrix component
- Loading state
- Error handling
- Save confirmation

#### Technical Notes

- Filters: `all`, `unread`, `archived`
- Channel IDs: 1=Mail, 2=Database, 3=Broadcast
- Groups represent categories (System, Orders, Marketing, etc.)
- Toggle endpoint switches enabled/disabled state (boolean flip)
- Preferences require contact channels to be linked
- CSR-only (authenticated)

---

## Business Block 5: Shipping & Delivery

### Feature: Shipping Settlements & Warehouses Search

**Priority:** Critical | **Endpoints:** 2 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/checkout.ts`

Add:

```typescript
interface Settlement {
  external_id: string
  name: string
  region?: string
  postal_index?: string
}

interface Warehouse {
  external_id: string
  name: string
  address: string
  schedule?: string
  supports_payment?: boolean
  max_weight_kg?: number
}

interface SettlementSearchParams {
  provider_code: string
  city_name: string
  limit?: number
  page?: number
}

interface WarehouseSearchParams {
  provider_code: string
  method_code: string
  city_external_id: string
  checkout_session_id: string
  search?: string
  limit?: number
  page?: number
}
```

**2. Composable Creation**

File: `app/composables/useShippingSearch.ts` (create new)

Functions:

- `searchSettlements(params: SettlementSearchParams)` - GET `/api/v1/shipping/{provider_code}/settlements/search`
- `searchWarehouses(params: WarehouseSearchParams)` - GET `/api/v1/shipping/{provider_code}/warehouses/search`

Implementation:

- Use `useApi()` composable
- Handle loading states
- Handle errors
- Return reactive data
- Support pagination

**3. Components**

Create:

- `app/components/checkout/SettlementSearch.vue`

Features:

- Autocomplete input for city search
- Debounced search (300ms)
- Loading spinner
- Results dropdown
- Settlement selection
- Keyboard navigation
- Empty state

Create:

- `app/components/checkout/WarehouseSelector.vue`

Features:

- Warehouse/pickup point list
- Search filter input
- Warehouse details display (address, schedule)
- Selection radio buttons
- Supports payment indicator
- Max weight display
- Pagination
- Empty state

**4. Store Updates**

File: `app/stores/checkout.store.ts`

Update:

- `applyShippingMethod()` - Add support for `provider_metadata.warehouse_external_id`
- Ensure `fetchShippingMethods()` passes `checkout_session_id`

Add state:

- `selectedSettlement: Settlement | null`
- `selectedWarehouse: Warehouse | null`

**5. Page Integration**

File: `app/pages/checkout.vue`

Integration:

- Show SettlementSearch for warehouse shipping methods
- Show WarehouseSelector after settlement selected
- Pass warehouse_external_id when applying shipping method
- Clear warehouse selection if settlement changes
- Validation: require warehouse selection for warehouse methods

#### Technical Notes

- **Critical for warehouse shipping** (Nova Post, etc.)
- Settlements search returns cities with external IDs
- Warehouses require city external ID + checkout session ID
- Warehouses auto-filtered by cargo dimensions/weight
- Warehouse metadata included in shipping method application
- Settlement must be selected before warehouse search
- CSR-only (checkout flow)

---

## Business Block 6: Payments Domain

### Feature: Payments API Migration (Unified Endpoint)

**Priority:** Critical | **Endpoints:** 1 | **Status:** Update Required

#### Implementation Steps

**1. Type Updates**

File: `app/types/checkout.ts`

Update:

```typescript
interface PaymentInitPayload {
  order_id: number
  provider_code: string  // MOVE FROM URL TO BODY
}
```

**2. Store Updates**

File: `app/stores/checkout.store.ts`

Update `initializePayment(orderId: number, providerCode: string)`:

Before:

```typescript
const response = await api(`/api/v1/payments/${providerCode}/init`, {
  method: 'POST',
  body: { order_id: orderId }
})
```

After:

```typescript
const response = await api('/api/v1/payments/init', {
  method: 'POST',
  body: { 
    order_id: orderId,
    provider_code: providerCode 
  }
})
```

#### Technical Notes

- **Simple migration**: move provider_code from URL to body
- Backend endpoint already unified
- Breaking change from old API version
- Test with all payment providers
- Update any related documentation

---

## Business Block 7: Orders Domain

### Feature: Order Statuses & Filtering

**Priority:** High | **Endpoints:** 2 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/orders.ts`

Add:

```typescript
interface OrderStatus {
  id: number
  title: string
}
```

**2. Store Updates**

File: `app/stores/orders.store.ts`

Add state:

- `statuses: OrderStatus[]`
- `selectedStatusFilters: number[]`

Add actions:

- `fetchOrderStatuses()` - GET `/api/v1/orders/statuses`
- Update `fetchOrders(page?, perPage?, statusIds?)` - Add status filter parameter

Update fetch implementation:

```typescript
const params = new URLSearchParams()
if (statusIds?.length) {
  statusIds.forEach(id => params.append('statuses[]', id.toString()))
}
params.append('page', page.toString())
params.append('per_page', perPage.toString())

const response = await api(`/api/v1/orders?${params}`)
```

**3. Components**

Create:

- `app/components/profile/OrderStatusFilter.vue`

Features:

- Multi-select dropdown or chip group
- Display all available statuses
- Selected state indication
- Clear all filters button
- Filter count badge

**4. Page Updates**

File: `app/pages/profile/orders.vue`

Add:

- Integrate OrderStatusFilter component
- Fetch statuses on mount
- Apply filters on selection change
- Reload orders when filters change
- Show active filters count
- Persist filter state in URL query params (optional)

#### Technical Notes

- Statuses endpoint returns simple id/title array
- Filter accepts array: `statuses[]=1&statuses[]=2&statuses[]=3`
- Multiple statuses can be selected simultaneously
- Typical statuses: Pending, Paid, Processing, Shipped, Completed, Cancelled
- Consider caching statuses (rarely change)
- CSR-only (authenticated)

---

## Business Block 8: Marketing & Audience

### Feature: Audience Email Confirmation & Unsubscribe

**Priority:** Low | **Endpoints:** 3 | **Status:** Not Integrated

#### Implementation Steps

**1. Pages**

Create:

- `app/pages/audience/confirm.vue`

Features:

- Extract email from query params
- Display loading state while backend processes
- Show success message on confirmation
- Show error message if failed
- Redirect from backend landing page
- CTA button to continue shopping

Create:

- `app/pages/audience/unsubscribe.vue`

Features:

- Extract email from query params
- Display confirmation message
- Show success/error based on redirect status
- Provide feedback form (optional)
- CTA button to homepage

**2. Store Updates**

File: `app/stores/audience.store.ts`

Add action:

- `unsubscribeFromAccount()` - POST `/api/v1/audience/unsubscribe` (authenticated users)

**3. Settings Integration**

File: `app/pages/profile/settings.vue`

Add:

- Newsletter subscription section
- Unsubscribe button
- Confirmation dialog
- Success/error handling

#### Technical Notes

- Backend GET endpoints redirect to frontend after processing
- Frontend pages display success/error based on redirect
- Signed URLs sent in confirmation emails
- POST unsubscribe for authenticated users only
- GET endpoints handle unauthenticated users
- Both pages are SSR-compatible (public)

---

## Business Block 9: Site Configuration

### Feature: Site Contacts & Information

**Priority:** Medium | **Endpoints:** 1 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/system.ts`

Add:

```typescript
interface SiteContacts {
  contacts: {
    address: string
    address_link: string
    phones: string[]
    email: string
    schedule_html: string
    map_iframe: string
    image: any[]
  }
  messengers: Array<{
    icon: string | null
    title: string
    url: string
  }>
  socials: Array<{
    icon: string | null
    title: string
    url: string
  }>
}
```

**2. Store Updates**

File: `app/stores/system.store.ts`

Add state:

- `contacts: SiteContacts | null`

Add action:

- `fetchContacts()` - GET `/api/v1/site/contacts`

**3. Components**

Create:

- `app/components/layout/Contacts.vue`

Features:

- Display address with link
- Phone numbers list with click-to-call
- Email with mailto link
- Schedule HTML rendering (safe HTML)
- Messengers grid with icons
- Socials grid with icons
- Map iframe embedding
- Responsive layout

**4. Layout Integration**

File: `app/components/layout/AppFooter.vue`

Integration:

- Add contacts section
- Fetch contacts on mount (or in layout)
- Display using Contacts component
- Loading skeleton
- Error handling

#### Technical Notes

- Data auto-localized by Accept-Language header
- Phones returned as flat array of formatted strings
- Schedule can contain HTML markup (sanitize properly)
- Icons may be null (use fallback)
- Consider fetching in app.vue for global availability
- SSR-compatible (public data)
- Cache contacts data (rarely changes)

---

## Business Block 10: Support & Leads

### Feature: Customer Support Request Types

**Priority:** Low | **Endpoints:** 1 | **Status:** Not Integrated

#### Implementation Steps

**1. Type Definitions**

File: `app/types/support.ts`

Add:

```typescript
interface SupportRequestType {
  id: number
  title: string
}
```

**2. Store Updates**

File: `app/stores/support.store.ts`

Add state:

- `requestTypes: SupportRequestType[]`

Add action:

- `fetchRequestTypes()` - GET `/api/v1/customer-support/requests/types`

**3. Page Updates**

File: `app/pages/contact.vue`

Updates:

- Fetch request types on mount
- Add request type dropdown to form
- Make field optional
- Include selected type in form submission
- Default to "General" if not selected

#### Technical Notes

- Simple id/title array for dropdown
- Optional field in contact form
- Helps categorize support requests
- Localized titles from backend
- SSR-compatible (public data)
- Cache types (rarely change)

---

## Implementation Checklist Template

For each feature:

### Pre-Implementation

- [ ] Read relevant API documentation (`ai/api/*.md`)
- [ ] Review store patterns (`ai/stores/stores.md`)
- [ ] Check SSR/CSR rules (`ai/constitution/rendering.md`)
- [ ] Verify endpoint availability

### Development

- [ ] Create/update TypeScript types in `app/types/`
- [ ] Implement store actions using `useApi()`
- [ ] Create required components
- [ ] Integrate into pages
- [ ] Handle loading states
- [ ] Handle error states (401, 422, etc.)
- [ ] Add validation where needed

### Testing

- [ ] Test with actual backend
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test authentication requirements
- [ ] Test pagination (if applicable)
- [ ] Test filters (if applicable)

### Quality Assurance

- [ ] Follow existing patterns
- [ ] Maintain code consistency
- [ ] Add proper TypeScript types
- [ ] Handle edge cases
- [ ] Responsive design
- [ ] Accessibility considerations

---

## Technical Standards

### API Integration

- ✅ Use `useApi()` composable exclusively
- ✅ Handle 401 (auto-logout)
- ✅ Handle 422 (validation errors)
- ✅ Handle 429 (rate limiting)
- ✅ Respect SSR/CSR rules per page type

### Store Patterns

- ✅ Follow patterns in `ai/stores/stores.md`
- ✅ Include loading, error, and data states
- ✅ Use try/catch/finally blocks
- ✅ Return data from actions
- ✅ Handle errors properly

### Component Guidelines

- ✅ Access stores inside computed/functions/onMounted
- ✅ Never access stores at top level
- ✅ Include loading skeletons
- ✅ Include empty states
- ✅ Include error states
- ✅ Follow existing component patterns

### Type Safety

- ✅ Define all interfaces in `app/types/`
- ✅ Type all function parameters
- ✅ Type all function returns
- ✅ Type all store state
- ✅ Type all API responses

---

## Estimated Effort

### Phase 1: Critical (1-2 days)

- Payments API migration: 2 hours
- Shipping search composable: 4 hours
- Shipping components: 6 hours
- Checkout integration: 4 hours

### Phase 2: High Priority (3-4 days)

- Loyalty store + components: 8 hours
- Notifications filtering: 6 hours
- Notifications preferences: 6 hours
- Order statuses: 4 hours

### Phase 3: Medium Priority (2-3 days)

- Password/email management: 8 hours
- Review replies: 4 hours
- Site contacts: 4 hours

### Phase 4: Low Priority (1-2 days)

- Audience pages: 4 hours
- Support types: 2 hours

**Total Estimated Effort:** 9-11 days

---

## Success Criteria

### Per Feature

- ✅ Backend endpoint successfully called
- ✅ Data correctly displayed in UI
- ✅ Error handling works properly
- ✅ Loading states display correctly
- ✅ Follows existing patterns
- ✅ TypeScript types complete
- ✅ SSR/CSR rules respected

### Overall Project

- ✅ All 20+ endpoints integrated
- ✅ All 10 business blocks complete
- ✅ Code quality maintained
- ✅ Documentation updated
- ✅ No console errors
- ✅ Responsive design maintained

---

## Related Documentation

- [`ai/api/README.md`](ai/api/README.md) - API navigation index
- [`ai/stores/stores.md`](ai/stores/stores.md) - Store patterns
- [`ai/constitution/rendering.md`](ai/constitution/rendering.md) - SSR/CSR rules
- [`ai/constitution/api-rules.md`](ai/constitution/api-rules.md) - API contracts
- [`ai/operations/not-implemented.md`](ai/operations/not-implemented.md) - Original requirements
- [`ai/operations/frontend-todo.md`](ai/operations/frontend-todo.md) - Quick checklist