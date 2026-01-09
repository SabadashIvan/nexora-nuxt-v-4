import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'
import type { User, IdentityAddress } from '~/types'
import { EmailVerificationStatus, PasswordResetStatus } from '~/types'
import { useApi } from '~/composables/useApi'

// Mock useApi
vi.mock('~/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock cart store
vi.mock('~/stores/cart.store', () => ({
  useCartStore: vi.fn(() => ({
    attachCart: vi.fn().mockResolvedValue(undefined),
  })),
}))

// Mock favorites store
vi.mock('~/stores/favorites.store', () => ({
  useFavoritesStore: vi.fn(() => ({
    fetchFavorites: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.addresses).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.initialized).toBe(false)
    })

    it('should check authentication status', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
      
      store.user = {
        user_id: 1,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        email: 'test@example.com',
      }
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: User = {
        user_id: 1,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        email: 'test@example.com',
      }
      
      const mockApi = {
        post: vi.fn().mockResolvedValue(undefined), // login endpoint returns 204
        get: vi.fn().mockResolvedValue(mockUser), // profile endpoint
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useAuthStore()
      const result = await store.login({
        email: 'test@example.com',
        password: 'password123',
      })
      
      expect(result).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.error).toBeNull()
    })

    it('should handle login errors', async () => {
      const mockApi = {
        post: vi.fn().mockRejectedValue({
          status: 422,
          message: 'Invalid credentials',
          errors: {
            email: ['The provided credentials are incorrect.'],
          },
        }),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.login({
        email: 'test@example.com',
        password: 'wrong',
      })
      
      expect(result).toBe(false)
      expect(store.user).toBeNull()
      expect(store.error).toBeTruthy()
      expect(store.fieldErrors).toBeTruthy()
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser: User = {
        user_id: 1,
        first_name: 'New',
        last_name: 'User',
        full_name: 'New User',
        email: 'new@example.com',
      }
      
      const mockApi = {
        post: vi.fn().mockResolvedValue(undefined), // register endpoint returns 204
        get: vi.fn().mockResolvedValue(mockUser), // profile endpoint
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useAuthStore()
      const result = await store.register({
        first_name: 'New',
        last_name: 'User',
        email: 'new@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      })
      
      expect(result).toBe(true)
      expect(store.user).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockApi = {
        post: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      store.user = {
        user_id: 1,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
      }
      
      await store.logout()
      
      expect(store.user).toBeNull()
    })
  })

  describe('fetchUser', () => {
    it('should fetch user successfully', async () => {
      const mockUser: User = {
        user_id: 1,
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        email: 'test@example.com',
      }
      
      const mockApi = {
        get: vi.fn().mockResolvedValue(mockUser),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.fetchUser()
      
      expect(result).toBe(true)
      expect(store.user).toEqual(mockUser)
    })

    it('should handle invalid session', async () => {
      const mockApi = {
        get: vi.fn().mockRejectedValue({
          status: 401,
          message: 'Unauthorized',
        }),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.fetchUser()
      
      expect(result).toBe(false)
      expect(store.user).toBeNull()
    })
  })

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const mockApi = {
        post: vi.fn().mockResolvedValue(undefined), // Returns 204
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.forgotPassword({
        email: 'test@example.com',
      })
      
      expect(result).toBe(true)
      expect(store.passwordResetStatus).toBe(PasswordResetStatus.SENT)
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockApi = {
        post: vi.fn().mockResolvedValue(undefined), // Returns 204
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.resetPassword({
        token: 'reset-token',
        email: 'test@example.com',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      })
      
      expect(result).toBe(true)
      expect(store.passwordResetStatus).toBe(PasswordResetStatus.RESET)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockApi = {
        get: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      const result = await store.verifyEmail('user-id', 'hash')
      
      expect(result).toBe(true)
      expect(store.emailVerificationStatus).toBe(EmailVerificationStatus.VERIFIED)
    })
  })

  describe('address management', () => {
    it('should fetch addresses', async () => {
      const mockAddresses: IdentityAddress[] = [
        {
          id: 1,
          type: 'shipping',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
          is_default: true,
        },
      ]
      
      const mockApi = {
        get: vi.fn().mockResolvedValue(mockAddresses),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      await store.fetchAddresses()
      
      expect(store.addresses).toEqual(mockAddresses)
    })

    it('should create address', async () => {
      const mockAddress: IdentityAddress = {
        id: 1,
        type: 'shipping',
        first_name: 'Test',
        last_name: 'User',
        street: '123 Main St',
        city: 'New York',
        country: 'US',
        postal_code: '10001',
      }
      
      const mockApi = {
        post: vi.fn().mockResolvedValue(mockAddress),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(useApi).mockReturnValue(mockApi as any)
      
      const store = useAuthStore()
      const result = await store.createAddress({
        type: 'shipping',
        first_name: 'Test',
        last_name: 'User',
        street: '123 Main St',
        city: 'New York',
        country: 'US',
        postal_code: '10001',
      })
      
      expect(result).toEqual(mockAddress)
      expect(store.addresses).toHaveLength(1)
      expect(store.addresses[0].id).toBe(mockAddress.id)
    })

    it('should update address', async () => {
      const updatedAddress: IdentityAddress = {
        id: 1,
        type: 'shipping',
        first_name: 'Updated',
        last_name: 'User',
        street: '123 Main St',
        city: 'New York',
        country: 'US',
        postal_code: '10001',
      }
      
      const mockApi = {
        put: vi.fn().mockResolvedValue(updatedAddress),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      store.addresses = [
        {
          id: 1,
          type: 'shipping',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
      ]
      
      const result = await store.updateAddress(1, {
        first_name: 'Updated',
      })
      
      expect(result).toEqual(updatedAddress)
      expect(store.addresses[0].first_name).toBe('Updated')
    })

    it('should delete address', async () => {
      const mockApi = {
        delete: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(useApi).mockReturnValue(mockApi)
      
      const store = useAuthStore()
      store.addresses = [
        {
          id: 1,
          type: 'shipping',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
      ]
      
      const result = await store.deleteAddress(1)
      
      expect(result).toBe(true)
      expect(store.addresses.length).toBe(0)
    })
  })

  describe('getters', () => {
    it('should get default shipping address', () => {
      const store = useAuthStore()
      store.addresses = [
        {
          id: 1,
          type: 'shipping',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
          is_default: true,
        },
        {
          id: 2,
          type: 'shipping',
          first_name: 'Other',
          last_name: 'User',
          street: '456 Other St',
          city: 'Boston',
          country: 'US',
          postal_code: '02101',
          is_default: false,
        },
      ]
      
      expect(store.defaultShippingAddress?.id).toBe(1)
    })

    it('should filter shipping addresses', () => {
      const store = useAuthStore()
      store.addresses = [
        {
          id: 1,
          type: 'shipping',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
        {
          id: 2,
          type: 'billing',
          first_name: 'Test',
          last_name: 'User',
          street: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
      ]
      
      expect(store.shippingAddresses.length).toBe(1)
      expect(store.billingAddresses.length).toBe(1)
    })
  })
})
