/**
 * Authentication & Identity domain types
 * Session-based authentication (Laravel Sanctum SPA mode)
 */

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Identity Address types for /api/v1/identity/addresses
 */
export type IdentityAddressType = 'shipping' | 'billing'

export interface IdentityAddress {
  id: number
  type: IdentityAddressType
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
  type: IdentityAddressType
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

export type EmailVerificationStatus = 'idle' | 'sent' | 'verified' | 'error'
export type PasswordResetStatus = 'idle' | 'sent' | 'reset' | 'error'

