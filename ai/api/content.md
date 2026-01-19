# Content API (Blog, Comments, Reviews)

Complete endpoints for blog posts, comments system, and product reviews.

---

## Blog API

The blog module is fully public and SEO-oriented.

### 1. Get Blog Categories
`GET /api/v1/blog/categories`

Returns list of all blog categories.

---

### 2. Get Category by Slug
`GET /api/v1/blog/categories/{slug}`

Returns specific blog category by slug.

---

### 3. Get Blog Posts
`GET /api/v1/blog/posts`

Retrieves a paginated list of published blog posts with optional filtering and sorting.

**Query params:**
- `category_id` (optional): Filter posts by category ID
- `search` (optional): Search query
- `sort` (optional): Sort order. One of: `newest`, `oldest`. Default: `newest`
- `page` (optional): Page number. Default: 1
- `per_page` (optional): Number of items per page (max 60). Default: 15

**Sorting options:**
- `newest` — newest posts first (by publish date)
- `oldest` — oldest posts first (by publish date)

**Response:**
```json
{
  "data": [
    {
      "id": 47,
      "slug": "my-blog-post",
      "title": "My Blog Post Title",
      "excerpt": "Post excerpt...",
      "featured_image": {
        "id": 27,
        "url": "https://example.com/image.webp"
      },
      "published_at": "2025-10-27T08:38:53+00:00",
      "author": {
        "id": 1,
        "name": "Super Admin"
      },
      "category": {
        "id": 3,
        "slug": "category-slug",
        "title": "Category Title",
        "description": "Category description"
      }
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 2,
      "per_page": 15,
      "total": 16
    }
  }
}
```

---

### 4. Get Blog Post by Slug
`GET /api/v1/blog/posts/{slug}`

Returns detailed information about a specific blog post.

**Response:**
```json
{
  "data": {
    "id": 9,
    "slug": "my-blog-post",
    "title": "My Blog Post Title",
    "excerpt": "Post excerpt...",
    "content": "Full post content HTML...",
    "featured_image": {
      "id": 6,
      "url": "https://example.com/image.webp"
    },
    "published_at": "2025-01-30T12:05:12+00:00",
    "author": {
      "id": 1,
      "name": "Super Admin"
    },
    "category": {
      "id": 5,
      "slug": "category-slug",
      "title": "Category Title",
      "description": "Category description"
    },
    "seo": {
      "id": 24,
      "path": "/blog/posts/my-blog-post",
      "title": null,
      "description": null,
      "keywords": null,
      "canonical": null,
      "robots": "",
      "text": null,
      "og_image": ""
    }
  }
}
```

---

## Comments API

Comments system allows users to comment on various entities (blog posts, products, etc.).

### 1. Get Comment Types
`GET /api/v1/comments/types`

Returns a list of all registered commentable types in the system.

**Response:**
```json
{
  "data": [
    {
      "value": "blog:post",
      "title": "Blog Post"
    }
  ]
}
```

---

### 2. List Comments
`GET /api/v1/comments`

Retrieves a simple-paginated list of approved comments for the specified entity.

