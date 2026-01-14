import { useAuthStore } from '~/stores/auth.store'
import { useCartStore } from '~/stores/cart.store'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()

  let lastState = authStore.state

  authStore.$subscribe((_mutation, state) => {
    const currentState = state.state

    if (lastState === 'guest' && currentState === 'auth') {
      cartStore.attachCart().catch((error) => {
        console.error('Failed to attach cart after login:', error)
      })
    }

    if (lastState === 'auth' && currentState === 'guest') {
      cartStore.clearCart()
    }

    lastState = currentState
  })
})
