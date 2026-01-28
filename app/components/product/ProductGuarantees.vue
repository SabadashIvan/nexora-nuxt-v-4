<script setup lang="ts">
/**
 * Product Guarantees/Services Section Component
 * Displays service guarantees with icons and text
 */
import { Truck, RotateCcw, Shield, HeadphonesIcon } from 'lucide-vue-next'

const { t } = useI18n()

const guarantees = computed(() => [
  {
    icon: Truck,
    title: t('product.guarantees.freeShipping') || 'Free Shipping',
    description: t('product.guarantees.freeShippingDesc') || 'Free shipping on orders over $100',
  },
  {
    icon: RotateCcw,
    title: t('product.guarantees.easyReturns') || 'Easy Returns',
    description: t('product.guarantees.easyReturnsDesc') || '30-day return policy',
  },
  {
    icon: Shield,
    title: t('product.guarantees.securePayment') || 'Secure Payment',
    description: t('product.guarantees.securePaymentDesc') || '100% secure checkout',
  },
  {
    icon: HeadphonesIcon,
    title: t('product.guarantees.support') || '24/7 Support',
    description: t('product.guarantees.supportDesc') || 'Round-the-clock customer service',
  },
])
</script>

<template>
  <div class="mt-8 pt-8 border-t border-gray-200">
    <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
      <div
        v-for="(guarantee, index) in guarantees"
        :key="index"
        class="flex flex-col items-center text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <component
            :is="guarantee.icon"
            class="h-6 w-6 text-indigo-600"
            aria-hidden="true"
          />
        </div>
        <h4 class="text-sm font-semibold text-gray-900 mb-1">
          {{ guarantee.title }}
        </h4>
        <p class="text-xs text-gray-600 leading-relaxed">
          {{ guarantee.description }}
        </p>
      </div>
    </div>
  </div>
</template>
