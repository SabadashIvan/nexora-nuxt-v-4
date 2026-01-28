# Checkout & Payments API

Complete endpoints for checkout flow and payment processing.

---

## Checkout API

The full checkout flow consists of:

1. `/checkout/start`
2. `/checkout/{id}/address`
3. `/shipping/methods`
4. `/checkout/{id}/shipping-method`
5. `/checkout/{id}/payment-provider`
6. `/checkout/{id}/loyalty` (optional - apply/remove loyalty points)
7. `/checkout/{id}/confirm`

### Important Note

Checkout API is responsible ONLY for:
- Order preparation
- Address management
- Shipping method selection
- Payment provider selection
- Order confirmation

**Checkout does NOT initialize payments.**

Payment initialization happens exclusively via:
**POST** `/api/v1/payments/init`

---

### 1. Start Checkout Session
`POST /api/v1/checkout/start`

Initiates a new checkout session from a shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Body:**
```json
{
  "billing_same_as_shipping": true  // Optional: Whether billing address is same as shipping
}
```

**Response:**
```json
{
  "data": {
    "id": 1315,
    "expires_at": "2025-10-31T11:11:31+00:00",
    "currency": "USD",
    "locale": "ru",
    "pricing": {
      "currency": "USD",
      "items_minor": 78390,
      "discounts_minor": 4674,
      "shipping_minor": 0,
      "grand_total_minor": 73716,
      "promotions": []
    },
    "items": [],
    "shipping": null,
    "shipping_address": {},
    "billing_address": {},
    "billing_same_as_shipping": true
  }
}
```

**Returns:**
- checkout id
- items
- pricing
- addresses

---

### 2. Update Address
`PUT /api/v1/checkout/{id}/address`

Updates shipping and billing addresses for the checkout session.

**Body:**
```json
{
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "country": "US",
    "postal_code": "10001"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "country": "US",
    "postal_code": "10001"
  },
  "billing_same_as_shipping": true
}
```

**Response:**
Updated checkout session

---

### 3. Get Shipping Methods
`GET /api/v1/shipping/methods`

Retrieves available shipping methods and rates for a given destination and checkout session.

**Query parameters:**
- `checkout_session_id` (required): Checkout session ID (numeric string)
- `dest.country` (required): Destination country code
- `dest.city` (required): Destination city
- `dest.region` (optional): Destination region/state
- `dest.postal` (optional): Destination postal code

**Response:**
```json
{
  "data": {
    "currency": "EUR",
    "methods": [
      {
        "code": "np_warehouse",
        "name": "Nova Post Warehouse",
        "source": "internal",
        "price": "$80.00",
        "eta": null,
        "quote_id": "q_01k8awpra03ck0bq331y0j3fd5"
      }
    ],
    "cache_ttl_seconds": 900
  }
}
```

**Notes:**
- Quotes are cached for 15 minutes (900 seconds)
- Use `quote_id` when setting shipping method in checkout

---

### 4. Set Shipping Method
`PUT /api/v1/checkout/{id}/shipping-method`

Sets the shipping method for the checkout session.

**Path parameters:**
- `id` (integer): Checkout session ID

**Body:**
```json
{
  "method_code": "standard_shipping",              // Required: Shipping method code
  "quote_id": "q_01k8awpra03ck0bq331y0j3fd5",     // Required: Shipping quote ID
  "provider_metadata": {
    "warehouse_external_id": "1ec09d88-e1c2-11ec-8f4a-48df37b921db"  // Optional: Warehouse ID for pickup methods
  }
}
```

**Response:**
Updated checkout session with shipping applied

---

### 5. Set Payment Provider
`PUT /api/v1/checkout/{id}/payment-provider`

Selects the payment provider for the checkout session.

**Body:**
```json
{
  "provider_code": "stripe"
}
```

**Response:**
Updated checkout session

---

### 6. Apply Loyalty Points
`POST /api/v1/checkout/{id}/loyalty`

Applies loyalty points to the checkout session to reduce the total amount.

**Authentication:** Required (user must be authenticated)

**Path parameters:**
- `id` (integer): Checkout session ID

**Body:**
```json
{
  "points_minor": 100  // Required: Points to apply in minor units (e.g., 100 = 1.00 points)
}
```

**Response:**
Updated checkout session with loyalty points applied. The pricing will reflect the discount from loyalty points.

**Error responses:**
- `400`: Invalid points amount (exceeds available points or checkout total)
- `401`: Unauthorized (user not authenticated)
- `404`: Checkout session not found

