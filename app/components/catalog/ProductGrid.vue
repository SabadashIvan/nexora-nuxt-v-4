<script setup lang="ts">
/**
 * Product grid for catalog listings
 */
import type { ProductListItem } from '~/types'

interface Props {
  products: ProductListItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div>
    <h2 class="sr-only">Products</h2>

    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      <div 
        v-for="i in 8" 
        :key="i" 
        class="group animate-pulse"
      >
        <div class="aspect-square w-full rounded-lg bg-gray-200 xl:aspect-7/8" />
        <div class="mt-4 h-4 bg-gray-200 rounded w-3/4" />
        <div class="mt-1 h-6 bg-gray-200 rounded w-1/2" />
      </div>
    </div>

    <!-- Products -->
    <div v-else-if="products.length > 0" class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      title="No products found"
      description="Try adjusting your filters or search criteria"
    />
  </div>
</template>

