# Cart, Favorites & Comparison API

Complete endpoints for shopping cart management, wishlist (favorites), and product comparison functionality.

---

## Cart API

The cart system is token-based (guest or user) with versioning support for concurrency control.

**Token Header:**
- `X-Cart-Token`: Required for all cart operations

### Cart Versioning & Concurrency Control

The cart API uses optimistic locking with version numbers to prevent concurrent modification conflicts:
- Every cart has a `version` number that increments on each modification
- For mutations (add, update, remove items, coupons), you **must** include:
  - `If-Match` header: Current cart version (obtained from `GET /api/v1/cart/v`)
  - `Idempotency-Key` header: Unique key for safe retries (recommended)
- If version mismatch (409 Conflict), fetch latest cart and retry

> **NOTE:**
> Coupons and item options belong to Cart domain:
> - **POST** `/api/v1/cart/coupons`
> - **DELETE** `/api/v1/cart/coupons/{code}`
> - **PATCH** `/api/v1/cart/items/{itemId}/options`
> Checkout must NOT manage coupons.

### Checkout Invalidation Rule

Any cart change (items, quantity, options, coupons) invalidates the active checkout session.

Frontend MUST restart checkout after cart changes.

---

### 1. Get Cart
`GET /api/v1/cart`

Returns the current cart by token.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Response:**
```json
{
  "data": {
    "token": "01K8WP4SYH6QRS0T82D3XAHD25",
    "version": 2,
    "context": {
      "currency": "USD",
      "locale": "ru"
    },
    "items": [
      {
        "id": "SKU-7283-UPJB",
        "variant_id": 5,
        "sku": "SKU-7283-UPJB",
        "qty": 2,
        "title": "MacBook Air 13",
        "image": {
          "id": null,
          "url": "https://example.com/images/thumb_250_250.webp"
        },
        "price": {
          "currency": "USD",
          "list_minor": 65325,
          "sale_minor": 39195,
          "effective_minor": 39195
        },
        "options": [],
        "options_total_minor": 0,
        "line_total_minor": 78390
      }
    ],
    "promotions": [
      {
        "promotion_id": 8,
        "name": "Quo mollitia aliquam",
        "type": 2,
        "value": 2185,
        "source": 2
      }
    ],
    "loyalty": {
      "potential_accrual_minor": 367270,
      "max_spendable_minor": 0
    },
    "warnings": [],
    "totals": {
      "items_minor": 78390,
      "discounts_minor": 4674,
      "grand_total_minor": 73716
    }
  }
}
```

**Cart item fields:**
- `title` (string, optional): Product title from API. Use this as the primary display name.
- `image`: Each item may include `image` with `id` (number or `null`) and `url` (string). Use `url` for display; `id` may be `null` when no media record exists.
- `price.sale_minor` (number, optional): Sale price in minor units. Only present when item is on sale.
- `options_total_minor` (number): Total price of item options in minor units.

**Cart promotions:**
- `promotion_id` (number): Unique promotion identifier
- `name` (string): Promotion name/description
- `value` (number): Promotion discount value in minor units
- `type` (number): Promotion type identifier
- `source` (number, optional): Promotion source identifier

**Cart loyalty:**
- `potential_accrual_minor` (number): Potential loyalty points that can be earned from this cart in minor units
- `max_spendable_minor` (number): Maximum loyalty points that can be spent on this cart in minor units

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Current cart version number

---

### 2. Get Cart Version
`GET /api/v1/cart/v`

Returns the current version of the cart **without full cart data**.

**Note:** Backend YAML shows GET method. Verify with backend if HEAD is also supported.

**Headers:**
- `X-Cart-Token`: Cart token (required)

**Response:**
- Status: 204 No Content
- Headers:
  - `X-Cart-Token`: Current cart token
  - `X-Cart-Version`: Current cart version number

**Use case:** Use this to check if cart has been updated since last fetch, or to get version before mutations.

---

### 3. Add Item to Cart
`POST /api/v1/cart/items`

Adds a product variant (by SKU or ID) to the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (optional - creates new cart if not provided)
- `If-Match`: Current cart version (required if `X-Cart-Token` provided)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
```json
{
  "variant_id": 42,          // Optional: variant ID
  "sku": "SKU-9660-NCQB",   // Optional: variant SKU (use one or the other)
  "qty": 2                   // Required: quantity
}
```

**Response:**
Updated cart (same structure as GET /api/v1/cart)

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Cart not found (if token provided)
- `409`: Version mismatch (cart was modified concurrently)
- `422`: Validation error

---

### 4. Update Item Quantity
`PATCH /api/v1/cart/items/{itemId}`

Updates the quantity of an existing item in the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `itemId` (string): Cart item ID (usually SKU)

**Body:**
```json
{
  "qty": 3  // Required: new quantity
}
```

**Response:**
Updated cart (same structure as GET /api/v1/cart)

**Error responses:**
- `404`: Item or cart not found
- `409`: Version mismatch
- `422`: Validation error

---

### 5. Remove Item
`DELETE /api/v1/cart/items/{itemId}`

Removes a specific item from the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `itemId` (string): Cart item ID (usually SKU)

**Response:**
Updated cart

**Error responses:**
- `404`: Item or cart not found
- `409`: Version mismatch
- `422`: Validation error

---

### 6. Update Item Options
`PATCH /api/v1/cart/items/{itemId}/options`

Sets options for a cart item (e.g., gift wrap, personalization).

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
```json
{
  "add": [
    {
      "option_id": 2,
      "qty": 1
    }
  ],
  "remove": [2, 3]
}
```