**Notes:**
- Points are applied in minor units (e.g., 100 = 1.00 points)
- Cannot exceed available loyalty points balance
- Cannot exceed checkout total amount
- Applied points are reflected in the checkout pricing response

---

### 7. Remove Loyalty Points
`DELETE /api/v1/checkout/{id}/loyalty`

Removes previously applied loyalty points from the checkout session.

**Authentication:** Required (user must be authenticated)

**Path parameters:**
- `id` (integer): Checkout session ID

**Response:**
Updated checkout session with loyalty points removed. The pricing will no longer include the loyalty points discount.

**Error responses:**
- `401`: Unauthorized (user not authenticated)
- `404`: Checkout session not found

**Notes:**
- Removes all loyalty points that were previously applied
- Checkout pricing will be recalculated without loyalty discount

---

### 8. Confirm Checkout (Create Order)
`POST /api/v1/checkout/{id}/confirm`

Finalizes the checkout and creates the order.

**Response:**
```json
{
  "order_id": 9831
}
```

**After order creation:**
- For online payments: Initialize payment via `/api/v1/payments/init`
- For offline payments: Redirect to order confirmation page

---

## Payments API

Handles listing payment providers and initiating payments.

### 1. Get Payment Providers
`GET /api/v1/payments/providers`

Returns list of available payment providers.

**Response:**
```json
[
  {
    "code": "stripe",
    "name": "Stripe",
    "fee": 0
  },
  {
    "code": "cod",
    "name": "Cash on Delivery",
    "type": "offline"
  }
]
```

---

### 2. Initialize Payment (NEW - Unified Endpoint)
`POST /api/v1/payments/init`

Initiates a payment for an order with the specified or default payment provider.

**Headers:**
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
```json
{
  "order_id": 123,           // Required: Order ID
  "provider_code": "liqpay"  // Optional: Payment provider code (uses default if not specified)
}
```

**Response:**
```json
{
  "data": {
    "payment_intent_id": 1,
    "status": 1,
    "payment_url": "https://www.liqpay.ua/api/3/checkout?data=..."
  }
}
```

**Response fields:**
- `data.payment_intent_id` (number): Payment intent identifier
- `data.status` (number): Payment status (1 = pending)
- `data.payment_url` (string): Redirect URL to payment provider

**Error responses:**
- `404`: Order not found
- `500`: Internal server error

**Note:** Use this endpoint instead of the deprecated `/api/v1/payments/{provider}/init` path.

---

### 3. Payment Webhook
`POST /api/v1/payments/webhook/{provider_code}`

Receives webhook notifications from payment providers about payment status updates.

**Path parameters:**
- `provider_code` (string): Payment provider code

**Response:**
- Status: 204 No Content

---

## Deprecated Endpoints

### ⚠️ Initialize Payment (OLD)
`POST /api/v1/payments/{provider}/init`

**DEPRECATED:** Use `/api/v1/payments/init` instead with `provider_code` in request body.

---

## SSR/CSR Behavior

**CSR-Only:**
- All checkout endpoints are CSR-only
- Never fetch in SSR
- Requires `X-Cart-Token`

**Authentication:**
- Optional: Works for both guests (with cart token) and authenticated users
- For authenticated users, uses cookie-based session

---

## Checkout Flow Summary

1. **Start Checkout** → Get checkout session ID
2. **Update Address** → Provide shipping/billing addresses
3. **Get Shipping Methods** → Fetch available shipping options (with checkout_session_id)
4. **Set Shipping Method** → Select shipping method (with quote_id)
5. **Set Payment Provider** → Choose payment method
6. **Apply/Remove Loyalty Points** → (Optional, authenticated users only) Apply or remove loyalty points discount
7. **Confirm Checkout** → Create order, get order_id
8. **Initialize Payment** → (If online payment) Get payment_url and redirect user
9. **Payment Callback** → User returns from payment gateway
10. **Order Confirmation** → Show order details

---

## Important Rules

1. **Cart Changes Invalidate Checkout**: Any cart modification (items, qty, coupons) invalidates active checkout session. Frontend MUST restart checkout.

2. **Versioning**: Cart operations require version headers (`If-Match`, `Idempotency-Key`)

3. **Checkout Session Expiry**: Checkout sessions expire after a configured time (e.g., 30 minutes)

4. **Payment Initialization**: ONLY happens after order creation via dedicated payment endpoint

5. **Warehouse Support**: For pickup methods, include `warehouse_external_id` in `provider_metadata`

6. **Shipping Quotes**: Always use `quote_id` from shipping methods response when setting shipping method
