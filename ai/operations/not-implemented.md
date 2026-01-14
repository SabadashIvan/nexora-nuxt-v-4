# Not Implemented Features

This document lists all features and endpoints that are **NOT DONE** and need to be implemented.

**Last Updated:** 2025-01-27

---

## 1. Authentication & Identity Domain

### 1.1 Password & Email Management
**Status:** ❌ **NOT DONE**

**What's Missing:**
- Password change request/confirmation in auth store
- Email change request/confirmation in auth store
- Password change UI in profile
- Email change UI in profile

**Endpoints to Implement:**
- `POST /change-password/request` - Request password change
- `POST /change-password/confirm/{token}` - Confirm password change with token
- `POST /change-email/request` - Request email change
- `POST /change-email/confirm/{token}` - Confirm email change with token

**Files to Create/Update:**
- `app/stores/auth.store.ts` - Add password/email change actions
- `app/pages/profile/settings.vue` - Add password/email change UI
- `app/pages/auth/change-password.vue` - Password change confirmation page (optional)
- `app/pages/auth/change-email.vue` - Email change confirmation page (optional)

---

## 2. User Account & Profile Domain

### 2.1 Loyalty Points System
**Status:** ❌ **NOT DONE**

**What's Missing:**
- Loyalty store (`loyalty.store.ts`)
- Loyalty types (`app/types/loyalty.ts`)
- Loyalty account page/component
- Loyalty history page/component
- Loyalty balance display in profile
- Loyalty points in order summary

**Endpoints to Implement:**
- `GET /api/v1/loyalty` - Get loyalty account details (balance, pending)
- `GET /api/v1/loyalty/history` - Get loyalty transaction history (paginated)

**Files to Create:**
- `app/stores/loyalty.store.ts` - Loyalty store with fetchLoyaltyAccount() and fetchLoyaltyHistory()
- `app/types/loyalty.ts` - Loyalty types (LoyaltyAccount, LoyaltyTransaction, etc.)
- `app/pages/profile/loyalty.vue` - Loyalty account page
- `app/components/profile/LoyaltyBalance.vue` - Balance display component
- `app/components/profile/LoyaltyHistory.vue` - Transaction history component

**Files to Update:**
- `app/pages/profile/index.vue` - Add loyalty balance display
- `app/pages/profile/order/[id].vue` - Add loyalty points in order summary
- `app/components/checkout/OrderSummary.vue` - Add loyalty points display (if applicable)

---

## 3. Content Domain (Reviews)

### 3.1 Review Replies
**Status:** ❌ **NOT DONE**

**What's Missing:**
- `createReply()` action in reviews store
- Reply functionality in review items
- Reply form component for reviews

**Endpoints to Implement:**
- `POST /api/v1/reviews/{review_id}/replies` - Create reply to a review

**Files to Update:**
- `app/stores/reviews.store.ts` - Add `createReply(reviewId, payload)` action
- `app/components/product/ReviewItem.vue` - Add reply form/button
- `app/components/product/ReviewForm.vue` - Create reply form variant (or new component)

**Files to Create (optional):**
- `app/components/product/ReviewReplyForm.vue` - Dedicated reply form component

---

## 4. Notifications Domain

### 4.1 Notifications Filtering
**Status:** ❌ **NOT DONE** (Partial - missing filter parameter)

**What's Missing:**
- `filter` parameter support in `fetchNotifications()` (all/unread/archived)
- `fetchPreferences()` action to get preferences matrix
- Filter tabs/buttons in notifications UI
- Preferences matrix display page

**Endpoints to Implement:**
- `GET /api/v1/notifications/preferences` - Get notification preferences matrix

**Files to Update:**
- `app/stores/notifications.store.ts` - Add `filter` parameter to `fetchNotifications()`, add `fetchPreferences()` action
- `app/pages/profile/notifications.vue` - Add filter tabs (all/unread/archived)
- `app/pages/profile/notifications-preferences.vue` - Create preferences matrix page (or add to existing page)

---

## 5. Shipping & Delivery Domain

### 5.1 Shipping Settlements & Warehouses Search
**Status:** ❌ **NOT DONE**

**What's Missing:**
- Shipping search composable (`useShippingSearch.ts`)
- City search component
- Warehouse/pickup point selection component
- Integration into checkout flow

**Endpoints to Implement:**
- `GET /api/v1/shipping/{provider_code}/settlements/search` - Search cities/settlements
- `GET /api/v1/shipping/{provider_code}/warehouses/search` - Search warehouses/pickup points

**Files to Create:**
- `app/composables/useShippingSearch.ts` - Composable for settlements/warehouses search
- `app/components/checkout/SettlementSearch.vue` - City search component
- `app/components/checkout/WarehouseSelector.vue` - Warehouse/pickup point selection component

**Files to Update:**
- `app/pages/checkout.vue` - Integrate warehouse selection for warehouse shipping methods
- `app/stores/checkout.store.ts` - Update `applyShippingMethod()` to support `provider_metadata.warehouse_external_id`
- `app/stores/checkout.store.ts` - Update `fetchShippingMethods()` to use `checkout_session_id` parameter

---

## 6. Payments Domain

### 6.1 Payments API Migration
**Status:** ❌ **NOT DONE** (Uses deprecated endpoint)