**Response:**
Updated cart with options applied

---

### 7. Apply Coupon
`POST /api/v1/cart/coupons`

Applies a discount coupon code to the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Body:**
```json
{
  "code": "SAVE10"
}
```

**Response:**
Updated cart with coupon applied

**Error responses:**
- `404`: Cart not found or coupon invalid
- `409`: Version mismatch
- `422`: Validation error (coupon expired, already applied, etc.)

---

### 8. Remove Coupon
`DELETE /api/v1/cart/coupons/{code}`

Removes a previously applied coupon code from the shopping cart.

**Headers:**
- `X-Cart-Token`: Cart token (required)
- `If-Match`: Current cart version (required)
- `Idempotency-Key`: Unique key for safe retries (recommended)

**Path parameters:**
- `code` (string): Coupon code to remove

**Response:**
The response body always returns a full snapshot of the updated cart (items, totals, currency, version, etc.).

**Response headers:**
- `X-Cart-Token`: Current cart token
- `X-Cart-Version`: Updated version number

**Error responses:**
- `404`: Cart not found or coupon not found
- `409`: Version mismatch (cart was modified concurrently)
- `422`: Validation error

---

### 9. Attach Cart After Login
`POST /api/v1/cart/attach`

Used when a guest becomes authenticated. Merges guest cart with user cart.

**Headers:**
- `X-Cart-Token`: Guest cart token (required)
- `Authorization`: Cookie-based authentication (required)

**Note:** Verify with backend if this endpoint exists. If not, cart merging may happen automatically on login.

---

## Favorites API

Favorites (wishlist) functionality uses guest token authentication.

**Token Header:**
- `X-Guest-Id`: Required for all favorites operations

**Note:** Favorites are tied to guest sessions and persist across browser sessions via the guest token stored in cookies.

---

### 1. Get Favorites
`GET /api/v1/catalog/favorites`

Returns paginated list of favorite product variants.

**Query params:**
- `page` (optional): Page number for pagination
- `per_page` (optional): Items per page

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "product_id": 45,
      "title": "Product Title",
      "slug": "product-slug",
      "sku": "SKU123",
      "is_favorite": true,
      "price": {
        "value": 10000,
        "currency": "USD",
        "formatted": "$100.00"
      },
      "is_in_stock": true,
      "images": [],
      "attribute_values": [],
      "rating": {
        "value": 4.5,
        "count": 10
      }
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 20,
      "total": 5
    }
  }
}
```

---

### 2. Add Favorite
`POST /api/v1/catalog/favorites`

Adds a product variant to favorites.

**Body:**
```json
{
  "variant_id": 123
}
```

**Response:**
Updated favorites list

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error (e.g., variant not found, already in favorites)
- `429`: Too many requests

---

### 3. Remove Favorite
`DELETE /api/v1/catalog/favorites/{variantId}`

Removes a product variant from favorites.

**Path parameters:**
- `variantId` (number): Product variant ID to remove

**Response:**
Updated favorites list

**Error responses:**
- `401`: Unauthorized
- `404`: Favorite not found
- `422`: Validation error

---

## Comparison API

Comparison table allows users to compare multiple product variants side-by-side.

**Token Header:**
- `X-Comparison-Token`: Required for all comparison operations

**Note:** Comparison uses a dedicated token separate from cart and guest tokens. The token is stored in cookies and persists across browser sessions.

**Limits:**
- Maximum items per comparison table is configurable (default: 10)
- The `max_items` value is returned in the API response metadata

---

### 1. Get Comparison Table
`GET /api/v1/catalog/comparison`

Returns the current comparison table with all items.

**Response:**
```json
{
  "data": {
    "token": "comparison_token_abc123",
    "variants": [
      {
        "id": 123,
        "product_id": 45,
        "title": "Product Title",
        "slug": "product-slug",
        "sku": "SKU123",
        "price": {
          "value": 10000,
          "currency": "USD",
          "formatted": "$100.00"
        },
        "is_in_stock": true,
        "images": [],
        "attribute_values": [],
        "specifications": [],
        "rating": {
          "value": 4.5,
          "count": 10
        }
      }
    ],
    "meta": {
      "count": 2,
      "max_items": 10
    }
  }
}
```

---

### 2. Add Item to Comparison
`POST /api/v1/catalog/comparison/items`

Adds a product variant to the comparison table.

**Body:**
```json
{
  "variant_id": 123
}
```

**Response:**
Updated comparison table

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error
  - Comparison is full (reached `max_items` limit)
  - Variant already in comparison
  - Variant not found
- `429`: Too many requests

---

### 3. Remove Item from Comparison
`DELETE /api/v1/catalog/comparison/items/{variantId}`

Removes a product variant from the comparison table.

**Path parameters:**
- `variantId` (number): Product variant ID to remove

**Response:**
Updated comparison table

**Error responses:**
- `401`: Unauthorized
- `404`: Item not found in comparison
- `422`: Validation error

---

### 4. Clear Comparison Table
`DELETE /api/v1/catalog/comparison`

Removes all items from the comparison table.

**Response:**
- Status: 204 No Content

Or empty comparison table structure.

**Error responses:**
- `401`: Unauthorized
- `422`: Validation error

---

## SSR/CSR Behavior

**CSR-Only:**
- Cart, Favorites, and Comparison are all CSR-only
- Never fetch in SSR
- Use `onMounted` or client-side composables
- Tokens managed in cookies

**Authentication:**
- Cart: `X-Cart-Token` (guest or user)
- Favorites: `X-Guest-Id`
- Comparison: `X-Comparison-Token`
