# Frontend Integration Roadmap

This document tracks features where **backend API endpoints are available** but **frontend integration is pending**.

**Last Updated:** 2026-01-19

---

## ✅ Backend API Status: 100% Complete

**All 17+ backend endpoints across 10 feature groups are FULLY IMPLEMENTED and available.**

This document now serves as a **frontend integration roadmap**, tracking which features need UI, store actions, and component implementations.

---

## 📊 Quick Status Overview

| Feature Group | Backend API | Frontend | Priority | Endpoints |
|--------------|-------------|----------|----------|-----------|
| Password & Email Management | ✅ Available | ❌ Not Integrated | Medium | 4 |
| Loyalty Points System | ✅ Available | ❌ Not Integrated | High | 2 |
| Review Replies | ✅ Available | ❌ Not Integrated | Medium | 1 |
| Notifications Filtering | ✅ Available | ❌ Not Integrated | High | 3 |
| Shipping Settlements/Warehouses | ✅ Available | ❌ Not Integrated | **Critical** | 2 |
| Payments API (Unified) | ✅ Available | ⚠️ Update Needed | **Critical** | 1 |
| Order Statuses | ✅ Available | ❌ Not Integrated | High | 2 |
| Audience Signed URLs | ✅ Available | ❌ Not Integrated | Low | 3 |
| Site Contacts | ✅ Available | ❌ Not Integrated | Medium | 1 |
| Support Request Types | ✅ Available | ❌ Not Integrated | Low | 1 |

**Total**: 10 feature groups • 17+ backend endpoints • 0 fully integrated in frontend

---

## 1. Authentication & Identity Domain

### 1.1 Password & Email Management

