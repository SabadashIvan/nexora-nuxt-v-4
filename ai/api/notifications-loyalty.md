# Notifications & Loyalty API

Complete endpoints for user notifications, notification preferences, and loyalty points management.

---

## Notifications API

### 1. List Notifications
`GET /api/v1/notifications`

Returns paginated list of notifications for the authenticated user.

**Authentication:** Required (cookie-based)

**Query params:**
- `filter` (optional): Filter by type. Allowed values: `all`, `unread`, `archived`. Default: `all`
- `page` (optional): Page number for pagination

**Response:**
```json
{
  "data": [
    {
      "id": "01HZYZ9S2W8X3C4V5B6N7M8K9J",
      "subject": "Invoice paid",
      "body": "Your invoice #INV-1001 has been paid.",
      "url": "https://example.com/invoices/INV-1001",
      "read_at": "2025-10-20T12:34:56+00:00",
      "is_archived": false,
      "created_at": "2025-10-20T12:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "has_more_pages": true
  }
}
```

---

### 2. Get Notification Preferences
`GET /api/v1/notifications/preferences`

Returns the editable notification preferences matrix for the current user.

**Authentication:** Required (cookie-based)

**Response:**
```json
{
  "data": [
    {
      "value": 1,
      "title": "Email",
      "contact_channel": {
        "value": 1,
        "can_link": true,
        "can_unlink": true,
        "is_linked": true
      },
      "groups": [
        {
          "value": 1,
          "title": "System notifications",
          "description": "Critical system updates and security alerts.",
          "enabled": true
        }
      ]
    }
  ]
}
```

---

### 3. Update Preferences by Channel/Group
`PUT /api/v1/notifications/preferences/{channel}/{group}`

Toggles the user's subscription for a specific notification group on the given delivery channel.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `channel` (integer): Delivery channel ID. Allowed values: 1 (Mail), 2 (Database), 3 (Broadcast)
- `group` (integer): Notification group ID

**Response:**
```json
{
  "data": {
    "value": 1,
    "title": "Email",
    "groups": [
      {
        "value": 1,
        "title": "System notifications",
        "enabled": true
      }
    ]
  }
}
```

---

### 4. Mark Notification as Read
`PUT /api/v1/notifications/{id}/read`

Marks a specific notification as read.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `id` (string): Notification ID

**Response:**
- Status: 204 No Content

---

### 5. Mark All Notifications as Read
`PUT /api/v1/notifications/read-all`

Marks all unread notifications as read for the current user.

**Authentication:** Required (cookie-based)

**Response:**
- Status: 204 No Content

---

### 6. Archive Notification
`PUT /api/v1/notifications/{id}/archive`

Archives the specified notification. Archived notifications are removed from the default list.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `id` (string): Notification ID

**Response:**
- Status: 204 No Content

---

### 7. Restore Notification
`PUT /api/v1/notifications/{id}/restore`

Restores a previously archived notification.

**Authentication:** Required (cookie-based)

**Path parameters:**
- `id` (string): Notification ID

**Response:**
- Status: 204 No Content

---

### 8. Get Unread Notifications Count
`GET /api/v1/notifications/count`

Returns the number of unread notifications for the current user.

**Authentication:** Required (cookie-based)

**Response:**
```json
{
  "data": {
    "unread_count": 3
  }
}
```

---

### 9. Telegram Webhook (Internal)
`POST /api/v1/notifications/webhooks/telegram/{token}`

Handling updates from Telegram. Internal use only.

---

## Loyalty API

APIs for managing user loyalty points and transaction history.

### 1. Get Loyalty Account Details
`GET /api/v1/loyalty`

Returns the current balance (active and pending) for the authenticated user.

**Authentication:** Required (cookie-based)

**Response:**
```json
{
  "data": {
    "user_id": 363,
    "balance": "$4,229.00",
    "pending": "$0.00"
  }
}
```

**Response fields:**
- `data.user_id` (number): User identifier
- `data.balance` (string): Active loyalty balance (formatted)
- `data.pending` (string): Pending loyalty balance (formatted)

---

### 2. Get Transaction History
`GET /api/v1/loyalty/history`

Returns a paginated list of loyalty transactions for the authenticated user.

**Authentication:** Required (cookie-based)

**Query parameters:**
- `page` (optional): Page number. Default: 1
- `per_page` (optional): Items per page. Default: 15

**Response:**
```json
{
  "data": [
    {
      "id": 10,
      "type": "Spending",
      "amount": "-$10.00",
      "description": "Payment for order #R15-20260105-0006",
      "expires_at": null,
      "created_at": "2026-01-05T18:54:29+00:00"
    },
    {
      "id": 9,
      "type": "Accrual",
      "amount": "$100.00",
      "description": "Initial bonus points",
      "expires_at": "2026-07-04T18:12:27+00:00",
      "created_at": "2026-01-05T18:12:27+00:00"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 6
    }
  }
}
```

**Response fields:**
- `data` (array): Array of transaction objects
- `data[].id` (number): Transaction identifier
- `data[].type` (string): Transaction type ("Accrual" or "Spending")
- `data[].amount` (string): Transaction amount (formatted with sign: "+$100.00" or "-$10.00")
- `data[].description` (string): Transaction description
- `data[].expires_at` (string | null): Expiration date (for accruals only)
- `data[].created_at` (string): Transaction creation date

---

## SSR/CSR Behavior

**CSR-Only:**
- All notifications and loyalty endpoints are CSR-only
- Never fetch in SSR
- Requires authentication
- Use `onMounted` or client-side composables

**Authentication:**
- All endpoints require cookie-based authentication
- Handle 401 responses by redirecting to login

---

## Notification Channels

The system supports three notification delivery channels:

1. **Mail (1)** - Email notifications
2. **Database (2)** - In-app notifications (stored in database)
3. **Broadcast (3)** - Real-time notifications (WebSocket/Pusher)

Users can toggle preferences for each channel and notification group independently.

---

## Loyalty Points Flow

1. **Accrual**: Points are added to user's account
   - May have expiration date
   - Shown with positive amount (+$100.00)
2. **Spending**: Points are deducted from user's account
   - No expiration date
   - Shown with negative amount (-$10.00)
3. **Pending**: Points waiting to be activated
   - Not yet available for spending
   - Shown separately in account details

---

## Important Notes

1. **Notification Filtering**: Supports `all`, `unread`, and `archived` filters
2. **Notification IDs**: Use ULID format (string)
3. **Loyalty Formatting**: All amounts are pre-formatted with currency symbol
4. **Transaction History**: Sorted by creation date (newest first)
5. **Expiration Tracking**: Only accruals have expiration dates
6. **Preferences Matrix**: Each channel/group combination can be toggled independently