**Query parameters:**
- `type` (required): Type of the commentable entity (e.g., "blog:post")
- `commentable_id` (required): ID of the entity to fetch comments for
- `per_page` (optional): Number of items per page (max 60). Default: 15
- `page` (optional): Page number. Default: 1

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "text": "Great article! Very informative.",
      "status": 1,
      "author": {
        "id": 42,
        "name": "John Doe"
      },
      "commentable": {
        "type": "blog:post",
        "id": 123,
        "title": "Blog Post"
      },
      "parent_id": null,
      "created_at": "2025-12-10T14:30:00.000000Z",
      "updated_at": "2025-12-10T14:30:00.000000Z",
      "replies": [
        {
          "id": 2,
          "text": "Thank you for your feedback!",
          "status": 1,
          "author": {
            "id": 1,
            "name": "Jane Smith"
          },
          "parent_id": 1,
          "created_at": "2025-12-10T15:45:00.000000Z",
          "replies": []
        }
      ]
    }
  ],
  "meta": {
    "has_more_pages": true
  }
}
```

---

### 3. Create Comment
`POST /api/v1/comments`

Creates a new comment on the specified entity.

**Authentication:** Required (cookie-based)

**Body:**
```json
{
  "type": "blog:post",      // Required: Commentable type
  "commentable_id": 123,    // Required: Entity ID
  "text": "Great article!", // Required: Comment text
  "parent_id": null         // Optional: Parent comment ID for replies
}
```

**Response:**
Created comment object (same structure as list response)

**Error responses:**
- `401`: Unauthenticated
- `422`: Validation error

---

## Reviews API

Reviews system allows authenticated users to leave reviews for products.

### 1. List Reviews
`GET /api/v1/reviews`

Retrieves a simple-paginated list of approved and active reviews for the specified product.

**Query parameters:**
- `id` (required): Product ID to fetch reviews for
- `page` (optional): Page number

**Response:**
```json
{
  "data": [
    {
      "id": 3,
      "rating": 5,
      "body": "Excellent product! Very satisfied.",
      "pros": "Fast delivery, great quality",
      "cons": null,
      "author": {
        "id": 4,
        "name": "John Doe"
      },
      "created_at": "2025-11-19T10:35:16.000000Z",
      "replies": [
        {
          "id": 4,
          "body": "Thank you for your review!",
          "is_active": true,
          "author": {
            "id": 8,
            "name": "Jane Smith"
          },
          "created_at": "2025-11-19T10:35:16.000000Z"
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "has_more_pages": false
  }
}
```

**Notes:**
- Only reviews with status = Approved and is_active = true are returned
- Each review contains only active replies
- Uses simple pagination (current_page and has_more_pages)

---

### 2. Create Review
`POST /api/v1/reviews`

Creates a review for the specified product. A user can leave only one review per product.

**Authentication:** Required (cookie-based)

**Body:**
```json
{
  "id": 123,                // Required: Product ID
  "rating": 5,             // Required: Rating from 1 to 5
  "body": "Great product!", // Required: Review text
  "pros": "Fast delivery", // Optional: Advantages
  "cons": "No instructions"   // Optional: Disadvantages
}
```

**Response:**
```json
{
  "data": {
    "id": 22,
    "rating": 5,
    "body": "Great product!",
    "pros": "Fast delivery",
    "cons": "No instructions",
    "author": {
      "id": 2388,
      "name": "John Doe"
    },
    "created_at": "2025-11-19T10:51:44.000000Z"
  }
}
```

**Error responses:**
- `401`: Unauthenticated
- `422`: Validation error (already reviewed, invalid rating, etc.)

**Notes:**
- If moderation is enabled, review is created with Pending status

---

### 3. Create Reply to Review
`POST /api/v1/reviews/{review_id}/replies`

Creates a reply for the specified review. Only authenticated users can post replies.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `review_id` (integer): Review ID

**Body:**
```json
{
  "body": "Thank you for your review!"  // Required: Reply text
}
```

**Response:**
```json
{
  "data": {
    "id": 23,
    "body": "Thank you for your review!",
    "is_active": true,
    "author": {
      "id": 2037,
      "name": "John Doe"
    },
    "created_at": "2025-11-19T11:09:24.000000Z"
  }
}
```

**Error responses:**
- `401`: Unauthenticated
- `404`: Review not found

**Notes:**
- Replies are active by default

---

## SSR/CSR Behavior

**SSR Pages** (SEO-critical):
- Blog post listing
- Blog post detail pages
- Use `useAsyncData` for data fetching
- Comments and reviews should be fetched on SSR for SEO

**CSR-Only:**
- Creating comments (requires authentication)
- Creating reviews (requires authentication)
- Creating replies (requires authentication)

**Authentication:**
- Comments: Cookie-based (required for creation)
- Reviews: Cookie-based (required for creation)
- Blog: No authentication required
