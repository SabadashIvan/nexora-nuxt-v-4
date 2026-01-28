<script setup lang="ts">
/**
 * Generic Variant Axis Selector
 * Renders a button list for any variant axis (e.g. material, length) not handled
 * by color swatch or size selector. Ensures all variant dimensions are selectable on the PDP.
 */
import type { Product, VariantOptions, VariantOptionAxis } from '~/types'

interface Props {
  product: Product
  variantOptions: VariantOptions
  axis: VariantOptionAxis
}

const props = defineProps<Props>()

const localePath = useLocalePath()
const router = useRouter()

const options = computed(() => {
  if (!props.variantOptions?.options) return []
  return props.variantOptions.options[props.axis.code] || []
})

const currentValue = computed(() => {
  if (!props.product.attribute_values || !props.axis) return null
  const av = props.product.attribute_values.find((a) => a.attribute.code === props.axis.code)
  return av?.code ?? av?.label ?? null
})

function isSelected(optionLabel: string, optionCode?: string) {
  const cur = currentValue.value
  if (!cur) return false
  if (optionCode && optionCode === cur) return true
  if (optionLabel.toLowerCase() === cur.toLowerCase()) return true
  return false
}

function selectOption(optionSlug: string) {
  if (!optionSlug || optionSlug === props.product.slug) return
  router.push(localePath(`/product/${optionSlug}`))
}

function prefetchVariant(slug: string) {
  if (!import.meta.client || !slug || slug === props.product.slug) return
}
</script>

<template>
  <div v-if="options.length > 0" class="space-y-3">
    <div class="text-sm font-medium text-gray-900">
      {{ axis.title }}
    </div>
    <div class="flex flex-wrap gap-2.5">
      <button
        v-for="opt in options"
        :key="opt.value_id"
        type="button"
        :disabled="!opt.is_in_stock && opt.slug !== product.slug"
        :class="[
          'inline-flex items-center justify-center rounded-md border-2 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          isSelected(opt.label)
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
            : opt.is_in_stock
              ? 'border-gray-300 bg-white text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60',
        ]"
        :title="opt.label + (opt.is_in_stock ? '' : ' (Out of Stock)')"
        @click="opt.slug && opt.is_in_stock ? selectOption(opt.slug) : null"
        @mouseenter="opt.slug ? prefetchVariant(opt.slug) : null"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
