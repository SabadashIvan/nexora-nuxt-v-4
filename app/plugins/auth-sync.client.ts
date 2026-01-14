import { useAuthStore } from '~/stores/auth.store'
import { useCartStore } from '~/stores/cart.store'
import { useLogger } from '~/composables/useLogger'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  const logger = useLogger()

  let lastState = authStore.state

  authStore.$subscribe((_mutation, state) => {
    const currentState = state.state

    if (lastState === 'guest' && currentState === 'auth') {
      cartStore.attachCart().catch((error) => {
        logger.error('Failed to attach cart after login', {
          category: 'auth.cart',
          key: 'auth:cart:attach-failed',
          data: { error },
        })
      })
    }

    if (lastState === 'auth' && currentState === 'guest') {
      cartStore.clearCart()
    }

    lastState = currentState
  })
})
