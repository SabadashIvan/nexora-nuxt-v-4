import type { Address } from '~/types'

export function useCheckoutSession() {
  const getStore = () => useCheckoutStore()

  const hasSession = computed(() => getStore().hasSession)
  const checkoutId = computed(() => getStore().checkoutId)
  const items = computed(() => getStore().items)
  const pricing = computed(() => getStore().pricing)
  const addresses = computed(() => getStore().addresses)
  const paymentProviders = computed(() => getStore().paymentProviders)
  const status = computed(() => getStore().status)
  const loading = computed(() => getStore().loading)
  const error = computed(() => getStore().error)

  const startSession = async (billingSameAsShipping = true) => {
    return getStore().startCheckout(billingSameAsShipping)
  }

  const restartSession = async () => {
    return getStore().restartCheckout()
  }

  const applyAddress = async (
    shippingAddress: Address,
    billingAddress?: Address,
    billingSameAsShipping = true
  ) => {
    return getStore().updateAddress(shippingAddress, billingAddress, billingSameAsShipping)
  }

  const applyShippingMethod = async (
    methodCode: string,
    quoteId?: string,
    providerMetadata?: { warehouse_external_id?: string; settlement_external_id?: string }
  ) => {
    return getStore().applyShippingMethod(methodCode, quoteId, providerMetadata)
  }

  const applyPaymentProvider = async (providerCode: string) => {
    return getStore().applyPaymentProvider(providerCode)
  }

  const confirmCheckout = async () => {
    return getStore().confirmCheckout()
  }

  const initializePayment = async (orderId: number) => {
    return getStore().initializePayment(orderId)
  }

  const fetchPaymentProviders = async () => {
    return getStore().fetchPaymentProviders()
  }

  return {
    hasSession,
    checkoutId,
    items,
    pricing,
    addresses,
    paymentProviders,
    status,
    loading,
    error,
    startSession,
    restartSession,
    applyAddress,
    applyShippingMethod,
    applyPaymentProvider,
    confirmCheckout,
    initializePayment,
    fetchPaymentProviders,
  }
}
