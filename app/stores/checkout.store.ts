/**
 * Checkout Store
 * Handles complete checkout flow: address, shipping, payment, confirmation
 * CSR-only - depends on cart token
 * 
 * Single-Page Checkout (SPC) model:
 * - All steps on /checkout page
 * - Sequential: address → shipping → payment → confirm
 */

import { defineStore } from 'pinia'
import type {
  CheckoutState,
  CheckoutItem,
  CheckoutAddresses,
  CheckoutPricing,
  ShippingMethod,
  ShippingMethodsResponse,
  PaymentProvider,
  CheckoutStatus,
  Address,
  StartCheckoutPayload,
  StartCheckoutResponse,
  CheckoutUpdateAddressPayload,
  SetShippingMethodPayload,
  SetPaymentProviderPayload,
  CheckoutConfirmResponse,
  PaymentInitPayload,
  PaymentInitResponse,
} from '~/types'
import { parseApiError, getErrorMessage, CHECKOUT_ERRORS } from '~/utils/errors'
import { useCartStore } from '~/stores/cart.store'

const initialAddresses: CheckoutAddresses = {
  shipping: null,
  billing: null,
  billingSameAsShipping: true,
}

const initialPricing: CheckoutPricing = {
  items: 0,
  shipping: 0,
  discounts: 0,
  total: 0,
  currency: 'USD',
}

