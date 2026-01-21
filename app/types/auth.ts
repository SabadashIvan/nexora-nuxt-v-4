/**
 * Authentication & Identity domain types
 * Session-based authentication (Laravel Sanctum SPA mode)
 */

import { IdentityAddressType, EmailVerificationStatus, PasswordResetStatus } from './enums'

export interface User {
  user_id: number
  first_name: string
  last_name: string
  full_name: string
  email?: string
  email_verified_at?: string | null
  githubId?: string
  googleId?: string
  created_at?: string
  updated_at?: string
}

// Re-export enums for convenience
export { IdentityAddressType, EmailVerificationStatus, PasswordResetStatus }

export interface IdentityAddress {
  id: number
  type: IdentityAddressType | string // Allow string for backward compatibility
  first_name: string
  last_name: string
  street: string
  city: string
  country: string
  postal_code: string
  phone?: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateAddressPayload {
  type: IdentityAddressType | string // Allow string for backward compatibility
  first_name: string
  last_name: string
  street: string
  city: string
  country: string
  postal_code: string
  phone?: string
  is_default?: boolean
}

export interface UpdateAddressPayload {
  first_name?: string
  last_name?: string
  street?: string
  city?: string
  country?: string
  postal_code?: string
  phone?: string
  is_default?: boolean
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  status: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface ResetPasswordResponse {
  status: string
}

/**
 * Change password request payload
 * POST /api/v1/change-password/request
 */
export interface ChangePasswordRequestPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

/**
 * Change password confirm payload
 * POST /api/v1/change-password/confirm/{token}
 */
export interface ChangePasswordConfirmPayload {
  email: string
}

/**
 * Change email request payload
 * POST /api/v1/change-email/request
 */
export interface ChangeEmailRequestPayload {
  new_email: string
}

/**
 * Backend address format (different from frontend IdentityAddress)
 * Backend returns is_default_shipping/is_default_billing, frontend expects type + is_default
 */
export interface BackendAddress {
  id: number
  first_name: string
  last_name: string
  street: string
  city: string
  country: string
  postal_code: string
  phone?: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Adapt backend address format to frontend IdentityAddress format
 */
export function adaptBackendAddress(backendAddr: BackendAddress): IdentityAddress {
  // Determine type based on which default flag is set
  let type: IdentityAddressType | string = IdentityAddressType.SHIPPING
  let isDefault = false

  if (backendAddr.is_default_shipping) {
    type = IdentityAddressType.SHIPPING
    isDefault = true
  } else if (backendAddr.is_default_billing) {
    type = IdentityAddressType.BILLING
    isDefault = true
  }

  return {
    id: backendAddr.id,
    type,
    first_name: backendAddr.first_name,
    last_name: backendAddr.last_name,
    street: backendAddr.street,
    city: backendAddr.city,
    country: backendAddr.country,
    postal_code: backendAddr.postal_code,
    phone: backendAddr.phone,
    is_default: isDefault,
    created_at: backendAddr.created_at,
    updated_at: backendAddr.updated_at,
  }
}

// Enums are now imported from ./enums
