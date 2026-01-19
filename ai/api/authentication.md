# Authentication & Identity API

Complete authentication, identity management, email verification, password reset, and OAuth endpoints.

## Authentication & Security Model

This API uses **SPA Authorization via Laravel Sanctum (cookie-based)**.

**Rules:**
- Authentication is session-based
- Frontend MUST NOT use Bearer tokens
- Authorization header is NOT required for authenticated requests
- CSRF protection is mandatory

**Frontend login flow:**
1. `GET /sanctum/csrf-cookie`
2. `POST /login`

All authenticated requests rely on HTTP-only cookies.

### ⚠️ Legacy Authentication (DEPRECATED)

The following endpoints are deprecated and must NOT be used by frontend:

- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/logout`
- `/api/v1/auth/user`

**Use Identity API instead:**
- `/login`
- `/register`
- `/logout`
- `/api/v1/identity/me/profile`

---

## 1. Identity API

Identity API is cookie-based (Sanctum).
Do NOT use Bearer tokens on frontend.

### 1.1 Register
`POST /register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "johndoe@mail.com",
  "password": "password",
  "password_confirmation": "password"
}
```

**Response (success):**
- Status: 204 No Content

**Error responses:**
- `422`: Validation error (e.g., email already registered, password too weak)
- `429`: Too many registration attempts. Please try again in {time} seconds.

### 1.2 Login (SPA / Sanctum)
`POST /login`

**Body:**
```json
{
  "email": "johndoe@mail.com",
  "password": "password",
  "remember": true  // Optional: Remember the user session. Defaults to true.
}
```

**Response (success):**
- Status: 204 No Content

**Error responses:**
- `422`: The provided credentials are incorrect.
- `429`: Too many login attempts. Please try again in {time} seconds.

### 1.3 Logout
`POST /logout`

Requires authentication via cookies.

**Response (success):**
- Status: 204 No Content

### 1.4 Get Profile
`GET /api/v1/identity/me/profile`

Requires authentication via cookies.

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "..."
}
```

### 1.5 Addresses

#### 1.5.1 Get Addresses
`GET /api/v1/identity/addresses`

#### 1.5.2 Create Address
`POST /api/v1/identity/addresses`

**Body:**
```json
{
  "type": "shipping",
  "first_name": "John",
  "last_name": "Doe",
  "street": "123 Main St",
  "city": "New York",
  "country": "US",
  "postal_code": "10001"
}
```

#### 1.5.3 Update Address
`PUT /api/v1/identity/addresses/{id}`

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "street": "123 Main St",
  "city": "New York",
  "country": "US",
  "postal_code": "10001"
}
```

#### 1.5.4 Delete Address
`DELETE /api/v1/identity/addresses/{id}`

---

## 2. Email Verification API

Supports full email verification flow.

### 2.1 Verify Email
`GET /verify-email/{id}/{hash}`

Verifies the user email address.

### 2.2 Resend Verification Email
`POST /email/verification-notification`

**Response:**
```json
{
  "status": "verification-link-sent"
}
```

---

## 3. Password Reset API

### 3.1 Request Password Reset Link
`POST /forgot-password`

**Body:**
```json
{
  "email": "user@mail.com"
}
```

**Response (success):**
- Status: 204 No Content

**Error responses:**
- `422`: The provided email is invalid.
- `429`: Too many password reset requests. Please try again in {time} seconds.

### 3.2 Reset Password
`POST /reset-password`

**Body:**
```json
{
  "token": "reset-token",
  "email": "user@mail.com",
  "password": "newpass",
  "password_confirmation": "newpass"
}
```

**Response (success):**
- Status: 204 No Content

**Error responses:**
- `422`: The reset token is invalid or expired.
- `429`: Too many password reset attempts. Please try again in {time} seconds.

---

## 4. OAuth Authentication

OAuth authentication endpoints for social login/registration and account linking.

### 4.1 Get OAuth Redirect URL
`GET /oauth/{provider}/redirect`

Initiates OAuth flow by redirecting to the provider's authorization page. Works for both login/register and account linking scenarios.

**Path parameters:**
- `provider` (string): OAuth provider (e.g., "google", "facebook")

**Behavior:**
- If user is NOT authenticated: will login/register after callback
- If user IS authenticated: will link social account after callback

**Response:**
- Status: 301 Redirect to provider's OAuth authorization page

**Error responses:**
- `422`: Invalid provider, provider not enabled, or provider not configured

### 4.2 Handle OAuth Callback
`GET /oauth/{provider}/callback`

Processes the OAuth callback from the provider. Automatically detects whether to login/register or link account.

**Path parameters:**
- `provider` (string): OAuth provider

**Login/Register scenario (user not authenticated):**
- Finds user by social account or email
- Creates new user if not found
- Logs user in and generates session
- Redirects to frontend callback URL

**Link account scenario (user authenticated):**
- Validates social account is not linked to another user
- Links social account to current user
- Keeps current session
- Redirects to frontend callback URL

**Response:**
- Status: 302 Redirect to frontend callback URL (success or error)

**Error responses:**
- `302`: Redirects with error in query params if account already linked
- `422`: Validation error (if no frontend callback URL configured)
- `429`: Too many login attempts

---

## 5. Identity API Extensions

Additional Identity API endpoints for password and email management.

### 5.1 Request Password Change
`POST /change-password/request`

Request a password change by validating the current password and sending a confirmation email.

**Authentication:** Required (cookie-based)

**Body:**
```json
{
  "current_password": "password123",        // Required: Current password
  "new_password": "newpassword123",        // Required: New password (min 8 chars)
  "new_password_confirmation": "newpassword123" // Required: Password confirmation
}
```

**Response:**
```json
{
  "status": "We have emailed your password reset link."
}
```

**Error responses:**
- `422`: Current password is incorrect

### 5.2 Confirm Password Change
`POST /change-password/confirm/{token}`

Confirm the password change using the token from the confirmation email.

**Path parameters:**
- `token` (string): Password change confirmation token from email

**Body:**
```json
{
  "email": "john@example.com"  // Required: User's email address
}
```

**Response:**
```json
{
  "message": "Your password has been reset."
}
```

**Error responses:**
- `422`: Invalid or expired token

### 5.3 Request Email Address Change
`POST /change-email/request`

Send an email change notification to the user.

**Authentication:** Required (cookie-based)

**Body:**
```json
{
  "new_email": "newemail@example.com"  // Optional: New email address
}
```

**Response:**
```json
{
  "status": "We have emailed your email change link."
}
```

**Error responses:**
- `422`: Validation error

### 5.4 Confirm Email Address Change
`POST /change-email/confirm/{token}`

Confirm the email address change using the token from the confirmation email.

**Path parameters:**
- `token` (string): Email change confirmation token from email

**Body:**
```json
{
  "email": "oldemail@example.com"  // Required: Current email address
}
```

**Response:**
```json
{
  "message": "Your email has been updated."
}
```

**Error responses:**
- `422`: Invalid or expired token

---

## Common API Rules

1. Call `GET /sanctum/csrf-cookie` once on app init
2. Ensure all mutation requests include XSRF token automatically
3. Use cookie-based authentication (Laravel Sanctum)
4. Handle 401 responses by redirecting to login
5. Handle 422 validation errors appropriately
6. Handle 429 rate limit errors with retry-after
