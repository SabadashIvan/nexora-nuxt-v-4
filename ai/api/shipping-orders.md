# Shipping & Orders API

Complete endpoints for shipping methods, settlement/warehouse search, and order management.

---

## Shipping API

### 1. Get Shipping Providers (Optional)
`GET /api/v1/shipping/providers`

Returns list of available shipping providers.

---

### 2. Get Shipping Methods
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
- Used mainly by checkout

---

### 3. Search Settlements
`GET /api/v1/shipping/{provider_code}/settlements/search`

Search for cities and settlements in shipping provider database.

**Path parameters:**
- `provider_code` (string): Shipping provider code (e.g., "novapost")

**Query parameters:**
- `city_name` (required): City name or postal index to search
- `limit` (optional): Number of records per page (1-100). Default: 20
- `page` (optional): Page number (starts from 1). Default: 1

**Response:**
Array of settlement objects with city information

**Use case:** Used in checkout to help users find their city for shipping calculations.

---

### 4. Search Warehouses
`GET /api/v1/shipping/{provider_code}/warehouses/search`

Search for warehouses and postomats by city, method, and checkout session items with automatic filtering by cargo dimensions and weight.

**Path parameters:**
- `provider_code` (string): Shipping provider code

**Query parameters:**
- `method_code` (required): Shipping method code (e.g., "np_warehouse")
- `city_external_id` (required): City external ID from settlements search
- `checkout_session_id` (required): Checkout session ID (numeric string)
- `search` (optional): Search query for warehouse name or number
- `limit` (optional): Number of records per page (1-500). Default: 50
- `page` (optional): Page number. Default: 1

**Response:**
Array of warehouse/postomat objects

**Use case:** Used in checkout after user selects city to show available pickup points.

---

### 5. Shipping Webhook
`POST /api/v1/shipping/webhook/{provider_code}`

Receives webhook notifications from shipping providers about tracking updates.

**Path parameters:**
- `provider_code` (string): Shipping provider code

**Response:**
- Status: 204 No Content

---

## Orders API

### 1. Get Order Statuses
`GET /api/v1/orders/statuses`

Returns a list of all available order statuses with their IDs and titles.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Pending"
  },
  {
    "id": 2,
    "title": "Paid"
  },
  {
    "id": 3,
    "title": "Shipped"
  }
]
```

---

### 2. Get User Orders
`GET /api/v1/orders`

Retrieves a paginated list of orders for the authenticated user with optional status filtering.

**Authentication:** Required (cookie-based)

**Query parameters:**
- `statuses[]` (optional): Filter by order status IDs (array of integers)
  - Example: `statuses[]=1&statuses[]=2`
- `per_page` (optional): Number of items per page (1-100). Default: 15
- `page` (optional): Page number

**Response:**
```json
{
  "data": [
    {
      "id": 1001,
      "number": "ORD-2024-001001",
      "status": "shipped",
      "currency": "USD",
      "grand_total_minor": "$125.99",
      "created_at": "2024-01-15T10:30:00+00:00"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 3,
      "per_page": 15,
      "total": 42
    }
  }
}
```

---

### 3. Get Order Details
`GET /api/v1/orders/{id}`

Retrieves detailed information about a specific order for the authenticated user.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `id` (integer): Order ID

**Response includes:**
- Order basic info (id, number, status, currency, totals)
- Items (variant_id, sku, qty, prices, options, loyalty discounts)
- Totals breakdown (items, discounts, loyalty points, shipping, grand total)
- Promotions applied
- Shipping information (method, provider, amount, shipments with tracking)
- Shipping and billing addresses
- Payment intent status

**Error responses:**
- `401`: Unauthenticated
- `404`: Order not found

---

## SSR/CSR Behavior

**CSR-Only:**
- Orders API is CSR-only (requires authentication)
- Never fetch orders in SSR
- Use `onMounted` or client-side composables

**Shipping Methods:**
- Can be fetched in checkout context (CSR)
- Requires checkout session ID

**Authentication:**
- Orders: Cookie-based authentication (required)
- Shipping: No authentication required for methods
- Settlements/Warehouses: No authentication required

---

## Warehouse Selection Flow

For shipping methods that require warehouse/pickup point selection:

1. **Get Shipping Methods** → Identify methods that require warehouse selection
2. **Search Settlements** → User searches for their city
   - `GET /api/v1/shipping/{provider_code}/settlements/search?city_name=Kyiv`
3. **User Selects City** → Get `city_external_id` from selected settlement
4. **Search Warehouses** → Show available pickup points for selected city
   - `GET /api/v1/shipping/{provider_code}/warehouses/search?method_code=np_warehouse&city_external_id=...&checkout_session_id=...`
5. **User Selects Warehouse** → Get `warehouse_external_id`
6. **Set Shipping Method** → Include warehouse ID in provider_metadata
   - `PUT /api/v1/checkout/{id}/shipping-method` with `provider_metadata.warehouse_external_id`

---

## Order Status Filtering

Frontend can implement order filtering by status:

1. **Fetch Statuses** → `GET /api/v1/orders/statuses`
2. **Display Filter UI** → Show checkboxes/buttons for each status
3. **Fetch Filtered Orders** → `GET /api/v1/orders?statuses[]=1&statuses[]=2`

Multiple statuses can be selected simultaneously.

---

## Important Notes

1. **Shipping Quotes**: Always cache-aware (15 min TTL)
2. **Quote IDs**: Must use `quote_id` from shipping methods response
3. **Warehouse Metadata**: Required for pickup/warehouse shipping methods
4. **Order Pagination**: Default 15 items per page, max 100
5. **Status Filtering**: Supports multiple status IDs in query
6. **Tracking**: Available in shipment details within order response
