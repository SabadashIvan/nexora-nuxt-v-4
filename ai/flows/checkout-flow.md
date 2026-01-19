checkout-flow.md — FULL DETAILED VERSION
Complete Checkout Flow Specification for Nuxt 4 E-commerce Frontend

This document defines the complete, production-grade checkout flow, matching backend API and frontend architecture.

It is essential for:

Frontend engineers

QA testers

AI agents (Claude Opus 4.5)

Documentation reviewers

UX designers

Checkout is completely client-side (CSR) and depends heavily on:

X-Cart-Token

authenticated user (optional, via HTTP-only session cookies)

consistent pricing logic

sequential steps

validation rules

shipping/payment provider availability

## Important: Single-Page Checkout (SPC)

Checkout uses a **Single-Page Checkout (SPC)** model:

- **ONLY route**: `/checkout`
- **NO** `/checkout/address`, `/checkout/payment`, etc.
- All steps rendered dynamically on one page
- UI blocks on `/checkout`:
  - customer data
  - shipping address
  - shipping methods
  - payment methods
  - coupons (managed by cart, not checkout)
  - order comment
  - order summary

1. High-Level Checkout Stages

The checkout flow contains five strict sequential steps:

1. Start
2. Address
3. Shipping
4. Payment
5. Confirm

All steps are rendered on a single page (`/checkout`) with dynamic UI state management.

2. Checkout API Map

Step	API Endpoint	Method	Description
Start	POST /api/v1/checkout/start	POST	Creates checkout session
Address	PUT /api/v1/checkout/{id}/address	PUT	Saves shipping & billing address
Shipping Methods	GET /api/v1/shipping/methods	GET	Returns available shipping methods
Shipping Selection	PUT /api/v1/checkout/{id}/shipping-method	PUT	Sets chosen shipping method
Payment Provider	PUT /api/v1/checkout/{id}/payment-provider	PUT	Sets payment type
Confirm	POST /api/v1/checkout/{id}/confirm	POST	Creates final order
Payment Init	POST /api/v1/payments/init	POST	Initializes payment (after confirm)

**Important Notes:**

- Checkout API is responsible ONLY for:
  - order preparation
  - address
  - shipping
  - payment provider selection
  - order confirmation

- Checkout does NOT initialize payments.

- Payment initialization happens exclusively via:
  **POST** `/api/v1/payments/init` (after order confirmation, with provider_code in body)

- Coupons belong to Cart domain, NOT checkout:
  - **POST** `/api/v1/cart/coupons`
  - **DELETE** `/api/v1/cart/coupons/{code}`
  - Checkout must NOT manage coupons.
3. Checkout Data Model
3.1 Checkout Session

Represents the entire state of the checkout.

{
  id: string,
  items: CheckoutItem[],
  addresses: {
    shipping: Address | null,
    billing: Address | null,
    billingSameAsShipping: boolean
  },
  pricing: {
    items: number,
    shipping: number,
    discounts: number,
    total: number
  },
  selectedShippingMethod: ShippingMethod | null,
  selectedPaymentProvider: PaymentProvider | null
}

3.2 Address Model
{
  first_name: string,
  last_name: string,
  phone: string,
  country: string,
  region: string,
  city: string,
  postal: string,
  address_line_1: string,
  address_line_2?: string
}

3.3 Shipping Method
{
  id: number,
  name: string,
  price: number,
  estimated_days: number
}

3.4 Payment Provider
{
  code: string,
  name: string,
  type: "online" | "offline",
  fee: number,
  instructions?: string
}

4. Detailed Flow per Step

All steps occur on a single page (`/checkout`) with dynamic UI state.

4.1 Step 1 — Start

**Page Load Tasks:**

- Ensure X-Cart-Token exists
- Load cart via cart.store
- Call: **POST** `/api/v1/checkout/start`

**Required Headers:**
```
Accept-Language: <locale>
Accept-Currency: <currency>
X-Cart-Token: <token>
```

**Response sets:**
- checkoutId
- pricing
- items
- addresses (previous saved data, if any)

**UI State:**
- Set current step to "address"
- Display address form
- Show order summary sidebar

**No redirect** — all steps on same page.

4.2 Step 2 — Address

**User provides:**
- Shipping address
- Billing address
- "Billing same as shipping" toggle

**API:**
**PUT** `/api/v1/checkout/{id}/address`

**Body:**
```json
{
  "shipping_address": {...},
  "billing_address": {...},
  "billing_same_as_shipping": true
}
```

**Validation:**
- required fields
- valid country
- valid postal code
- phone validation

**On success:**
- Update checkout state
- Set current step to "shipping"
- Display shipping method selection
- Update order summary

