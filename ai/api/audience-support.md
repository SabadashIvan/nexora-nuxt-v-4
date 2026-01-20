# Audience, Leads & Support API

Complete endpoints for email subscriptions, contact forms, and customer support requests.

---

## Audience API

### 1. Subscribe to Audience
`POST /api/v1/audience/subscribe`

Creates a new subscriber with Pending status or resends a confirmation for an existing Pending/Unsubscribed email. If already Active, nothing is sent.

**Notes:**
- Protected by basic rate limiting
- Includes a honeypot field `website` which must be empty (bots fill it and will be rejected)

**Body:**
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "consent": true,
  "source": "footer_form",
  "website": ""
}
```

**Fields:**
- `email` (required): Subscriber email address
- `name` (optional): Subscriber name
- `consent` (required): Boolean indicating consent to receive emails
- `source` (optional): Source identifier (e.g., "footer_form", "home_form")
- `website` (required, honeypot): Must be empty string. Bots that fill this will be rejected.

**Response Examples:**

New subscriber created (200):
```json
{
  "message": "We've sent a confirmation email to your email address"
}
```

Already active (200):
```json
{
  "message": "You are already subscribed"
}
```

Resent confirmation (200):
```json
{
  "message": "We've already sent you a confirmation email. Sent again"
}
```

---

### 2. Confirm Subscription (Signed URL)
`GET /api/v1/audience/confirm?email={email}`

Confirms a subscriber by email using a temporary signed URL sent in the confirmation email. On success, redirects to the frontend success page.

**Query parameters:**
- `email` (required): Email to confirm

**Response:**
- Status: 302 Redirect to success page or error page

**Error responses:**
- `403`: Invalid signature

---

### 3. Unsubscribe (Signed URL)
`GET /api/v1/audience/unsubscribe?email={email}`

Unsubscribes a subscriber by email using a temporary signed URL from the unsubscribe email link.

**Query parameters:**
- `email` (required): Email to unsubscribe

**Response:**
- Status: 302 Redirect to frontend unsubscribe page (success) or error page

**Error responses:**
- `403`: Invalid signature

---

### 4. Unsubscribe from Account
`POST /api/v1/audience/unsubscribe`

Unsubscribes the currently authenticated user by their account email.

**Authentication:** Required (cookie-based)

**Response:**
- Status: 204 No Content

**Error responses:**
- `401`: Unauthenticated
- `404`: Subscriber not found

---

### 5. Audience Webhook
`POST /api/v1/audience/webhooks/{provider}`

Handles webhook events from external mailing providers to synchronize local subscriber statuses.

**Path parameters:**
- `provider` (string): Provider code

**Body:**
```json
{
  "event_id": "evt_123",          // Optional: Unique event identifier
  "email": "john.doe@example.com", // Required: Subscriber email
  "status": "active"              // Required: One of: "active", "unsubscribed"
}
```

**Response:**
- Status: 204 No Content (accepted and applied)

**Error responses:**
- `400`: Invalid webhook

**Notes:**
- Authentication is handled by provider-specific signature check
- For "null" driver, all requests are accepted with simple field mapping

---

## Leads API

Used for quick buy/callback requests and product inquiries.

### 1. Create Lead (Quick Buy / Callback Request)
`POST /api/v1/leads`

Submit a new lead for quick buy or callback request. Rate limited to 3 attempts per 60 minutes per email/IP combination.

**Authentication:** None required (public endpoint)

**Rate Limiting:**
- 3 attempts per 60 minutes per email/IP combination
- Returns 429 with `retry_after` field indicating seconds until retry is allowed

**Body:**
```json
{
  "items": [
    {
      "variant_id": 1234,
      "qty": 1
    }
  ],
  "customer_name": "John Doe",
  "customer_phone": "+380501234567",
  "customer_email": "john@example.com",
  "comment": "Please call after 6 PM",
  "currency": "UAH",
  "locale": "uk",
  "ip_address": "",
  "user_agent": "Mozilla/5.0...",
  "source": "product_page"
}
```

**Fields:**
- `items` (required): Array of product variants with variant_id and qty
- `customer_name` (required): Customer's full name (minimum 2 characters)
- `customer_phone` (required): Customer's phone number (minimum 10 digits)
- `customer_email` (optional): Customer's email address (must be valid email if provided)
- `comment` (optional): Additional comment or request details
- `currency` (required): Currency code (e.g., "UAH", "USD")
- `locale` (required): Locale code (e.g., "uk", "en")
- `ip_address` (required): Client IP address (automatically captured server-side from request headers)
- `user_agent` (required): Browser user agent (captured from `navigator.userAgent`)
- `source` (optional): Request source identifier (e.g., "product_page", "landing_page")

**Response Examples:**

Success (201):
```json
{
  "data": {
    "id": 1,
    "status": "new",
    "created_at": "2026-01-20T10:30:00.000000Z"
  }
}
```

Validation Error (422):
```json
{
  "message": "The customer phone field must be at least 10 characters. (and 1 more error)",
  "errors": {
    "customer_name": [
      "The customer name field must be at least 2 characters."
    ],
    "customer_phone": [
      "The customer phone field must be at least 10 characters."
    ]
  }
}
```

Rate Limit Exceeded (429):
```json
{
  "message": "Too many lead submission attempts. Please try again in 3540 seconds.",
  "error": "too_many_attempts",
  "retry_after": 3540
}
```

**Frontend Implementation:**

**Store:** `/app/stores/leads.store.ts`
```typescript
async createLead(payload: CreateLeadPayload): Promise<boolean> {
  const clientInfo = getClientInfo()
  const fullPayload = {
    ...payload,
    ip_address: '', // Server-side extraction
    user_agent: clientInfo.user_agent,
  }
  await api.post<LeadApiResponse>('/leads', fullPayload)
}
```

**Component:** `/app/components/product/QuickBuyModal.vue`
- Modal form for quick buy/callback requests
- Includes name, phone, email (optional), comment fields
- Real-time validation (name min 2 chars, phone min 10 digits)
- Handles rate limiting with retry countdown
- Displays field-level validation errors
- Success message with auto-close

**Usage Example:**
```vue
<QuickBuyModal
  :is-open="showQuickBuy"
  :product="{ variantId: 1234, title: 'iPhone 15 Pro', price: '$999' }"
  @update:is-open="showQuickBuy = $event"
