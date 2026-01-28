<script setup lang="ts">
/**
 * Color Swatch Selector Component
 * Displays color variants as circular swatches for selection
 */
import type { Product, VariantOptions } from '~/types'

interface Props {
  product: Product
  variantOptions?: VariantOptions
}

const props = defineProps<Props>()

const localePath = useLocalePath()
const router = useRouter()

// Extract color axis from variant options
const colorAxis = computed(() => {
  if (!props.variantOptions?.axes) return null
  return props.variantOptions.axes.find(axis => 
    axis.code.toLowerCase() === 'color' || 
    axis.title.toLowerCase().includes('color')
  )
})

// Get color options for the color axis
const colorOptions = computed(() => {
  if (!colorAxis.value || !props.variantOptions?.options) return []
  return props.variantOptions.options[colorAxis.value.code] || []
})

// Get current product's color attribute value
const currentColor = computed(() => {
  if (!props.product.attribute_values) return null
  const colorAttr = props.product.attribute_values.find(av => 
    av.attribute.code.toLowerCase() === 'color' ||
    av.attribute.title.toLowerCase().includes('color')
  )
  return colorAttr?.code || colorAttr?.label || null
})

// Check if a color option is currently selected
const isSelected = (optionLabel: string, optionCode?: string) => {
  if (!currentColor.value) return false
  // Match by code or label
  if (optionCode && optionCode === currentColor.value) return true
  if (optionLabel.toLowerCase() === currentColor.value.toLowerCase()) return true
  return false
}

// Navigate to variant when color is selected
function selectColor(optionSlug: string) {
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
  <div v-if="colorAxis && colorOptions.length > 0" class="space-y-3">
    <div class="text-sm font-medium text-gray-900">
      {{ colorAxis.title }}
    </div>
    <div class="flex flex-wrap gap-2.5">
      <button
        v-for="option in colorOptions"
        :key="option.value_id"
        type="button"
        :disabled="!option.is_in_stock && option.slug !== product.slug"
        :class="[
          'relative w-11 h-11 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          isSelected(option.label)
            ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110 shadow-sm'
            : option.is_in_stock
              ? 'border-gray-300 hover:border-gray-400 hover:scale-105'
              : 'border-gray-200 opacity-50 cursor-not-allowed',
        ]"
        :title="option.label + (option.is_in_stock ? '' : ' (Out of Stock)')"
        @click="option.slug && option.is_in_stock ? selectColor(option.slug) : null"
        @mouseenter="option.slug ? prefetchVariant(option.slug) : null"
      >
        <!-- Color swatch - try to extract color from label or use a default -->
        <span
          :class="[
            'block w-full h-full rounded-full',
            // Try to match common color names to Tailwind classes
            option.label.toLowerCase().includes('purple') ? 'bg-purple-500' :
            option.label.toLowerCase().includes('blue') ? 'bg-blue-500' :
            option.label.toLowerCase().includes('red') ? 'bg-red-500' :
            option.label.toLowerCase().includes('green') ? 'bg-green-500' :
            option.label.toLowerCase().includes('yellow') ? 'bg-yellow-500' :
            option.label.toLowerCase().includes('orange') ? 'bg-orange-500' :
            option.label.toLowerCase().includes('pink') ? 'bg-pink-500' :
            option.label.toLowerCase().includes('black') ? 'bg-black' :
            option.label.toLowerCase().includes('white') ? 'bg-white border border-gray-300' :
            'bg-gray-300'
          ]"
        />
        <!-- Selected indicator -->
        <span
          v-if="isSelected(option.label)"
          class="absolute inset-0 flex items-center justify-center"
        >
          <svg class="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>