**No redirect** — UI updates dynamically.

4.3 Step 3 — Shipping

**Steps:**
1. Fetch shipping options:
   **GET** `/api/v1/shipping/methods`
   
   Query params:
   - `checkout_session_id` (required): Current checkout session ID
   - `dest.country` (required): Destination country
   - `dest.city` (required): Destination city
   - `dest.region` (optional): Destination region/state
   - `dest.postal` (optional): Destination postal code

2. **For warehouse shipping methods:**
   a. Search for settlements:
      **GET** `/api/v1/shipping/{provider_code}/settlements/search?city_name={query}`
   
   b. User selects city from search results
   
   c. Search for warehouses:
      **GET** `/api/v1/shipping/{provider_code}/warehouses/search`
      Query params:
      - `method_code`: Shipping method code
      - `city_external_id`: Selected city's external ID
      - `checkout_session_id`: Current checkout session ID
      - `search` (optional): Warehouse name/number filter
   
   d. User selects warehouse/pickup point

3. Save selection:
   **PUT** `/api/v1/checkout/{id}/shipping-method`
   
   Body:
   ```json
   {
     "method_code": "standard_shipping",
     "quote_id": "q_01k8awpra03ck0bq331y0j3fd5"
   }
   ```
   
   **For warehouse methods, include warehouse metadata:**
   ```json
   {
     "method_code": "np_warehouse",
     "quote_id": "q_01k8awpra03ck0bq331y0j3fd5",
     "provider_metadata": {
       "warehouse_external_id": "1ec09d88-e1c2-11ec-8f4a-48df37b921db"
     }
   }
   ```

4. Prices update automatically

**On success:**
- Update checkout state
- Set current step to "payment"
- Display payment provider selection
- Update order summary with shipping cost

**No redirect** — UI updates dynamically.

4.4 Step 4 — Payment

**Steps:**
1. Load providers:
   **GET** `/api/v1/payments/providers`

2. User selects provider

3. Save provider:
   **PUT** `/api/v1/checkout/{id}/payment-provider`
   
   Body:
   ```json
   { "provider_code": "stripe" }
   ```

4. Provider selection appears in summary

**On success:**
- Update checkout state
- Set current step to "confirm"
- Display confirmation summary
- Enable "Place Order" button

**No redirect** — UI updates dynamically.

4.5 Step 5 — Confirm

**Tasks:**
- Show complete summary:
  - address
  - shipping
  - payment
  - items
  - totals (items + shipping + discounts)

**Confirm call:**
**POST** `/api/v1/checkout/{id}/confirm`

**Response:**
```json
{ "order_id": 8192 }
```

**After order creation:**
1. Initialize payment (if online provider):
   **POST** `/api/v1/payments/init`
   
   Body:
   ```json
   {
     "order_id": 8192,
     "provider_code": "liqpay"
   }
   ```
   
   Response:
   ```json
   {
     "data": {
       "payment_intent_id": 1,
       "status": 1,
       "payment_url": "https://provider.com/pay?session=..."
     }
   }
   ```

2. Redirect based on payment type:
   - **Online payment**: Redirect to `payment_url`
   - **Offline payment**: Redirect to `/profile/orders/{order_id}`
   
**Note:** Payment API now uses unified endpoint with `provider_code` in request body instead of URL path.

5. Edge Cases & Error Handling

Checkout must gracefully handle broken states.

5.1 Cart changed during checkout

**Rule:** Any cart change (items, quantity, options, coupons) invalidates the active checkout session.

**Backend Response:**
422 CART_CHANGED

**Frontend Fix:**
1. Reload cart via cart.store
2. Restart checkout: call **POST** `/api/v1/checkout/start` again
3. Repopulate addresses if possible
4. Reset UI to step 1 (address)
5. Show notification: "Your cart has changed. Please review your order."

**Prevention:**
- Disable cart modifications during active checkout (optional UX enhancement)
- Show warning if user tries to modify cart while checkout is active

5.2 Shipping method invalid

Occurs when:
- User takes too long
- Shipping method becomes unavailable
- Address changes invalidate shipping method

**Backend Response:**
422 INVALID_SHIPPING

**Frontend Fix:**
1. Reload shipping methods: **GET** `/api/v1/shipping/methods`
2. Force choosing again
3. Reset shipping selection in checkout state
4. Show error: "Selected shipping method is no longer available. Please choose another."

5.3 Invalid payment provider

**Backend Response:**
422 INVALID_PAYMENT

**Frontend Fix:**
1. Reload providers: **GET** `/api/v1/payments/providers`
2. Reset payment selection in checkout state
3. Show detailed error message
4. Allow user to select different provider

5.4 Checkout session expired