/>
```

**Notes:**
- Metadata (ip_address, user_agent) is automatically captured
- IP address extracted server-side from request headers (X-Forwarded-For, etc.)
- User agent captured from browser via `navigator.userAgent`
- No authentication required (public endpoint)
- CSRF protection applies (XSRF token required)

---

## Customer Support API

Used for customer support request submissions.

### 1. Submit Support Request
`POST /api/v1/customer-support/requests`

Submit a new customer support request.

**Rate Limiting:**
- Limited to 3 attempts per 60 minutes per email/IP combination
- Returns 429 with `retry_after` field indicating seconds until retry is allowed

**Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+380501234567",
  "subject": "Question about delivery",
  "message": "Hello, I would like to know what delivery options are available.",
  "type": "general"
}
```

**Fields:**
- `name` (required): Customer's full name
- `email` (required): Customer's email address (must be valid email format)
- `phone` (optional): Customer's phone number
- `subject` (required): Subject/title of the support request
- `message` (required): Support request message (minimum 10 characters)
- `type` (optional): Request type - one of: "general", "technical", "billing", "other" (defaults to "general")

**Response Examples:**

Success (201):
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+380501234567",
    "subject": "Question about delivery",
    "message": "Hello, I would like to know what delivery options are available.",
    "type": "general",
    "status": "new",
    "metadata": {
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "source": "contact_page",
      "referer": "https://example.com"
    },
    "created_at": "2025-12-25T10:30:00.000000Z"
  }
}
```

Validation Error (422):
```json
{
  "message": "The email field must be a valid email address. (and 1 more error)",
  "errors": {
    "email": [
      "The email field must be a valid email address."
    ],
    "message": [
      "The message field must be at least 10 characters."
    ]
  }
}
```

Rate Limit Exceeded (429):
```json
{
  "message": "Too many support request attempts. Please try again in 3540 seconds.",
  "error": "too_many_attempts",
  "retry_after": 3540
}
```

**Notes:**
- Metadata (ip_address, user_agent, source, referer) is automatically captured by the backend
- No authentication required (public endpoint)
- CSRF protection applies (XSRF token required)

---

### 2. Get Support Request Types
`GET /api/v1/customer-support/requests/types`

Returns a list of all available support request types.

**Response:**
```json
[
  {
    "id": 1,
    "title": "General"
  },
  {
    "id": 2,
    "title": "Technical"
  }
]
```

---

## SSR/CSR Behavior

**SSR Compatible:**
- None - all endpoints are POST requests (mutations)

**CSR-Only:**
- All audience, leads, and support endpoints are CSR-only
- Use in forms with proper validation
- Include CSRF protection

**Authentication:**
- Most endpoints: No authentication required (public)
- Audience unsubscribe from account: Requires cookie-based authentication

---

## Rate Limiting

All submission endpoints are rate-limited:

**Limits:**
- Audience subscribe: Basic rate limiting
- Leads: 3 attempts per 60 minutes per email/IP
- Support requests: 3 attempts per 60 minutes per email/IP

**Rate Limit Response:**
```json
{
  "message": "Too many attempts. Please try again in {seconds} seconds.",
  "error": "too_many_attempts",
  "retry_after": 3540
}
```

---

## Honeypot Protection

The audience subscribe endpoint includes honeypot protection:

**Honeypot Field:**
- Field name: `website`
- Must be: empty string
- Purpose: Catch bots (bots fill all fields, humans leave honeypot empty)

**Example:**
```json
{
  "email": "john@example.com",
  "website": ""  // Must be empty!
}
```

---

## Important Notes

1. **CSRF Protection**: All POST requests require XSRF token
2. **Email Validation**: Email fields must be valid email format
3. **Rate Limiting**: Track by email/IP combination
4. **Signed URLs**: Confirm/Unsubscribe links use temporary signed URLs
5. **Metadata Capture**: Backend automatically captures IP, user agent, referer
6. **Redirects**: Signed URL endpoints redirect to frontend pages
7. **Webhook Authentication**: Provider-specific signature verification
