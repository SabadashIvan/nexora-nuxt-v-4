<script setup lang="ts">
/**
 * Size/Thickness Selector Component
 * Displays size or thickness variants as buttons for selection
 */
import type { Product, VariantOptions } from '~/types'

interface Props {
  product: Product
  variantOptions?: VariantOptions
}

const props = defineProps<Props>()

const localePath = useLocalePath()
const router = useRouter()

// Extract size/thickness axis from variant options
// Look for common size-related codes: size, thickness, dimension, etc.
const sizeAxis = computed(() => {
  if (!props.variantOptions?.axes) return null
  return props.variantOptions.axes.find(axis => {
    const code = axis.code.toLowerCase()
    const title = axis.title.toLowerCase()
    return (
      code === 'size' ||
      code === 'thickness' ||
      code === 'dimension' ||
      title.includes('size') ||
      title.includes('thickness') ||
      title.includes('dimension')
    ) && code !== 'color' // Exclude color
  })
})

// Get size options for the size axis
const sizeOptions = computed(() => {
  if (!sizeAxis.value || !props.variantOptions?.options) return []
  return props.variantOptions.options[sizeAxis.value.code] || []
})

// Get current product's size attribute value
const currentSize = computed(() => {
  if (!props.product.attribute_values || !sizeAxis.value) return null
  const sizeAttr = props.product.attribute_values.find(av => 
    av.attribute.code === sizeAxis.value?.code
  )
  return sizeAttr?.code || sizeAttr?.label || null
})

// Check if a size option is currently selected
const isSelected = (optionLabel: string, optionCode?: string) => {
  if (!currentSize.value) return false
  // Match by code or label
  if (optionCode && optionCode === currentSize.value) return true
  if (optionLabel.toLowerCase() === currentSize.value.toLowerCase()) return true
  return false
}

// Navigate to variant when size is selected
function selectSize(optionSlug: string) {
  if (!optionSlug || optionSlug === props.product.slug) return
  router.push(localePath(`/product/${optionSlug}`))
}

// Prefetch variant on hover
function prefetchVariant(slug: string) {
  if (!import.meta.client || !slug || slug === props.product.slug) return
  // Prefetch logic can be added here if needed
}
</script>

<template>
  <div v-if="sizeAxis && sizeOptions.length > 0" class="space-y-3">
    <div class="text-sm font-medium text-gray-900">
      {{ sizeAxis.title }}
    </div>
    <div class="flex flex-wrap gap-2.5">
      <button
        v-for="option in sizeOptions"
        :key="option.value_id"
        type="button"
        :disabled="!option.is_in_stock && option.slug !== product.slug"
        :class="[
          'inline-flex items-center justify-center rounded-md border-2 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          isSelected(option.label)
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
            : option.is_in_stock
              ? 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60',
        ]"
        :title="option.label + (option.is_in_stock ? '' : ' (Out of Stock)')"
        @click="option.slug && option.is_in_stock ? selectSize(option.slug) : null"
        @mouseenter="option.slug ? prefetchVariant(option.slug) : null"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
