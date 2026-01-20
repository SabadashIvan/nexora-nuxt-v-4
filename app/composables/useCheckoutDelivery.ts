export function useCheckoutDelivery() {
  const getStore = () => useCheckoutStore()

  const shippingMethods = computed(() => getStore().shippingMethods)
  const shippingCurrency = computed(() => getStore().shippingCurrency)
  const deliveryLoading = ref(false)
  const deliveryError = ref<string | null>(null)

  const fetchShippingMethods = async (addressParams: {
    country: string
    city: string
    region?: string
    postal?: string
  }) => {
    deliveryLoading.value = true
    deliveryError.value = null

    try {
      await getStore().fetchShippingMethods(addressParams)
    } catch (error) {
      console.error('Checkout delivery fetch error:', error)
      deliveryError.value = 'Failed to load shipping methods'
    } finally {
      deliveryLoading.value = false
    }
  }

  return {
    shippingMethods,
    shippingCurrency,
    deliveryLoading,
    deliveryError,
    fetchShippingMethods,
  }
}