**Backend Response:**
404 or 422 (session not found)

**Frontend Fix:**
1. Call **POST** `/api/v1/checkout/start` again
2. Repopulate addresses if possible (from user profile or previous session)
3. Restore UI state to appropriate step
4. Show notification: "Your checkout session expired. We've restarted it for you."

5.5 Missing cart token

**Detection:**
- No X-Cart-Token header available
- Cart is empty

**Frontend Fix:**
1. Redirect to `/cart`
2. Show message: "Your cart is empty. Add items to proceed to checkout."
3. Allow user to add items and return

5.6 Currency change during checkout

**Rule:** When currency changes, checkout pricing must be recalculated.

**Frontend Fix:**
1. Detect currency change (via system.store watcher)
2. Restart checkout: call **POST** `/api/v1/checkout/start` again
3. Repopulate all selections (address, shipping, payment)
4. Update all prices in UI
5. Show notification: "Currency changed. Prices have been updated."

5.7 Authentication state change

**Scenario:** User logs in/out during checkout

**Frontend Fix:**
- **Login during checkout:**
  1. Attach cart to user: **POST** `/api/v1/cart/attach`
  2. Continue checkout with authenticated session
  3. Pre-fill address from user profile if available

- **Logout during checkout:**
  1. Continue as guest (if allowed)
  2. Or redirect to `/cart` with message: "Please log in to complete checkout."

6. How Checkout Connects to Other Systems

6.1 Cart Integration

Checkout depends on cart items:

- Item changes outside checkout break session (invalidates checkout)
- Cart coupons modify pricing (coupons belong to cart domain)
- Cart item options modify pricing (options belong to cart domain)

**Cart Domain Endpoints:**
- **POST** `/api/v1/cart/coupons` - Apply coupon
- **DELETE** `/api/v1/cart/coupons/{code}` - Remove coupon
- **PUT** `/api/v1/cart/items/{itemId}/options` - Update item options

**Important:** Checkout must NOT manage coupons. Coupons are managed by cart.store.

6.2 Payments Integration

**Checkout Responsibility:**
- Payment provider selection only
- Does NOT initialize payments

**Payment Initialization:**
After order confirmation, payment initialization happens via:
- **POST** `/api/v1/payments/init`

**Request body:**
```json
{
  "order_id": 123,
  "provider_code": "liqpay"  // Required: payment provider code
}
```

The selected provider determines:
- redirect-based flow (online payments)
- offline instructions (cash on delivery, etc.)
- status handling

**Payment Flow:**
1. User confirms checkout → order created
2. Frontend calls payment init endpoint with order_id and provider_code
3. For online payments: redirect to payment_url from response
4. For offline payments: show instructions and redirect to order page

**Migration Note:** The old endpoint format `/api/v1/payments/{provider}/init` is deprecated. Always use the unified `/api/v1/payments/init` endpoint with provider_code in the request body.

6.3 System Config Integration

**Locale and currency affect:**
- shipping costs
- item prices
- currency formatting
- address validation rules

**Required Headers (all checkout requests):**
```
Accept-Language: <locale>
Accept-Currency: <currency>
```

**Reactivity:**
- When currency changes → restart checkout (recalculate prices)
- When locale changes → update UI labels, validation messages

6.4 Authentication Integration

**Authentication Model:**
- Cookie-based (Laravel Sanctum)
- HTTP-only session cookies
- NO Bearer tokens
- CSRF protection mandatory

**Guest Checkout:**
- Allowed with X-Cart-Token
- User can proceed without authentication

**Authenticated Checkout:**
- Session cookies automatically attached by useApi()
- Can pre-fill address from user profile
- Can attach guest cart to user account

6.5 SEO

Checkout is always:
- **noindex, nofollow**

So no SSR SEO needed. Checkout is CSR-only.

7. Store Architecture

**Mandatory:** All checkout logic MUST live in `checkout.store.ts`.

**Forbidden:**
- Logic inside pages
- API calls inside components
- Duplicated flows

**Checkout Store Responsibilities:**
- Managing checkout session state
- API calls (start, address, shipping, payment, confirm)
- Step validation
- Error handling
- Price calculations
- Integration with cart.store

**Components are presentation-only:**
- Display data from checkout.store
- Emit events to checkout.store actions
- No direct API calls

8. UI Components (Full List)

**Layout Components:**
- CheckoutStepper.vue - Progress indicator (all steps on one page)

**Form Components:**
- AddressForm.vue - Shipping address input
- BillingAddressForm.vue - Billing address input (or reuse AddressForm with toggle)