**What's Missing:**
- Migration from `/api/v1/payments/{provider}/init` to `/api/v1/payments/init`

**Endpoints to Update:**
- `POST /api/v1/payments/init` - Use unified endpoint instead of provider-specific

**Files to Update:**
- `app/stores/checkout.store.ts` - Line 476: Change from `/payments/${this.selectedPayment.code}/init` to `/payments/init`
- Update `PaymentInitPayload` to include `provider_code` in body instead of URL path

---

## 7. Orders Domain

### 7.1 Order Statuses
**Status:** ❌ **NOT DONE**

**What's Missing:**
- `fetchOrderStatuses()` action in orders store
- Order status filtering in orders list
- Order status filter UI component

**Endpoints to Implement:**
- `GET /api/v1/orders/statuses` - Get list of order statuses

**Files to Update:**
- `app/stores/orders.store.ts` - Add `fetchOrderStatuses()` action, add `statuses` filter parameter to `fetchOrders()`
- `app/pages/profile/orders.vue` - Add status filter dropdown/buttons
- `app/types/orders.ts` - Add OrderStatus type if needed

---

## 8. Marketing & Audience Domain

### 8.1 Audience Signed URLs
**Status:** ❌ **NOT DONE** (Partial - missing GET endpoints)

**What's Missing:**
- Signed URL confirm/unsubscribe handling (GET endpoints)
- `unsubscribeFromAccount()` action for authenticated users (POST endpoint)
- Email confirmation page (for GET /audience/confirm)
- Unsubscribe page (for GET /audience/unsubscribe)
- Unsubscribe option in profile

**Endpoints to Implement:**
- `GET /api/v1/audience/confirm?email={email}&token={token}` - Confirm subscription via signed URL
- `GET /api/v1/audience/unsubscribe?email={email}&token={token}` - Unsubscribe via signed URL
- `POST /api/v1/audience/unsubscribe` - Unsubscribe from authenticated account

**Files to Create:**
- `app/pages/audience/confirm.vue` - Email confirmation page (handles GET /audience/confirm redirect)
- `app/pages/audience/unsubscribe.vue` - Unsubscribe page (handles GET /audience/unsubscribe redirect)

**Files to Update:**
- `app/stores/audience.store.ts` - Add `unsubscribeFromAccount()` action (POST), update confirm/unsubscribe to handle GET signed URLs
- `app/pages/profile/settings.vue` - Add unsubscribe option for newsletter

---

## 9. Site Configuration Domain

### 9.1 Site Contacts
**Status:** ❌ **NOT DONE**

**What's Missing:**
- `fetchContacts()` action
- Contacts display component
- Contacts in footer

**Endpoints to Implement:**
- `GET /api/v1/site/contacts` - Get site contacts (phone, email, messengers, socials)

**Files to Create:**
- `app/components/layout/Contacts.vue` - Contacts display component

**Files to Update:**
- `app/stores/system.store.ts` or create `app/stores/site.store.ts` - Add `fetchContacts()` action
- `app/components/layout/AppFooter.vue` - Add contacts display

---

## 10. Support & Leads Domain

### 10.1 Customer Support Request Types
**Status:** ❌ **NOT DONE**

**What's Missing:**
- `fetchRequestTypes()` action in support store
- Request type dropdown in contact form

**Endpoints to Implement:**
- `GET /api/v1/customer-support/requests/types` - Get support request types

**Files to Update:**
- `app/stores/support.store.ts` - Add `fetchRequestTypes()` action
- `app/pages/contact.vue` - Add request type dropdown to contact form
- `app/types/support.ts` - Add SupportRequestType type if needed

---

## Summary

### Total Not Implemented Features: 10

1. Password & Email Management (4 endpoints)
2. Loyalty Points System (2 endpoints)
3. Review Replies (1 endpoint)
4. Notifications Filtering (1 endpoint)
5. Shipping Settlements/Warehouses Search (2 endpoints)
6. Payments API Migration (1 endpoint update)
7. Order Statuses (1 endpoint)
8. Audience Signed URLs (3 endpoints)
9. Site Contacts (1 endpoint)
10. Customer Support Request Types (1 endpoint)

### Total Endpoints to Implement: ~17 endpoints

---

## Implementation Priority

### Critical (Blocking Features)
1. **Shipping Settlements/Warehouses Search** - Required for warehouse shipping methods
2. **Review Replies** - Complete reviews functionality

### High Priority
1. **Notifications Filtering** - Better UX for notifications
2. **Orders Status Filtering** - Better order management
3. **Payments API Migration** - Use current API endpoint

### Medium Priority
1. **Loyalty Points System** - User engagement feature
2. **Audience Signed URLs** - Complete email flow
3. **Site Contacts** - Footer information
4. **Password/Email Management** - Account security

### Low Priority
1. **Customer Support Request Types** - Minor enhancement

---

## Notes

- Some features may have partial implementation (e.g., notifications filtering works client-side but not via API)
- Endpoint counts are approximate and may include both new endpoints and updates to existing ones
- All endpoints should follow the patterns established in `ai/api.md`
- All stores should follow patterns from `ai/stores.md`
- All components should follow patterns from `ai/architecture.md`
