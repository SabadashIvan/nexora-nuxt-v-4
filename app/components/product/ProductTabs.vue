<script setup lang="ts">
/**
 * Product Tabs Component
 * Tabbed interface for Description, Specifications, Reviews, and Shipping & Returns
 */
import type { Product } from '~/types'

interface Props {
  product: Product
  productId: number
}

defineProps<Props>()

const { t } = useI18n()

// Tab state
const activeTab = ref<'description' | 'specifications' | 'reviews' | 'shipping'>('description')

// Tab definitions
const tabs = computed(() => [
  {
    id: 'description' as const,
    label: t('product.tabs.description') || 'Description',
  },
  {
    id: 'specifications' as const,
    label: t('product.tabs.specifications') || 'Specifications',
  },
  {
    id: 'reviews' as const,
    label: t('product.tabs.reviews') || 'Reviews',
  },
  {
    id: 'shipping' as const,
    label: t('product.tabs.shipping') || 'Shipping & Returns',
  },
])

function setActiveTab(tabId: typeof activeTab.value) {
  activeTab.value = tabId
}
</script>

<template>
  <div class="mt-10">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'whitespace-nowrap border-b-2 py-4 px-1 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
          @click="setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="mt-8">
      <!-- Description Tab -->
      <div v-show="activeTab === 'description'" class="space-y-6">
        <div>
          <h3 class="sr-only">Description</h3>
          <div class="space-y-6">
            <p
              v-if="product.short_description || product.product?.description"
              class="text-base text-gray-900"
            >
              {{ product.short_description || product.product?.description }}
            </p>
            <div
              v-if="product.description"
              class="prose max-w-none text-base text-gray-900"
              v-html="product.description"
            />
          </div>
        </div>

        <!-- Highlights (if available) -->
        <div
          v-if="product.product?.description && !product.short_description"
          class="mt-10"
        >
          <h3 class="text-sm font-medium text-gray-900">Highlights</h3>
          <div class="mt-4">
            <ul role="list" class="list-disc space-y-2 pl-4 text-sm">
              <li
                v-for="(highlight, index) in (product.product.description.match(/[^.!?]+[.!?]+/g) || []).slice(0, 4)"
                :key="index"
                class="text-gray-400"
              >
                <span class="text-gray-600">{{ highlight.trim() }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Details -->
        <div
          v-if="product.description || product.product?.description"
          class="mt-10"
        >
          <h2 class="text-sm font-medium text-gray-900">Details</h2>
          <div class="mt-4 space-y-6">
            <div
              v-if="product.description"
              class="prose max-w-none text-sm text-gray-600"
              v-html="product.description"
            />
            <p
              v-else-if="product.product?.description"
              class="text-sm text-gray-600"
            >
              {{ product.product.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Specifications Tab -->
      <div v-show="activeTab === 'specifications'">
        <div v-if="product.specifications?.length">
          <h2 class="text-sm font-medium text-gray-900 mb-4">Specifications</h2>
          <div class="bg-white rounded-lg overflow-hidden border border-gray-200">
            <table class="w-full">
              <tbody>
                <template
                  v-for="(spec, index) in product.specifications"
                  :key="index"
                >
                  <tr
                    v-for="item in spec.items"
                    :key="item.name"
                    class="border-b border-gray-200 last:border-0"
                  >
                    <td class="px-4 py-3 text-sm font-medium text-gray-500 w-1/3">
                      {{ item.name }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900">
                      {{ item.value }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <p class="text-gray-500">{{ t('product.tabs.noSpecifications') || 'No specifications available.' }}</p>
        </div>
      </div>

      <!-- Reviews Tab -->
      <div v-show="activeTab === 'reviews'">
        <ClientOnly>
          <ProductReviews :product-id="productId" />
        </ClientOnly>
      </div>

      <!-- Shipping & Returns Tab -->
      <div v-show="activeTab === 'shipping'">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ t('product.tabs.shippingInfo') || 'Shipping Information' }}
            </h3>
            <div class="prose max-w-none text-sm text-gray-600 space-y-4">
              <p>
                {{ t('product.tabs.shippingDescription') || 'We offer fast and reliable shipping to most locations. Shipping costs and delivery times vary based on your location and the shipping method selected at checkout.' }}
              </p>
              <ul class="list-disc pl-6 space-y-2">
                <li>
                  {{ t('product.tabs.freeShipping') || 'Free shipping on orders over $100' }}
                </li>
                <li>
                  {{ t('product.tabs.standardShipping') || 'Standard shipping: 5-7 business days' }}
                </li>
                <li>
                  {{ t('product.tabs.expressShipping') || 'Express shipping: 2-3 business days' }}
                </li>
                <li>
                  {{ t('product.tabs.trackingInfo') || 'Tracking information will be provided via email once your order ships' }}
                </li>
              </ul>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ t('product.tabs.returnsInfo') || 'Returns & Exchanges' }}
            </h3>
            <div class="prose max-w-none text-sm text-gray-600 space-y-4">
              <p>
                {{ t('product.tabs.returnsDescription') || 'We want you to be completely satisfied with your purchase. If you\'re not happy with your item, you can return it within 30 days of delivery for a full refund or exchange.' }}
              </p>
              <ul class="list-disc pl-6 space-y-2">
                <li>
                  {{ t('product.tabs.returnWindow') || '30-day return window from delivery date' }}
                </li>
                <li>
                  {{ t('product.tabs.returnCondition') || 'Items must be in original condition with tags attached' }}
                </li>
                <li>
                  {{ t('product.tabs.returnProcess') || 'Contact our support team to initiate a return' }}
                </li>
                <li>
                  {{ t('product.tabs.refundTime') || 'Refunds processed within 5-7 business days after we receive your return' }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
