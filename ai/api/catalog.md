# Catalog API

Complete catalog endpoints for categories, brands, products, and search functionality.

## 1. Get All Categories
`GET /api/v1/catalog/categories`

Returns nested category tree.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Category Name",
      "slug": "category-slug",
      "children": []
    }
  ]
}
```

---

## 2. Get Brands
`GET /api/v1/catalog/brands`

Returns list of all available brands.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Brand Name",
      "slug": "brand-name"
    }
  ]
}
```

---

## 3. Get Category by Slug
`GET /api/v1/catalog/categories/{slug}`

**Query params:**
- `withProducts` (optional): Include products in response

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Category Name",
    "slug": "category-slug",
    "products": []
  }
}
```

---

## 4. Get Product Listing
`GET /api/v1/catalog/products`

**Filters:**
- `category` - Filter by category slug
- `search` - Search query
- `price[min]` - Minimum price
- `price[max]` - Maximum price
- `attributes[]` - Filter by attributes
- `sort` - Sort order
- `page` - Page number
- `per_page` - Items per page

**Response:**
```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "total": 100,
    "last_page": 10
  },
  "filters": {}
}
```

---

## 5. Get Product Variant by ID or Slug
`GET /api/v1/catalog/variants/{idOrSlug}`

### Variant Resolution

The `{idOrSlug}` parameter supports:
- numeric variant ID
- string slug

Frontend must not assume slug-only resolution.

**Response fields:**
- variant data
- images
- specification
- attributes
- price & effective price
- variant options

---

## 6. List All Variants
`GET /api/v1/catalog/variants`

**Query params:**
- `category` - Filter by category
- `search` - Search query
- `price[min]` - Minimum price
- `price[max]` - Maximum price
- `attributes[]` - Filter by attributes
- `sort` - Sort order
- `page` - Page number
- `per_page` - Items per page

**Response:**
```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "total": 100,
    "last_page": 10
  }
}
```

---

## 7. Search Suggestions (Autocomplete)
`GET /api/v1/catalog/suggest`

Returns search suggestions (autocomplete) and a compact preview of matching catalog items for fast UX.

**Query params:**
- `q` (required): Partial search query
- `variants_limit` (optional): Number of variants to preview. Min: 1, Max: 10, Default: 5
- `suggestions_limit` (optional): Number of suggestion phrases and facet items. Min: 1, Max: 10, Default: 5

**Headers:**
- `X-Guest-Id` (optional): For favorite flags when applicable

**Response:**
```json
{
  "data": {
    "query": "iphone",
    "history": ["iphone 15 pro max", "iphone"],
    "suggestions": [
      {
        "text": "iphone",
        "score": 0.8571,
        "source": "variants"
      }
    ],
    "variants": [
      {
        "id": 1932,
        "product_id": 646,
        "sku": "SKU-3931-ECAL",
        "slug": "iphone-15-pro-max",
        "title": "iPhone 15 Pro Max",
        "is_favorite": false,
        "images": [],
        "price": {
          "currency": "USD",
          "list_minor": "$232.25",
          "sale_minor": "$0.00",
          "effective_minor": "$232.25"
        },
        "is_in_stock": true,
        "rating": {
          "value": 4.5,
          "count": 10
        }
      }
    ],
    "brands": [
      {
        "id": 9,
        "title": "Apple",
        "slug": "apple",
        "count": 1
      }
    ],
    "categories": [
      {
        "id": 36,
        "title": "Smartphones",
        "slug": "smartphones",
        "count": 1
      }
    ]
  }
}
```

**Notes:**
- History contains only "confirmed" searches (from actual catalog searches)
- Suggestions are ranked by relevance score
- Variants include favorite flags when `X-Guest-Id` header is provided

---

## SSR/CSR Behavior

**SSR Pages** (SEO-critical):
- Product listing pages
- Category pages
- Product detail pages
- Use `useAsyncData` for data fetching

**Authentication:**
- None required for catalog endpoints
- Optional `X-Guest-Id` header for favorite flags
