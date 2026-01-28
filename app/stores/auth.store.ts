/**
 * Auth Store (Identity Store)
 * Handles user authentication, registration, password reset, email verification, addresses
 * Uses Laravel Sanctum session-based SPA authentication
 * Identity API: /api/v1/identity/*
 */

import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import type {
  User,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  IdentityAddress,
  BackendAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  ChangePasswordRequestPayload,
  ChangePasswordConfirmPayload,
  ChangeEmailRequestPayload,
} from '~/types'
import { adaptBackendAddress } from '~/types/auth'
import { 
  EmailVerificationStatus,
  PasswordResetStatus,
} from '~/types'
import type { ApiResponse } from '~/types/common'
import { parseApiError, getFieldErrors, getErrorMessage, getAuthErrorMessage } from '~/utils/errors'

interface AuthState {
  user: User | null
  addresses: IdentityAddress[]
  loading: boolean
  addressLoading: boolean
  error: string | null
  fieldErrors: Record<string, string>
  emailVerificationStatus: EmailVerificationStatus | string // Allow string for backward compatibility
  passwordResetStatus: PasswordResetStatus | string // Allow string for backward compatibility
  /** Tracks if initial auth check has been done */
  initialized: boolean
  state: 'guest' | 'auth' | 'linking'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    addresses: [],
    loading: false,
    addressLoading: false,
    error: null,
    fieldErrors: {},
    emailVerificationStatus: EmailVerificationStatus.IDLE,
    passwordResetStatus: PasswordResetStatus.IDLE,
    initialized: false,
    state: 'guest',
  }),

  getters: {
    /**
     * Check if user is authenticated (session-based, check user only)
     */
    isAuthenticated: (state): boolean => {
      return state.state === 'auth'
    },

    /**
     * Check if user is guest
     */
    isGuest: (state): boolean => {
      return state.state === 'guest'
    },

    /**
     * Check if user is linking accounts
     */
    isLinking: (state): boolean => {
      return state.state === 'linking'
    },

    /**
     * Get user's name
     */
    userName: (state): string | null => {
      return state.user?.full_name || null
    },

    /**
     * Get user's email
     */
    userEmail: (state): string | null => {
      return state.user?.email || null
    },

    /**
     * Check if email is verified
     */
    isEmailVerified: (state): boolean => {
      return !!state.user?.email_verified_at
    },

    /**
     * Get default shipping address
     */
    defaultShippingAddress: (state): IdentityAddress | null => {
      return state.addresses.find(a => a.type === 'shipping' && a.is_default) || null
    },

    /**
     * Get default billing address
     */
    defaultBillingAddress: (state): IdentityAddress | null => {
      return state.addresses.find(a => a.type === 'billing' && a.is_default) || null
    },

    /**
     * Get shipping addresses
     */
    shippingAddresses: (state): IdentityAddress[] => {
      return state.addresses.filter(a => a.type === 'shipping')
    },

    /**
     * Get billing addresses
     */
    billingAddresses: (state): IdentityAddress[] => {
      return state.addresses.filter(a => a.type === 'billing')
    },
  },

  actions: {
    /**
     * Clear errors
     */
    clearErrors() {
      this.error = null
      this.fieldErrors = {}
    },

    /**
     * Set guest state and clear user data
     */
    setGuest() {
      this.user = null
      this.state = 'guest'
    },

    /**
     * Set authenticated state with user data
     */
    setAuthenticated(user: User) {
      this.user = user
      this.state = 'auth'
    },

    /**
     * Set linking state (only allowed from authenticated)
     */
    setLinking() {
      if (this.state !== 'auth') {
        throw new Error('Cannot enter linking state unless authenticated.')
      }
      this.state = 'linking'
    },

    /**
     * Login user (session-based)
     * CSRF cookie is automatically handled by useApi() with 419 retry
     */
    async login(payload: LoginPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Login (returns 204 No Content)
        // CSRF is auto-fetched by useApi if missing, and auto-retried on 419
        await nuxtApp.runWithContext(async () => await api.post('/login', payload))
        
        // Fetch user data via Identity API
        const response = await nuxtApp.runWithContext(async () => 
          await api.get<ApiResponse<User> | User>('/identity/me/profile')
        )
        // Handle wrapped response - check if data is wrapped
        const user = ('data' in response && response.data) ? response.data : response as User
        this.setAuthenticated(user)

        // Refresh favorites to get user's favorites (instead of guest favorites)
        try {
          const favoritesStore = useFavoritesStore()
          await nuxtApp.runWithContext(async () => await favoritesStore.fetchFavorites())
        } catch (error) {
          // Don't break login if favorites refresh fails
          console.warn('Failed to refresh favorites after login:', error)
        }

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = getAuthErrorMessage('login', apiError)
        this.fieldErrors = getFieldErrors(apiError)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Register new user (session-based)
     * CSRF cookie is automatically handled by useApi() with 419 retry
     */
    async register(payload: RegisterPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Register (returns 204 No Content)
        // CSRF is auto-fetched by useApi if missing, and auto-retried on 419
        await nuxtApp.runWithContext(async () => await api.post('/register', payload))
        
        // Fetch user data via Identity API
        const response = await nuxtApp.runWithContext(async () => 
          await api.get<ApiResponse<User> | User>('/identity/me/profile')
        )
        // Handle wrapped response - check if data is wrapped
        const user = ('data' in response && response.data) ? response.data : response as User
        this.setAuthenticated(user)

        // Refresh favorites to get user's favorites (instead of guest favorites)
        try {
          const favoritesStore = useFavoritesStore()
          await nuxtApp.runWithContext(async () => await favoritesStore.fetchFavorites())
        } catch (error) {
          // Don't break registration if favorites refresh fails
          console.warn('Failed to refresh favorites after registration:', error)
        }

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = getAuthErrorMessage('register', apiError)
        this.fieldErrors = getFieldErrors(apiError)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Logout user (session-based)
     */
    async logout(): Promise<void> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      try {
        // Call logout endpoint if user is authenticated
        if (this.user) {
          await nuxtApp.runWithContext(async () => await api.post('/logout'))
        }
        await nuxtApp.runWithContext(async () => await useUserSession().clear())
      } catch (error) {
        // Ignore errors - we're logging out anyway
        console.error('Logout error:', error)
      } finally {
        // Clear local state regardless
        this.setGuest()
        
        // Refresh favorites to get guest favorites (instead of user favorites)
        try {
          const favoritesStore = useFavoritesStore()
          await nuxtApp.runWithContext(async () => await favoritesStore.fetchFavorites())
        } catch (error) {
          // Don't break logout if favorites refresh fails
          console.warn('Failed to refresh favorites after logout:', error)
        }
      }
    },

    /**
     * Fetch current user profile (session-based)
     * Tries to get user data using existing session cookie via Identity API
     */
    async fetchUser(): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      
      this.loading = true
      this.clearErrors()

      try {
        const response = await nuxtApp.runWithContext(async () => 
          await api.get<ApiResponse<User> | User>('/identity/me/profile')
        )
        // Handle wrapped response - check if data is wrapped
        const user = ('data' in response && response.data) ? response.data : response as User
        this.setAuthenticated(user)
        return true
      } catch {
        // Session is invalid or expired
        this.setGuest()
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Request password reset email
     * CSRF cookie is automatically handled by useApi() with 419 retry
     * Returns 204 No Content on success
     */
    async forgotPassword(payload: ForgotPasswordPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()
      this.passwordResetStatus = PasswordResetStatus.IDLE

      try {
        // Returns 204 No Content on success
        await nuxtApp.runWithContext(async () => 
          await api.post('/forgot-password', payload)
        )
        this.passwordResetStatus = PasswordResetStatus.SENT
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = getAuthErrorMessage('forgot-password', apiError)
        this.fieldErrors = getFieldErrors(apiError)
        this.passwordResetStatus = PasswordResetStatus.ERROR
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset password with token
     * CSRF cookie is automatically handled by useApi() with 419 retry
     * Returns 204 No Content on success
     */
    async resetPassword(payload: ResetPasswordPayload): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        // Returns 204 No Content on success
        await nuxtApp.runWithContext(async () => 
          await api.post('/reset-password', payload)
        )
        this.passwordResetStatus = PasswordResetStatus.RESET
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = getAuthErrorMessage('reset-password', apiError)
        this.fieldErrors = getFieldErrors(apiError)
        this.passwordResetStatus = PasswordResetStatus.ERROR
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Verify email address
     * Note: This is a GET request that redirects (302) on success
     */
    async verifyEmail(id: string, hash: string): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()
      this.emailVerificationStatus = EmailVerificationStatus.IDLE

      try {
        await nuxtApp.runWithContext(async () => 
          await api.get(`/verify-email/${id}/${hash}`)
        )
        this.emailVerificationStatus = EmailVerificationStatus.VERIFIED
        
        // Refresh user to get updated verification status
        await this.fetchUser()
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.emailVerificationStatus = EmailVerificationStatus.ERROR
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Resend verification email
     */
    async resendVerificationEmail(): Promise<boolean> {
      // Capture Nuxt context at the start to preserve it after await
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () => 
          await api.post('/email/verification-notification')
        )
        this.emailVerificationStatus = EmailVerificationStatus.SENT
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.emailVerificationStatus = EmailVerificationStatus.ERROR
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Initialize auth state from session cookie
     * Attempts to fetch user if session exists
     */
    async initialize(): Promise<void> {
      if (this.initialized) return

      // On client, try to fetch user to check if session is valid
      if (import.meta.client) {
        await this.fetchUser()
      } else {
        this.setGuest()
      }

      this.initialized = true
    },

    // ==========================================
    // Address Management (Identity API)
    // ==========================================

    /**
     * Fetch user addresses
     * GET /api/v1/identity/addresses
     * Note: Backend may return addresses with is_default_shipping/is_default_billing
     * instead of type + is_default. Use adapter to handle both formats.
     */
    async fetchAddresses(): Promise<void> {
      const api = useApi()
      this.addressLoading = true
      this.error = null

      try {
        const addresses = await api.get<(IdentityAddress | BackendAddress)[]>('/identity/addresses')
        // Adapt backend addresses to frontend format if needed
        this.addresses = addresses.map(addr => {
          // Check if it's already in frontend format (has 'type' field)
          if ('type' in addr) {
            return addr as IdentityAddress
          }
          // Otherwise, adapt from backend format
          return adaptBackendAddress(addr as BackendAddress)
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch addresses error:', error)
      } finally {
        this.addressLoading = false
      }
    },

    /**
     * Create new address
     * POST /api/v1/identity/addresses
     */
    async createAddress(payload: CreateAddressPayload): Promise<IdentityAddress | null> {
      const api = useApi()
      this.addressLoading = true
      this.error = null
      this.fieldErrors = {}

      try {
        const address = await api.post<IdentityAddress>('/identity/addresses', payload)
        this.addresses.push(address)
        return address
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Create address error:', error)
        return null
      } finally {
        this.addressLoading = false
      }
    },

    /**
     * Update existing address
     * PUT /api/v1/identity/addresses/{id}
     */
    async updateAddress(id: number, payload: UpdateAddressPayload): Promise<IdentityAddress | null> {
      const api = useApi()
      this.addressLoading = true
      this.error = null
      this.fieldErrors = {}

      try {
        const address = await api.put<IdentityAddress>(`/identity/addresses/${id}`, payload)
        // Update in local state
        const index = this.addresses.findIndex(a => a.id === id)
        if (index !== -1) {
          this.addresses[index] = address
        }
        return address
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Update address error:', error)
        return null
      } finally {
        this.addressLoading = false
      }
    },

    /**
     * Delete address
     * DELETE /api/v1/identity/addresses/{id}
     */
    async deleteAddress(id: number): Promise<boolean> {
      const api = useApi()
      this.addressLoading = true
      this.error = null

      try {
        await api.delete(`/identity/addresses/${id}`)
        // Remove from local state
        this.addresses = this.addresses.filter(a => a.id !== id)
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Delete address error:', error)
        return false
      } finally {
        this.addressLoading = false
      }
    },

    // ==========================================
    // Password & Email Change
    // ==========================================

    /**
     * Request password change (sends confirmation email)
     * POST /api/v1/change-password/request
     * Requires authentication
     */
    async requestPasswordChange(payload: ChangePasswordRequestPayload): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () =>
          await api.post('/change-password/request', payload)
        )
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Request password change error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Confirm password change with token
     * POST /api/v1/change-password/confirm/{token}
     */
    async confirmPasswordChange(token: string, payload: ChangePasswordConfirmPayload): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () =>
          await api.post(`/change-password/confirm/${token}`, payload)
        )
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Confirm password change error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Request email change (sends confirmation email to new address)
     * POST /api/v1/change-email/request
     * Requires authentication
     */
    async requestEmailChange(payload: ChangeEmailRequestPayload): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () =>
          await api.post('/change-email/request', payload)
        )
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Request email change error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Confirm email change with verification link
     * POST /api/v1/change-email/confirm/{token}
     */
    async confirmEmailChange(token: string, email: string): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      try {
        await nuxtApp.runWithContext(async () =>
          await api.post(`/change-email/confirm/${token}`, { email })
        )
        // Refresh user to get updated email
        await this.fetchUser()
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Confirm email change error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    // ==========================================
    // Contact Channels (Telegram/Phone)
    // ==========================================

    /**
     * Link a contact channel (Telegram or Phone)
     * POST /api/v1/identity/contacts/{channel}
     * @param channel - 'telegram' (channel=2) or 'phone' (channel=3)
     * @param phone - Required for phone channel
     * @returns Deeplink URL for Telegram, or null for phone (204 No Content)
     */
    async linkContactChannel(
      channel: 'telegram' | 'phone',
      phone?: string
    ): Promise<{ deeplink: string } | null> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      // Map channel name to channel ID
      const channelId = channel === 'telegram' ? 2 : 3

      try {
        const body = channel === 'phone' && phone ? { phone } : {}

        const response = await nuxtApp.runWithContext(async () =>
          await api.post<{ data: string; meta: { type: string } } | undefined>(
            `/identity/contacts/${channelId}`,
            body
          )
        )

        // Telegram returns deeplink, phone returns 204 No Content
        if (response && 'data' in response && response.meta?.type === 'deeplink') {
          return { deeplink: response.data }
        }

        return null
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error(`Link ${channel} channel error:`, error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Unlink a contact channel (Telegram or Phone)
     * DELETE /api/v1/identity/contacts/{channel}
     * @param channel - 'telegram' (channel=2) or 'phone' (channel=3)
     */
    async unlinkContactChannel(channel: 'telegram' | 'phone'): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const api = useApi()
      this.loading = true
      this.clearErrors()

      // Map channel name to channel ID
      const channelId = channel === 'telegram' ? 2 : 3

      try {
        await nuxtApp.runWithContext(async () =>
          await api.delete(`/identity/contacts/${channelId}`)
        )
        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error(`Unlink ${channel} channel error:`, error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Reset store state
     */
    reset() {
      this.setGuest()
      this.addresses = []
      this.loading = false
      this.addressLoading = false
      this.error = null
      this.fieldErrors = {}
      this.emailVerificationStatus = EmailVerificationStatus.IDLE
      this.passwordResetStatus = PasswordResetStatus.IDLE
      this.initialized = false
    },
  },
})
