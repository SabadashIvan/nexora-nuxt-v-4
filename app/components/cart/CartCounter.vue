<script setup lang="ts">
/**
 * Cart Counter Component
 * Displays cart item count with link to cart page
 * Used in header navigation
 */

const cartStore = useCartStore()

// Load cart on mount if we have a token
onMounted(async () => {
  if (cartStore.cartToken && !cartStore.cart) {
    await cartStore.loadCart()
  }
})
</script>

<template>
  <NuxtLink
    to="/cart"
    class="cart-counter"
    :class="{ 'has-items': cartStore.itemCount > 0 }"
    aria-label="Shopping cart"
  >
    <!-- Cart Icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="cart-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
    
    <!-- Badge with count -->
    <Transition name="badge">
      <span
        v-if="cartStore.itemCount > 0"
        class="cart-badge"
      >
        {{ cartStore.itemCount > 99 ? '99+' : cartStore.itemCount }}
      </span>
    </Transition>
    
    <!-- Optional: Show total price on larger screens -->
    <span
      v-if="cartStore.cart && cartStore.itemCount > 0"
      class="cart-total"
    >
      {{ cartStore.formattedTotal }}
    </span>
  </NuxtLink>
</template>

<style scoped>
.cart-counter {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: var(--color-text-secondary, #6b7280);
  text-decoration: none;
  transition: color 0.2s ease;
  border-radius: 0.5rem;
}

.cart-counter:hover,
.cart-counter.has-items {
  color: var(--color-text-primary, #111827);
}

.cart-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
  color: white;
  background: var(--color-primary, #4f46e5);
  border-radius: 9999px;
  transform: translate(25%, -25%);
}

.cart-total {
  display: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary, #111827);
}

@media (min-width: 768px) {
  .cart-total {
    display: inline;
  }
}

/* Badge animation */
.badge-enter-active,
.badge-leave-active {
  transition: all 0.3s ease;
}

.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: translate(25%, -25%) scale(0);
}

.badge-enter-to,
.badge-leave-from {
  opacity: 1;
  transform: translate(25%, -25%) scale(1);
}
</style>