export const useCheckoutStore = defineStore('checkout', {
  state: (): CheckoutState => ({
    checkoutId: null,
    items: [],
    addresses: { ...initialAddresses },
    shippingMethods: [],
    shippingCurrency: null,
    selectedShipping: null,
    paymentProviders: [],
    selectedPayment: null,
    pricing: { ...initialPricing },
    status: 'idle',
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Check if checkout session exists
     */
    hasSession: (state): boolean => {
      return !!state.checkoutId
    },

    /**
     * Check if address is complete
     */
    hasAddress: (state): boolean => {
      return !!state.addresses.shipping
    },

    /**
     * Check if shipping method is selected
     */
    hasShipping: (state): boolean => {
      return !!state.selectedShipping
    },

    /**
     * Check if payment provider is selected
     */
    hasPayment: (state): boolean => {
      return !!state.selectedPayment
    },

    /**
     * Check if checkout can be confirmed
     */
    canConfirm: (state): boolean => {
      return !!(
        state.checkoutId &&
        state.addresses.shipping &&
        state.selectedShipping &&
        state.selectedPayment
      )
    },

    /**
     * Get total item count
     * Uses qty from CartItem (not quantity)
     */
    itemCount: (state): number => {
      return state.items.reduce((sum, item) => sum + (item.qty || 0), 0)
    },

    /**
     * Get billing address (or shipping if same)
     */
    billingAddress: (state): Address | null => {
      if (state.addresses.billingSameAsShipping) {
        return state.addresses.shipping
      }
      return state.addresses.billing
    },
  },

  actions: {
    /**
     * Extract data from API response (handles { data: ... } wrapper)
     */
    extractData<T>(response: T | { data: T }): T {
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as { data: T }).data
      }
      return response as T
    },

    /**
     * Start checkout session
     * @param billingSameAsShipping - Whether billing address is same as shipping (default: true)
     */
    async startCheckout(billingSameAsShipping = true): Promise<boolean> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: StartCheckoutPayload = {
          billing_same_as_shipping: billingSameAsShipping,
        }

        const rawResponse = await api.post<StartCheckoutResponse | { data: StartCheckoutResponse }>(
          '/checkout/start',
          payload,
          { 
            cart: true,
          }
        )

        const response = this.extractData(rawResponse)

        this.checkoutId = response.id
        this.items = response.items
        this.pricing = response.pricing
        if (response.addresses) {
          this.addresses = response.addresses
        }
        this.addresses.billingSameAsShipping = billingSameAsShipping
        this.status = 'address'

        return true
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        
        // Handle session expired (404)
        if (apiError.status === 404) {
          this.error = 'Checkout session expired. Please try again.'
        }
        
        console.error('Start checkout error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Update addresses
     */
    async updateAddress(
      shippingAddress: Address,
      billingAddress?: Address,
      billingSameAsShipping = true
    ): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: CheckoutUpdateAddressPayload = {
          shipping_address: shippingAddress,
          billing_same_as_shipping: billingSameAsShipping,
        }

        if (!billingSameAsShipping && billingAddress) {
          payload.billing_address = billingAddress
        }

        const rawResponse = await api.put<{ addresses: CheckoutAddresses; pricing: CheckoutPricing } | { data: { addresses: CheckoutAddresses; pricing: CheckoutPricing } }>(
          `/checkout/${this.checkoutId}/address`,
          payload,
          { 
            cart: true,
          }
        )

        const response = this.extractData(rawResponse)

        this.addresses = response.addresses
        if (response.pricing) {
          this.pricing = response.pricing
        }
        this.status = 'shipping'

        // Auto-fetch shipping methods
        await this.fetchShippingMethods()

        return true
      } catch (error) {
        await this.handleCheckoutError(error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch available shipping methods
     * Uses X-Cart-Token for cart-aware shipping rates
     * Response format: { data: { currency, methods: [...], cache_ttl_seconds } }
     * 
     * @param addressParams - Destination address for shipping calculation
     *   - country: ISO country code (required)
     *   - city: City name (required)
     *   - region: Region/state (optional)
     *   - postal: Postal code (optional)
     */
    async fetchShippingMethods(addressParams?: {
      country: string
      city: string
      region?: string
      postal?: string
    }): Promise<void> {
      // Require at least country and city for shipping calculation
      if (!addressParams?.country || !addressParams?.city) {
        this.shippingMethods = []
        this.shippingCurrency = null
        return
      }

      const api = useApi()
      this.loading = true

      try {
        // Build query params with dest[field] format (as per API spec)
        const queryParams: Record<string, string> = {
          'dest[country]': addressParams.country,
          'dest[city]': addressParams.city,
        }
        
        if (addressParams.region) {
          queryParams['dest[region]'] = addressParams.region
        }
        if (addressParams.postal) {
          queryParams['dest[postal]'] = addressParams.postal
        }

        // API uses X-Cart-Token header (via cart: true option) to get cart-specific rates
        const rawResponse = await api.get<{ data: ShippingMethodsResponse } | ShippingMethodsResponse>(
          '/shipping/methods',
          queryParams,
          { cart: true }
        )

        // Extract data from wrapper
        const response = this.extractData(rawResponse)
        
        // Handle response structure: { currency, methods, cache_ttl_seconds }
        if (response && typeof response === 'object' && 'methods' in response) {
          const shippingResponse = response as ShippingMethodsResponse
          this.shippingMethods = shippingResponse.methods || []
          this.shippingCurrency = shippingResponse.currency || null
        } else {
          // Fallback for unexpected format
          this.shippingMethods = Array.isArray(response) ? response : []
        }
      } catch (error) {
        console.error('Fetch shipping methods error:', error)
        this.shippingMethods = []
        this.shippingCurrency = null
      } finally {
        this.loading = false
      }
    },

    /**
     * Select shipping method
     * @param methodCode - Shipping method code
     * @param quoteId - Optional quote ID from shipping methods response
     */
    async applyShippingMethod(methodCode: string, quoteId?: string): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: SetShippingMethodPayload = { 
          method_code: methodCode,
          quote_id: quoteId,
        }
        const rawResponse = await api.put<{ shipping_method: ShippingMethod; pricing: CheckoutPricing } | { data: { shipping_method: ShippingMethod; pricing: CheckoutPricing } }>(
          `/checkout/${this.checkoutId}/shipping-method`,
          payload,
          { 
            cart: true,
          }
        )

        const response = this.extractData(rawResponse)

        this.selectedShipping = response.shipping_method
        this.pricing = response.pricing
        this.status = 'payment'

        // Auto-fetch payment providers
        await this.fetchPaymentProviders()

        return true
      } catch (error) {
        await this.handleCheckoutError(error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch available payment providers
     */
    async fetchPaymentProviders(): Promise<void> {
      const api = useApi()
      this.loading = true

      try {
        const rawResponse = await api.get<PaymentProvider[] | { data: PaymentProvider[] }>('/payments/providers')
        const providers = this.extractData(rawResponse)
        this.paymentProviders = Array.isArray(providers) ? providers : []
      } catch (error) {
        console.error('Fetch payment providers error:', error)
        this.paymentProviders = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Select payment provider
     */
    async applyPaymentProvider(providerCode: string): Promise<boolean> {
      if (!this.checkoutId) {
        this.error = 'No checkout session'
        return false
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: SetPaymentProviderPayload = { provider_code: providerCode }
        const rawResponse = await api.put<{ payment_provider: PaymentProvider; pricing: CheckoutPricing } | { data: { payment_provider: PaymentProvider; pricing: CheckoutPricing } }>(
          `/checkout/${this.checkoutId}/payment-provider`,
          payload,
          { 
            cart: true,
          }
        )

        const response = this.extractData(rawResponse)

        this.selectedPayment = response.payment_provider
        if (response.pricing) {
          this.pricing = response.pricing
        }
        this.status = 'confirm'

        return true
      } catch (error) {
        await this.handleCheckoutError(error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Confirm checkout and create order
     * Returns order ID on success, null on failure
     */
    async confirmCheckout(): Promise<number | null> {
      if (!this.checkoutId || !this.canConfirm) {
        this.error = 'Cannot confirm checkout - missing required data'
        return null
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const rawResponse = await api.post<CheckoutConfirmResponse | { data: CheckoutConfirmResponse }>(
          `/checkout/${this.checkoutId}/confirm`,
          undefined,
          { 
            cart: true,
          }
        )

        const response = this.extractData(rawResponse)
        this.status = 'completed'

        // Clear cart after successful checkout
        const cartStore = useCartStore()
        cartStore.clearCart()

        return response.order_id
      } catch (error) {
        await this.handleCheckoutError(error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Initialize payment after order confirmation
     * @param orderId - The order ID from confirmCheckout
     * @returns PaymentInitResponse with payment_url for online payments, or null for offline
     */
    async initializePayment(orderId: number): Promise<PaymentInitResponse | null> {
      if (!this.selectedPayment) {
        this.error = 'No payment provider selected'
        return null
      }

      // Offline payments don't need initialization
      if (this.selectedPayment.type === 'offline') {
        return null
      }

      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const payload: PaymentInitPayload = { order_id: orderId }
        const rawResponse = await api.post<PaymentInitResponse | { data: PaymentInitResponse }>(
          `/payments/${this.selectedPayment.code}/init`,
          payload,
          { idempotent: true }
        )

        const response = this.extractData(rawResponse)
        return response
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        console.error('Payment init error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Restart checkout after cart changes or session expiry
     * Preserves addresses if possible
     */
    async restartCheckout(): Promise<boolean> {
      // Save current addresses before reset
      const savedAddresses = { ...this.addresses }
      const billingSameAsShipping = this.addresses.billingSameAsShipping

      // Reset state
      this.reset()

      // Start new checkout session
      const success = await this.startCheckout(billingSameAsShipping)

      if (success && savedAddresses.shipping) {
        // Restore addresses
        this.addresses = savedAddresses
      }

      return success
    },

    /**
     * Handle checkout errors with specific error codes
     */
    async handleCheckoutError(error: unknown): Promise<void> {
      const apiError = parseApiError(error)
      this.error = apiError.message

      // Handle specific checkout errors
      if (apiError.status === 422) {
        // Check for specific error codes
        if (apiError.message.includes(CHECKOUT_ERRORS.CART_CHANGED) || apiError.message.includes('CART_CHANGED')) {
          // Cart changed during checkout - need to restart
          this.error = 'Your cart has changed. Please review your order.'
          await this.restartCheckout()
          return
        }

        if (apiError.message.includes(CHECKOUT_ERRORS.INVALID_SHIPPING) || apiError.message.includes('INVALID_SHIPPING')) {
          // Shipping method no longer available
          this.error = 'Selected shipping method is no longer available. Please choose another.'
          this.selectedShipping = null
          this.status = 'shipping'
          await this.fetchShippingMethods()
          return
        }

        if (apiError.message.includes('INVALID_PAYMENT')) {
          // Payment provider no longer available
          this.error = 'Selected payment method is no longer available. Please choose another.'
          this.selectedPayment = null
          this.status = 'payment'
          await this.fetchPaymentProviders()
          return
        }
      }

      // Handle session expired (404)
      if (apiError.status === 404) {
        this.error = 'Checkout session expired. Please try again.'
        await this.restartCheckout()
        return
      }

      console.error('Checkout error:', error)
    },

    /**
     * Reset checkout state
     */
    reset(): void {
      this.checkoutId = null
      this.items = []
      this.addresses = { ...initialAddresses }
      this.shippingMethods = []
      this.shippingCurrency = null
      this.selectedShipping = null
      this.paymentProviders = []
      this.selectedPayment = null
      this.pricing = { ...initialPricing }
      this.status = 'idle'
      this.loading = false
      this.error = null
    },
  },
})