**Selection Components:**
- ShippingMethodCard.vue - Shipping method selection
- PaymentProviderCard.vue - Payment provider selection
- SettlementSearch.vue - City/settlement search for warehouse methods
- WarehouseSelector.vue - Warehouse/pickup point selection

**Summary Components:**
- OrderSummary.vue - Complete order summary sidebar
- AddressPreview.vue - Address display in summary
- ShippingPreview.vue - Shipping method display in summary
- PaymentPreview.vue - Payment provider display in summary

**Action Components:**
- CheckoutButton.vue - "Place Order" button (disabled until all steps complete)

**All components:**
- Receive data from checkout.store (computed/getters)
- Call checkout.store actions (methods)
- No direct API calls

9. User Experience Requirements

**Form UX:**
- Do not overwhelm users with long forms
- Autofill billing = shipping (toggle)
- Show delivery ETA for selected shipping method
- Validate fields inline (real-time feedback)
- Show field-level error messages

**Layout UX:**
- Always show order summary sidebar (sticky on desktop)
- Show clear progress via CheckoutStepper
- Display current step prominently
- Disable future steps until previous steps complete

**Loading States:**
- Show loading states during API calls
- Disable buttons during API calls
- Show skeleton loaders for shipping methods, payment providers
- Display success/error notifications

**Accessibility:**
- Proper form labels
- ARIA attributes for step navigation
- Keyboard navigation support
- Screen reader announcements for step changes

10. API Request Requirements

**All checkout API requests MUST include:**

**Required Headers:**
```
Accept-Language: <locale>
Accept-Currency: <currency>
X-Cart-Token: <token>
```

**Authentication:**
- Session cookies automatically attached (Laravel Sanctum)
- NO Authorization: Bearer headers
- CSRF cookie retrieved before authenticated requests (handled by useApi())

**CSRF / XSRF (MANDATORY):**
- All checkout mutation requests (POST, PUT, DELETE) MUST include XSRF token
- This applies to BOTH authenticated users and guests
- XSRF token must be included for:
  - POST /api/v1/checkout/start
  - PUT /api/v1/checkout/{id}/address
  - PUT /api/v1/checkout/{id}/shipping-method
  - PUT /api/v1/checkout/{id}/payment-provider
  - POST /api/v1/checkout/{id}/confirm
  - POST /api/v1/payments/{provider}/init
- Frontend MUST call `GET /sanctum/csrf-cookie` once on app init
- useApi() composable automatically includes XSRF token in mutation requests

**Request Format:**
- All requests via `useApi()` composable
- Typed request/response interfaces
- Proper error handling (422 validation errors)

11. State Management

**Checkout State (checkout.store.ts):**

```typescript
{
  checkoutId: string | null,
  currentStep: 'address' | 'shipping' | 'payment' | 'confirm',
  items: CheckoutItem[],
  addresses: {
    shipping: Address | null,
    billing: Address | null,
    billingSameAsShipping: boolean
  },
  shippingMethods: ShippingMethod[],
  selectedShippingMethod: ShippingMethod | null,
  paymentProviders: PaymentProvider[],
  selectedPaymentProvider: PaymentProvider | null,
  pricing: {
    items: number,
    shipping: number,
    discounts: number,
    total: number
  },
  loading: boolean,
  error: string | null
}
```

**Actions:**
- `startCheckout()` - Initialize checkout session
- `updateAddress()` - Save shipping/billing address
- `loadShippingMethods()` - Fetch available shipping methods
- `selectShippingMethod()` - Set shipping method
- `loadPaymentProviders()` - Fetch available payment providers
- `selectPaymentProvider()` - Set payment provider
- `confirmOrder()` - Create order
- `restartCheckout()` - Restart after cart changes

**Getters:**
- `canProceedToShipping()` - Validate address step
- `canProceedToPayment()` - Validate shipping step
- `canProceedToConfirm()` - Validate payment step
- `canPlaceOrder()` - All steps complete

12. Implementation Checklist

**Before implementing checkout, ensure:**

- [ ] checkout.store.ts exists with all actions
- [ ] useApi() composable configured
- [ ] Cart token middleware working
- [ ] Locale/currency system.store integrated
- [ ] Error handling utils ready
- [ ] All UI components created
- [ ] Address validation rules defined
- [ ] Payment provider list endpoint accessible
- [ ] Shipping methods endpoint accessible (with checkout_session_id parameter)
- [ ] Warehouse search composable created (useShippingSearch)
- [ ] Settlement and warehouse search components created
- [ ] Warehouse metadata support in shipping method application
- [ ] Order confirmation flow tested
- [ ] Payment initialization flow tested (with unified endpoint)
- [ ] Cart invalidation handling implemented
- [ ] Currency change reactivity implemented

🟦 END OF CHECKOUT-FLOW.MD