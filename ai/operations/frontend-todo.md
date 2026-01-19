# Frontend Implementation Checklist

Quick reference guide for frontend integration work. For detailed documentation, see [not-implemented.md](./not-implemented.md).

**Last Updated:** 2026-01-19

---

## 🔴 Critical (Do Immediately)

### [ ] 1. Payments API Migration - 15 min ⚡
**Update**: `app/stores/checkout.store.ts` (line ~476)  
**Change**: `/payments/${providerCode}/init` → `/payments/init` + move `provider_code` to body  
**API**: `POST /api/v1/payments/init` with `{ order_id, provider_code }`  
**Effort**: Small (single function update)

### [ ] 2. Shipping Warehouse Search - 4 hours
**Create**: 
- `app/composables/useShippingSearch.ts`
- `app/components/checkout/SettlementSearch.vue`
- `app/components/checkout/WarehouseSelector.vue`

**Update**:
- `app/pages/checkout.vue`
- `app/stores/checkout.store.ts` (add warehouse_external_id support)
- `app/types/checkout.ts` (add Settlement, Warehouse types)

**API**: 
- `GET /api/v1/shipping/{provider_code}/settlements/search?city_name=...`
- `GET /api/v1/shipping/{provider_code}/warehouses/search?method_code=...&city_external_id=...&checkout_session_id=...`

**Effort**: Medium (new composable + 2 components + integration)

---

## 🟠 High Priority

### [ ] 3. Loyalty Points System - 6 hours
**Create**:
- `app/stores/loyalty.store.ts` (fetchLoyaltyAccount, fetchLoyaltyHistory)
- `app/types/loyalty.ts` (LoyaltyAccount, LoyaltyTransaction)
- `app/pages/profile/loyalty.vue`
- `app/components/profile/LoyaltyBalance.vue`
- `app/components/profile/LoyaltyHistory.vue`

**Update**:
- `app/pages/profile/index.vue` (add balance widget)
- `app/pages/profile/orders/[id].vue` (show points earned/spent)

**API**:
- `GET /api/v1/loyalty`
- `GET /api/v1/loyalty/history?page=1&per_page=15`

**Effort**: Large (new store + 3 components + integration)

### [ ] 4. Notifications Filtering - 3 hours
**Create**:
- `app/pages/profile/notifications-preferences.vue`
- `app/components/profile/NotificationPreferencesMatrix.vue`

**Update**:
- `app/stores/notifications.store.ts` (add filter param, fetchPreferences, togglePreference)
- `app/pages/profile/notifications.vue` (add filter tabs)
- `app/types/notifications.ts` (add NotificationChannel, NotificationGroup)

**API**:
- `GET /api/v1/notifications?filter=all|unread|archived`
- `GET /api/v1/notifications/preferences`
- `PUT /api/v1/notifications/preferences/{channel}/{group}`

**Effort**: Medium (update store + 2 components)

### [ ] 5. Order Status Filtering - 2 hours
**Update**:
- `app/stores/orders.store.ts` (add fetchOrderStatuses, update fetchOrders with statuses param)
- `app/pages/profile/orders.vue` (add filter UI)
- `app/types/orders.ts` (add OrderStatus type)

**API**:
- `GET /api/v1/orders/statuses`
- `GET /api/v1/orders?statuses[]=1&statuses[]=2`

**Effort**: Small (store update + simple UI)

---

## 🟡 Medium Priority

### [ ] 6. Password & Email Change - 4 hours
**Create**:
- `app/pages/auth/change-password-confirm.vue`
- `app/pages/auth/change-email-confirm.vue`

**Update**:
- `app/stores/auth.store.ts` (add 4 new actions)
- `app/pages/profile/settings.vue` (add change UI)
- `app/types/auth.ts` (add request/response types)

**API**:
- `POST /change-password/request`
- `POST /change-password/confirm/{token}`
- `POST /change-email/request`
- `GET /change-email/{id}/{hash}`

**Effort**: Medium (2 pages + store updates)

### [ ] 7. Review Replies - 2 hours
**Create**:
- `app/components/product/ReviewReplyForm.vue`

**Update**:
- `app/stores/reviews.store.ts` (add createReply action)
- `app/components/product/ReviewItem.vue` (add reply button/form)

**API**:
- `POST /api/v1/reviews/{review_id}/replies`

**Effort**: Small (1 component + store action)

### [ ] 8. Site Contacts Display - 2 hours
**Create**:
- `app/components/layout/Contacts.vue`

**Update**:
- `app/stores/system.store.ts` (add fetchContacts action)
- `app/components/layout/AppFooter.vue` (integrate contacts)
- `app/types/system.ts` (add SiteContacts type)

**API**:
- `GET /api/v1/site/contacts`

**Effort**: Small (1 component + store action)

---

## 🟢 Low Priority

### [ ] 9. Audience Email Pages - 2 hours
**Create**:
- `app/pages/audience/confirm.vue`
- `app/pages/audience/unsubscribe.vue`

**Update**:
- `app/stores/audience.store.ts` (add unsubscribeFromAccount)
- `app/pages/profile/settings.vue` (add unsubscribe option)

**API**:
- `GET /api/v1/audience/confirm?email=...`
- `GET /api/v1/audience/unsubscribe?email=...`
- `POST /api/v1/audience/unsubscribe`

**Effort**: Small (2 simple pages + store action)

### [ ] 10. Support Request Types - 1 hour
**Update**:
- `app/stores/support.store.ts` (add fetchRequestTypes)
- `app/pages/contact.vue` (add type dropdown)
- `app/types/support.ts` (add SupportRequestType)

**API**:
- `GET /api/v1/customer-support/requests/types`

**Effort**: Small (dropdown + store action)

---

## 📊 Quick Stats

- **Total Tasks**: 10
- **Estimated Total Time**: ~26 hours
- **Files to Create**: 15 new files
- **Files to Update**: 12 existing files
- **Backend Endpoints**: 17+ (all available)

---

## ⚡ Quick Wins (Under 1 hour each)

1. ✅ Payments API migration (15 min)
2. ✅ Support request types (1 hour)

---

## 🎯 Recommended Implementation Order

**Week 1**: Critical + Quick Wins
1. Payments API migration (15 min)
2. Shipping warehouse search (4 hours)

**Week 2**: High Priority
3. Order status filtering (2 hours)
4. Notifications filtering (3 hours)
5. Loyalty points system (6 hours)

**Week 3**: Medium Priority
6. Review replies (2 hours)
7. Site contacts (2 hours)
8. Password/email change (4 hours)

**Week 4**: Low Priority
9. Support request types (1 hour)
10. Audience pages (2 hours)

---

## 📝 Notes

- All backend APIs are **fully implemented and tested**
- Use `useApi()` composable for all API calls
- Follow patterns in `ai/stores.md` and `ai/architecture.md`
- Handle errors: 401 (auto-logout), 422 (validation)
- Add TypeScript types to appropriate `app/types/*.ts` files

For detailed implementation guidance, see [not-implemented.md](./not-implemented.md).
