<script setup lang="ts">
/**
 * Active filters display component
 * Shows selected filters as chips with remove buttons
 */
import type { ProductFilter, CatalogFilters } from '~/types'

interface Props {
  activeFilters: ProductFilter
  availableFilters: CatalogFilters
  excludedCategoryIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludedCategoryIds: () => [],
})

const emit = defineEmits<{
  'remove-filter': [type: string, value: string]
  'reset': []
}>()

// Build list of active filters for display
const activeFilterChips = computed(() => {
  const chips: Array<{ type: string; label: string; value: string; displayValue: string }> = []
  
  // Categories
  if (props.activeFilters.filters?.categories) {
    const categoryIds = props.activeFilters.filters.categories.split(',')
    categoryIds.forEach((id) => {
      if (props.excludedCategoryIds?.includes(id)) return
      const category = props.availableFilters.categories?.find(c => c.value === id)
      if (category) {
        chips.push({
          type: 'categories',
          label: 'Category',
          value: id,
          displayValue: category.label,
        })
      }
    })
  }
  
  // Brands
  if (props.activeFilters.filters?.brands) {
    const brandIds = props.activeFilters.filters.brands.split(',')
    brandIds.forEach((id) => {
      const brand = props.availableFilters.brands?.find(b => b.value === id)
      if (brand) {
        chips.push({
          type: 'brands',
          label: 'Brand',
          value: id,
          displayValue: brand.label,
        })
      }
    })
  }
  
  // Price range
  if (props.activeFilters.filters?.price_min !== undefined || props.activeFilters.filters?.price_max !== undefined) {
    const min = props.activeFilters.filters.price_min
    const max = props.activeFilters.filters.price_max
    let priceLabel = 'Price'
    if (min !== undefined && max !== undefined) {
      priceLabel = `Price: ${min} - ${max}`
    } else if (min !== undefined) {
      priceLabel = `Price: from ${min}`
    } else if (max !== undefined) {
      priceLabel = `Price: up to ${max}`
    }
    chips.push({
      type: 'price',
      label: 'Price',
      value: 'price',
      displayValue: priceLabel,
    })
  }
  
  // Attributes
  if (props.activeFilters.filters?.attributes && props.availableFilters.attributes) {
    props.activeFilters.filters.attributes.forEach((attrGroup, index) => {
      const attrDef = props.availableFilters.attributes?.[index]
      if (attrDef) {
        const valueIds = attrGroup.split(',')
        valueIds.forEach((valueId) => {
          const option = attrDef.options?.find(o => o.value === valueId)
          if (option) {
            chips.push({
              type: 'attributes',
              label: attrDef.name,
              value: `${attrDef.code}:${valueId}`,
              displayValue: `${attrDef.name}: ${option.label}`,
            })
          }
        })
      }
    })
  }
  
  return chips
})

function removeFilter(type: string, value: string) {
  emit('remove-filter', type, value)
}

function resetAll() {
  emit('reset')
}
</script>

<template>
  <div v-if="activeFilterChips.length > 0" class="border-b border-gray-200 pb-4 mb-6">
    <div class="flex items-center flex-wrap gap-2">
      <span class="text-sm font-medium text-gray-700">
        Вы выбрали:
      </span>
      
      <div class="flex items-center flex-wrap gap-2">
        <span
          v-for="chip in activeFilterChips"
          :key="chip.value"
          class="inline-flex items-center gap-x-1 rounded-full bg-gray-100 py-1 pl-3 pr-2 text-xs font-medium text-gray-900 hover:bg-gray-200"
        >
          {{ chip.displayValue }}
          <button
            type="button"
            class="ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:bg-gray-500 focus:text-white focus:outline-none relative z-10"
            @click.stop="removeFilter(chip.type, chip.value)"
          >
            <span class="sr-only">Remove {{ chip.displayValue }}</span>
            <svg class="h-2 w-2 pointer-events-none" stroke="currentColor" fill="none" viewBox="0 0 8 8">
              <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6l-6 6" />
            </svg>
          </button>
        </span>
      </div>
      
      <button
        type="button"
        class="ml-auto text-sm font-medium text-gray-700 hover:text-gray-900"
        @click="resetAll"
      >
        Очистить все
      </button>
    </div>
  </div>
</template>