**Backend API:** ✅ **AVAILABLE** (4 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟡 **Medium**

#### Available Backend Endpoints
- ✅ `POST /change-password/request` - Request password change
- ✅ `POST /change-password/confirm/{token}` - Confirm password change with token
- ✅ `POST /change-email/request` - Request email change
- ✅ `GET /change-email/{id}/{hash}` - Confirm email change with signed URL

#### Frontend Integration Required

**Files to Create:**
- `app/pages/auth/change-password-confirm.vue` - Password change confirmation page
- `app/pages/auth/change-email-confirm.vue` - Email change confirmation page

**Files to Update:**
- `app/stores/auth.store.ts` - Add actions:
  - `requestPasswordChange(currentPassword, newPassword)`
  - `confirmPasswordChange(token, email)`
  - `requestEmailChange(newEmail)`
  - `confirmEmailChange(id, hash)`
- `app/pages/profile/settings.vue` - Add UI for password/email change requests
- `app/types/auth.ts` - Add request/response types

#### Implementation Notes
- Password change requires current password validation before sending confirmation email
- Email change uses signed URLs for confirmation (similar to email verification)
- Both features redirect to frontend pages after backend processing

---

## 2. User Account & Profile Domain

### 2.1 Loyalty Points System

**Backend API:** ✅ **AVAILABLE** (2 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟠 **High**

#### Available Backend Endpoints
- ✅ `GET /api/v1/loyalty` - Get loyalty account details (balance, pending)
- ✅ `GET /api/v1/loyalty/history` - Get loyalty transaction history (paginated)

#### Frontend Integration Required

**Files to Create:**
- `app/stores/loyalty.store.ts` - Complete loyalty store with actions:
  - `fetchLoyaltyAccount()` - Get balance and pending points
  - `fetchLoyaltyHistory(page, perPage)` - Get transaction history
- `app/types/loyalty.ts` - Loyalty types:
  ```typescript
  interface LoyaltyAccount {
    user_id: number
    balance: string
    pending: string
  }
  
  interface LoyaltyTransaction {
    id: number
    type: 'Accrual' | 'Spending'
    amount: string
    description: string
    expires_at: string | null
    created_at: string
  }
  ```
- `app/pages/profile/loyalty.vue` - Loyalty account page with balance and history
- `app/components/profile/LoyaltyBalance.vue` - Balance display widget
- `app/components/profile/LoyaltyHistory.vue` - Transaction history list

**Files to Update:**
- `app/pages/profile/index.vue` - Add loyalty balance widget
- `app/pages/profile/orders/[id].vue` - Show loyalty points spent/earned

#### Implementation Notes
- Loyalty points are displayed as formatted currency strings (e.g., "$100.00")
- History uses standard pagination (current_page, last_page, per_page, total)
- Transactions can have expiration dates
- Frontend should show pending vs. active balance separately

---

## 3. Content Domain (Reviews)

### 3.1 Review Replies

**Backend API:** ✅ **AVAILABLE** (1 endpoint)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟡 **Medium**

#### Available Backend Endpoints
- ✅ `POST /api/v1/reviews/{review_id}/replies` - Create reply to a review

#### Frontend Integration Required

**Files to Create:**
- `app/components/product/ReviewReplyForm.vue` - Dedicated reply form component

**Files to Update:**
- `app/stores/reviews.store.ts` - Add `createReply(reviewId, body)` action
- `app/components/product/ReviewItem.vue` - Add reply button and form toggle
- `app/types/reviews.ts` - Add ReviewReply type if not exists

#### Implementation Notes
- Only authenticated users can create replies
- Replies are active by default (no moderation)
- Review item component already displays replies array
- Need to add UI for creating new replies

---

## 4. Notifications Domain

### 4.1 Notifications Filtering & Preferences

**Backend API:** ✅ **AVAILABLE** (3 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟠 **High**

#### Available Backend Endpoints
- ✅ `GET /api/v1/notifications?filter=all|unread|archived` - List notifications with filter
- ✅ `GET /api/v1/notifications/preferences` - Get notification preferences matrix
- ✅ `PUT /api/v1/notifications/preferences/{channel}/{group}` - Toggle preference

#### Frontend Integration Required

**Files to Create:**
- `app/pages/profile/notifications-preferences.vue` - Preferences matrix page
- `app/components/profile/NotificationPreferencesMatrix.vue` - Matrix UI component
- `app/types/notifications.ts` - Add preference types:
  ```typescript
  interface NotificationChannel {
    value: number
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
    value: number
    title: string
    description: string
    enabled: boolean
  }
  ```

**Files to Update:**
- `app/stores/notifications.store.ts` - Add/update actions:
  - Update `fetchNotifications(filter)` to accept filter parameter
  - Add `fetchPreferences()` - Get preferences matrix
  - Add `togglePreference(channel, group)` - Toggle preference
- `app/pages/profile/notifications.vue` - Add filter tabs (all/unread/archived)

#### Implementation Notes
- Filter parameter: `all`, `unread`, `archived`
- Preferences use channel IDs (1=Mail, 2=Database, 3=Broadcast)
- Groups represent notification categories (1=System, etc.)
- Toggle endpoint switches enabled/disabled state

---

## 5. Shipping & Delivery Domain

### 5.1 Shipping Settlements & Warehouses Search

**Backend API:** ✅ **AVAILABLE** (2 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🔴 **Critical**

#### Available Backend Endpoints
- ✅ `GET /api/v1/shipping/{provider_code}/settlements/search` - Search cities/settlements
- ✅ `GET /api/v1/shipping/{provider_code}/warehouses/search` - Search warehouses/pickup points

#### Frontend Integration Required

**Files to Create:**
- `app/composables/useShippingSearch.ts` - Composable for shipping searches:
  ```typescript
  export function useShippingSearch() {
    const searchSettlements = async (providerCode, cityName, limit?, page?) => { }
    const searchWarehouses = async (providerCode, methodCode, cityExternalId, checkoutSessionId, search?, limit?, page?) => { }
    return { searchSettlements, searchWarehouses }
  }
  ```
- `app/components/checkout/SettlementSearch.vue` - City search with autocomplete
- `app/components/checkout/WarehouseSelector.vue` - Warehouse/pickup point selection
- `app/types/checkout.ts` - Add types:
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
  ```

**Files to Update:**
- `app/pages/checkout.vue` - Integrate city/warehouse selection for warehouse shipping methods
- `app/stores/checkout.store.ts` - Update:
  - `applyShippingMethod()` to support `provider_metadata.warehouse_external_id`
  - `fetchShippingMethods()` - Already uses `checkout_session_id` parameter

#### Implementation Notes
- **Critical for warehouse shipping methods** (Nova Post, etc.)
- Settlements search returns cities with external IDs
- Warehouses search requires city external ID and checkout session ID
- Warehouse metadata must be included when applying shipping method
- Warehouses are filtered automatically by cargo dimensions/weight

---

## 6. Payments Domain

### 6.1 Payments API Migration (Unified Endpoint)

**Backend API:** ✅ **AVAILABLE** (1 unified endpoint)  
**Frontend:** ⚠️ **UPDATE REQUIRED**  
**Priority:** 🔴 **Critical**

#### Available Backend Endpoint
- ✅ `POST /api/v1/payments/init` - Unified payment initialization

#### Migration Required

**Old Endpoint (Deprecated):**
```typescript
POST /api/v1/payments/{provider_code}/init
Body: { order_id: number }
```

**New Endpoint (Current):**
```typescript
POST /api/v1/payments/init
Body: { 
  order_id: number,
  provider_code: string  // Now in body instead of URL
}
```

**Files to Update:**
- `app/stores/checkout.store.ts` - Update `initializePayment()`:
  - Change URL from `/payments/${providerCode}/init` to `/payments/init`
  - Move `provider_code` from URL path to request body
- `app/types/checkout.ts` - Update `PaymentInitPayload`:
  ```typescript
  interface PaymentInitPayload {
    order_id: number
    provider_code: string  // Add this field
  }
  ```

#### Implementation Notes
- Simple migration: move provider code from URL to body
- Backend endpoint is already unified
- Update required to use current API version

---

## 7. Orders Domain

### 7.1 Order Statuses & Filtering

**Backend API:** ✅ **AVAILABLE** (2 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟠 **High**

#### Available Backend Endpoints
- ✅ `GET /api/v1/orders/statuses` - Get list of order statuses
- ✅ `GET /api/v1/orders?statuses[]=1&statuses[]=2` - List orders with status filtering

#### Frontend Integration Required

**Files to Update:**
- `app/stores/orders.store.ts` - Add/update:
  - `fetchOrderStatuses()` - Get available statuses
  - Update `fetchOrders(page, perPage, statuses?)` to support status filtering
- `app/pages/profile/orders.vue` - Add status filter UI (dropdown or chips)
- `app/types/orders.ts` - Add OrderStatus type:
  ```typescript
  interface OrderStatus {
    id: number
    title: string
  }
  ```

#### Implementation Notes
- Statuses endpoint returns simple id/title array
- Filter accepts array of status IDs: `statuses[]=1&statuses[]=2&statuses[]=3`
- Multiple statuses can be selected simultaneously
- Typical statuses: Pending, Paid, Processing, Shipped, Completed, Cancelled

---

## 8. Marketing & Audience Domain

### 8.1 Audience Email Confirmation & Unsubscribe

**Backend API:** ✅ **AVAILABLE** (3 endpoints)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟢 **Low**

#### Available Backend Endpoints
- ✅ `GET /api/v1/audience/confirm?email={email}` - Confirm subscription via signed URL (redirects to frontend)
- ✅ `GET /api/v1/audience/unsubscribe?email={email}` - Unsubscribe via signed URL (redirects to frontend)
- ✅ `POST /api/v1/audience/unsubscribe` - Unsubscribe from authenticated account

#### Frontend Integration Required

**Files to Create:**
- `app/pages/audience/confirm.vue` - Email confirmation success/error page
- `app/pages/audience/unsubscribe.vue` - Unsubscribe success/error page

**Files to Update:**
- `app/stores/audience.store.ts` - Add `unsubscribeFromAccount()` action for authenticated users
- `app/pages/profile/settings.vue` - Add newsletter unsubscribe option

#### Implementation Notes
- Backend GET endpoints redirect to frontend after processing
- Frontend pages should display success/error messages based on redirect status
- Signed URLs are sent in confirmation emails
- POST unsubscribe is for authenticated users only

---

## 9. Site Configuration Domain

### 9.1 Site Contacts & Information

**Backend API:** ✅ **AVAILABLE** (1 endpoint)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟡 **Medium**

#### Available Backend Endpoints
- ✅ `GET /api/v1/site/contacts` - Get site contacts (address, phones, email, messengers, socials)

#### Response Structure
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

#### Frontend Integration Required

**Files to Create:**
- `app/components/layout/Contacts.vue` - Contacts display component
- `app/types/system.ts` - Add SiteContacts interface

**Files to Update:**
- `app/stores/system.store.ts` - Add `fetchContacts()` action
- `app/components/layout/AppFooter.vue` - Integrate contacts display

#### Implementation Notes
- Data is automatically localized based on Accept-Language header
- Phones returned as flat array of formatted strings
- Messengers and socials include icon, title, and URL
- Schedule can contain HTML markup

---

## 10. Support & Leads Domain

### 10.1 Customer Support Request Types

**Backend API:** ✅ **AVAILABLE** (1 endpoint)  
**Frontend:** ❌ **NOT INTEGRATED**  
**Priority:** 🟢 **Low**

#### Available Backend Endpoints
- ✅ `GET /api/v1/customer-support/requests/types` - Get support request types

#### Response Structure
```json
[
  {
    "id": 1,
    "title": "General"
  },
  {
    "id": 2,
    "title": "Technical Support"
  }
]
```

#### Frontend Integration Required

**Files to Update:**
- `app/stores/support.store.ts` - Add `fetchRequestTypes()` action
- `app/pages/contact.vue` - Add request type dropdown to contact form
- `app/types/support.ts` - Add SupportRequestType interface:
  ```typescript
  interface SupportRequestType {
    id: number
    title: string
  }
  ```

#### Implementation Notes
- Simple id/title array for dropdown options
- Optional field in contact form
- Helps categorize incoming support requests

---

## 🎯 Implementation Priority Matrix

### 🔴 Critical (Blocking Core Functionality)
1. **Shipping Settlements/Warehouses Search** - Required for warehouse delivery methods to function
2. **Payments API Migration** - Update to use current unified endpoint (simple change)

### 🟠 High Priority (Improves UX)
1. **Loyalty Points System** - User engagement and rewards display
2. **Notifications Filtering & Preferences** - Better notification management UX
3. **Order Statuses Filtering** - Enhanced order browsing and management

### 🟡 Medium Priority (User Convenience)
1. **Password & Email Management** - Account security and profile management
2. **Review Replies** - Complete review interaction functionality
3. **Site Contacts** - Display contact information in footer

### 🟢 Low Priority (Nice to Have)
1. **Audience Signed URLs** - Complete email subscription flow
2. **Customer Support Request Types** - Minor contact form enhancement

---

## 📋 API Reference Quick Guide

### Authentication Endpoints
- `POST /change-password/request` → `auth.store.ts`
- `POST /change-password/confirm/{token}` → `auth.store.ts`
- `POST /change-email/request` → `auth.store.ts`
- `GET /change-email/{id}/{hash}` → `auth.store.ts`

### Loyalty Endpoints
- `GET /api/v1/loyalty` → `loyalty.store.ts`
- `GET /api/v1/loyalty/history` → `loyalty.store.ts`

### Reviews Endpoints
- `POST /api/v1/reviews/{review_id}/replies` → `reviews.store.ts`

### Notifications Endpoints
- `GET /api/v1/notifications?filter={all|unread|archived}` → `notifications.store.ts`
- `GET /api/v1/notifications/preferences` → `notifications.store.ts`
- `PUT /api/v1/notifications/preferences/{channel}/{group}` → `notifications.store.ts`

### Shipping Endpoints
- `GET /api/v1/shipping/{provider_code}/settlements/search` → `useShippingSearch.ts`
- `GET /api/v1/shipping/{provider_code}/warehouses/search` → `useShippingSearch.ts`

### Payments Endpoints
- `POST /api/v1/payments/init` → `checkout.store.ts`

### Orders Endpoints
- `GET /api/v1/orders/statuses` → `orders.store.ts`
- `GET /api/v1/orders?statuses[]={ids}` → `orders.store.ts`

### Audience Endpoints
- `GET /api/v1/audience/confirm` → `audience/confirm.vue`
- `GET /api/v1/audience/unsubscribe` → `audience/unsubscribe.vue`
- `POST /api/v1/audience/unsubscribe` → `audience.store.ts`

### Site Endpoints
- `GET /api/v1/site/contacts` → `system.store.ts`

### Support Endpoints
- `GET /api/v1/customer-support/requests/types` → `support.store.ts`

---

## 📝 Implementation Guidelines

### General Rules
1. **All endpoints use `useApi()` composable** - Follow patterns in `ai/api.md`
2. **Store patterns** - Follow `ai/stores.md` for consistency
3. **SSR/CSR separation** - Follow `ai/constitution/rendering.md`
4. **TypeScript types** - Add to appropriate files in `app/types/`
5. **Error handling** - Handle 401, 422, and other standard errors

### Common Patterns

#### Store Action Pattern
```typescript
async fetchData() {
  this.loading = true
  this.error = null
  try {
    const api = useApi()
    const response = await api('/api/v1/endpoint')
    this.data = response.data
  } catch (err) {
    this.error = err
    throw err
  } finally {
    this.loading = false
  }
}
```

#### Component Integration Pattern
```vue
<script setup lang="ts">
const store = useStoreHere()

onMounted(async () => {
  await store.fetchData()
})
</script>
```

### Authentication Considerations
- Endpoints with 🔒 icon require authentication
- Use `Authorization: Bearer <token>` header (handled automatically by `useApi()`)
- Guest endpoints use `X-Guest-Id` header (handled automatically)

---

## 🔄 Next Steps

### Immediate Actions (Critical Priority)
1. ✅ Update checkout store to use unified payments endpoint (`/payments/init`)
2. ✅ Implement shipping search composable and components for warehouse methods

### Short Term (High Priority)
1. ✅ Create loyalty store and integrate balance/history display
2. ✅ Add notification filtering and preferences UI
3. ✅ Implement order status filtering

### Medium Term
1. ✅ Add password and email change functionality to profile
2. ✅ Implement review replies feature
3. ✅ Display site contacts in footer

### Long Term (Low Priority)
1. ✅ Create audience confirmation/unsubscribe pages
2. ✅ Add support request types to contact form

---

## ✅ Completion Checklist

When implementing each feature, ensure:
- [ ] Backend endpoint is correctly called using `useApi()`
- [ ] Store actions follow patterns from `stores.md`
- [ ] TypeScript types are defined in `app/types/`
- [ ] Error handling is implemented (401, 422, etc.)
- [ ] Loading states are managed properly
- [ ] SSR/CSR rules are followed
- [ ] Components are integrated into appropriate pages
- [ ] UI follows existing design patterns
- [ ] Feature is tested with actual backend

---

## 📚 Related Documentation

- **API Endpoints**: See `ai/api.md` for API integration patterns
- **Store Patterns**: See `ai/stores.md` for state management
- **Architecture**: See `ai/architecture.md` for component structure
- **Rendering Rules**: See `ai/constitution/rendering.md` for SSR/CSR
- **API Rules**: See `ai/constitution/api-rules.md` for API contracts

---

**Last Review:** 2026-01-19  
**Status:** All backend endpoints available • Frontend integration in progress
