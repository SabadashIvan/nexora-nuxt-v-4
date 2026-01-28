<script setup lang="ts">
/**
 * Product Recommendations Component
 * Displays "You may also like" section with recommended variants
 * CSR-only: loads recommendations on client mount
 */
import { useCatalogStore } from '~/stores/catalog.store'
import ProductCard from '~/components/product/ProductCard.vue'

const props = defineProps<{
  /** Variant ID to get recommendations for */
  variantId: number
  /** Optional limit for number of recommendations (default: 8) */
  limit?: number
}>()

const catalogStore = useCatalogStore()

// Computed
const recommendedVariants = computed(() => catalogStore.recommendedVariants)
const isLoading = computed(() => catalogStore.recommendationsLoading)
const hasRecommendations = computed(() => recommendedVariants.value.length > 0)

// Load recommendations on mount
onMounted(async () => {
  if (props.variantId) {
    await catalogStore.fetchRecommendedVariants(props.variantId, props.limit || 8)
  }
})

// Watch for variant changes and reload
watch(() => props.variantId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await catalogStore.fetchRecommendedVariants(newId, props.limit || 8)
  }
})
</script>

<template>
  <div v-if="hasRecommendations || isLoading" class="mt-16">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
      You may also like
    </h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
        style="height: 400px;"
      />
    </div>

    <!-- Recommendations grid -->
    <div v-else-if="hasRecommendations" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <ProductCard
        v-for="variant in recommendedVariants"
        :key="variant.id"
        :product="variant"
      />
    </div>
  </div>
</template>
