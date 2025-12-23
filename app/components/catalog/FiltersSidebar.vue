<script setup lang="ts">
/**
 * Filters sidebar for catalog - Tailwind template design
 */
import { X } from 'lucide-vue-next'
import type { CatalogFilters, ProductFilter } from '~/types'

interface Props {
  filters: CatalogFilters
  activeFilters: ProductFilter
  loading?: boolean
  mobileOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobileOnly: false,
})

const emit = defineEmits<{
  'update:filters': [filters: ProductFilter]
  'reset': []
}>()

const isMobileOpen = ref(false)

// Disclosure states for collapsible sections
const expandedSections = ref<Record<string, boolean>>({
  color: false,
  category: false,
  size: false,
})

// Helper to map attribute codes to section keys
function getSectionKey(code: string): string {
  const lowerCode = code.toLowerCase()
  if (lowerCode.includes('color') || lowerCode.includes('colour')) return 'color'
  if (lowerCode.includes('size')) return 'size'
  if (lowerCode.includes('category') || lowerCode.includes('cat')) return 'category'
  return code
}

// Initialize expanded sections
onMounted(() => {
  // Check if any filters are active to expand relevant sections
  if (props.activeFilters.filters) {
    if (props.activeFilters.filters.brands) {
      expandedSections.value.category = true
    }
    if (props.activeFilters.filters.attributes) {
      // Expand sections that have active attributes
      props.filters.attributes?.forEach(attr => {
        const sectionKey = getSectionKey(attr.code)
        expandedSections.value[sectionKey] = true
      })
    }
  }
})

// Local filter state
const priceMin = ref<number | undefined>(
  props.activeFilters.filters?.price_min !== undefined 
    ? Number(props.activeFilters.filters.price_min) 
    : undefined
)
const priceMax = ref<number | undefined>(
  props.activeFilters.filters?.price_max !== undefined 
    ? Number(props.activeFilters.filters.price_max) 
    : undefined
)
const selectedCategories = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const selectedAttributes = ref<Record<string, string[]>>({})

// Initialize filters from activeFilters
function initializeFilters() {
  if (props.activeFilters.filters?.categories) {
    selectedCategories.value = props.activeFilters.filters.categories.split(',')
  } else {
    selectedCategories.value = []
  }
  
  if (props.activeFilters.filters?.brands) {
    selectedBrands.value = props.activeFilters.filters.brands.split(',')
  } else {
    selectedBrands.value = []
  }
  
  selectedAttributes.value = {}
  if (props.activeFilters.filters?.attributes && props.filters.attributes) {
    props.activeFilters.filters.attributes.forEach((attrGroup, index) => {
      const attrGroupDef = props.filters.attributes?.[index]
      if (attrGroupDef) {
        selectedAttributes.value[attrGroupDef.code] = attrGroup.split(',')
      }
    })
  }
}

initializeFilters()

watch(() => props.activeFilters, (newFilters) => {
  priceMin.value = newFilters.filters?.price_min !== undefined 
    ? Number(newFilters.filters.price_min) 
    : undefined
  priceMax.value = newFilters.filters?.price_max !== undefined 
    ? Number(newFilters.filters.price_max) 
    : undefined
  initializeFilters()
}, { deep: true })

function toggleCategory(categoryId: string) {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value.push(categoryId)
  } else {
    selectedCategories.value.splice(index, 1)
  }
  applyFilters()
}

function isCategorySelected(categoryId: string): boolean {
  return selectedCategories.value.includes(categoryId)
}

function toggleBrand(brandId: string) {
  const index = selectedBrands.value.indexOf(brandId)
  if (index === -1) {
    selectedBrands.value.push(brandId)
  } else {
    selectedBrands.value.splice(index, 1)
  }
  applyFilters()
}

function isBrandSelected(brandId: string): boolean {
  return selectedBrands.value.includes(brandId)
}

function toggleAttribute(code: string, value: string) {
  if (!selectedAttributes.value[code]) {
    selectedAttributes.value[code] = []
  }
  
  const index = selectedAttributes.value[code].indexOf(value)
  if (index === -1) {
    selectedAttributes.value[code].push(value)
  } else {
    selectedAttributes.value[code].splice(index, 1)
  }
  
  applyFilters()
}

function isAttributeSelected(code: string, value: string): boolean {
  return selectedAttributes.value[code]?.includes(value) || false
}

function applyFilters() {
  const filterData: Record<string, string | number | string[]> = {}
  let hasFilters = false
  
  if (selectedCategories.value.length > 0) {
    filterData.categories = selectedCategories.value.join(',')
    hasFilters = true
  }
  
  if (selectedBrands.value.length > 0) {
    filterData.brands = selectedBrands.value.join(',')
    hasFilters = true
  }
  
  if (priceMin.value !== undefined) {
    filterData.price_min = priceMin.value
    hasFilters = true
  }
  if (priceMax.value !== undefined) {
    filterData.price_max = priceMax.value
    hasFilters = true
  }
  
  const attributeArray: string[] = []
  if (props.filters.attributes) {
    props.filters.attributes.forEach((attrGroup) => {
      const selectedValues = selectedAttributes.value[attrGroup.code]
      if (selectedValues && selectedValues.length > 0) {
        attributeArray.push(selectedValues.join(','))
      }
    })
  }
  if (attributeArray.length > 0) {
    filterData.attributes = attributeArray
    hasFilters = true
  }
  
  const filters: ProductFilter = hasFilters ? { filters: filterData } : {}
  emit('update:filters', filters)
}

function resetFilters() {
  priceMin.value = undefined
  priceMax.value = undefined
  selectedCategories.value = []
  selectedBrands.value = []
  selectedAttributes.value = {}
  emit('reset')
}

function toggleSection(section: string) {
  expandedSections.value[section] = !expandedSections.value[section]
}

// Render filter content (shared between mobile and desktop)
function renderFilterContent() {
  return null // Will be rendered in template
}
</script>

<template>
  <div>
    <!-- Mobile filter button - only show if mobileOnly -->
    <ClientOnly v-if="mobileOnly">
      <button
        type="button"
        class="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
        @click="isMobileOpen = true"
      >
        <span class="sr-only">Filters</span>
        <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" class="size-5">
          <path d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd" fill-rule="evenodd" />
        </svg>
      </button>
    </ClientOnly>

    <!-- Mobile filter dialog - only show if mobileOnly -->
    <ClientOnly v-if="mobileOnly">
      <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-linear"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-linear"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMobileOpen"
          class="fixed inset-0 z-50 lg:hidden"
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/25" @click="isMobileOpen = false" />

          <!-- Panel -->
          <div class="fixed inset-0 flex">
            <div class="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl transition duration-300 ease-in-out">
              <div class="flex items-center justify-between px-4">
                <h2 class="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  class="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  @click="isMobileOpen = false"
                >
                  <span class="absolute -inset-0.5" />
                  <span class="sr-only">Close menu</span>
                  <X class="size-6" />
                </button>
              </div>

              <!-- Filters -->
              <form class="mt-4 border-t border-gray-200">
                <!-- Categories (simple list) -->
                <h3 v-if="filters.categories && filters.categories.length > 0" class="sr-only">Categories</h3>
                <ul v-if="filters.categories && filters.categories.length > 0" role="list" class="px-2 py-3 font-medium text-gray-900">
                  <li v-for="category in filters.categories" :key="category.value">
                    <label class="block px-2 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="isCategorySelected(category.value)"
                        class="mr-2"
                        @change="toggleCategory(category.value)"
                      >
                      {{ category.label }}
                      <span v-if="category.count" class="text-gray-400 ml-1">({{ category.count }})</span>
                    </label>
                  </li>
                </ul>

                <!-- Attribute filters -->
                <template v-if="filters.attributes && filters.attributes.length > 0">
                  <div
                    v-for="group in filters.attributes"
                    :key="group.code"
                    class="border-t border-gray-200 px-4 py-6"
                  >
                    <h3 class="-mx-2 -my-3 flow-root">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500"
                        @click="toggleSection(getSectionKey(group.code))"
                      >
                        <span class="font-medium text-gray-900">{{ group.name }}</span>
                        <span class="ml-6 flex items-center">
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            data-slot="icon"
                            aria-hidden="true"
                            class="size-5"
                            :class="expandedSections[getSectionKey(group.code)] ? 'hidden' : 'block'"
                          >
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                          </svg>
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            data-slot="icon"
                            aria-hidden="true"
                            class="size-5"
                            :class="expandedSections[getSectionKey(group.code)] ? 'block' : 'hidden'"
                          >
                            <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd" fill-rule="evenodd" />
                          </svg>
                        </span>
                      </button>
                    </h3>
                    <div
                      v-if="expandedSections[getSectionKey(group.code)]"
                      class="block pt-6"
                    >
                      <div class="space-y-6">
                        <div
                          v-for="option in group.options"
                          :key="option.value"
                          class="flex gap-3"
                        >
                          <UiCheckbox
                            :id="`filter-mobile-${group.code}-${option.value}`"
                            :model-value="isAttributeSelected(group.code, option.value)"
                            :name="`${group.code}[]`"
                            :value="option.value"
                            @update:model-value="toggleAttribute(group.code, option.value)"
                          />
                          <label
                            :for="`filter-mobile-${group.code}-${option.value}`"
                            class="min-w-0 flex-1 text-gray-500"
                          >
                            {{ option.label }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Brands as collapsible section -->
                <div v-if="filters.brands && filters.brands.length > 0" class="border-t border-gray-200 px-4 py-6">
                  <h3 class="-mx-2 -my-3 flow-root">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500"
                      @click="toggleSection('brand')"
                    >
                      <span class="font-medium text-gray-900">Brand</span>
                      <span class="ml-6 flex items-center">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          data-slot="icon"
                          aria-hidden="true"
                          class="size-5"
                          :class="expandedSections.brand ? 'hidden' : 'block'"
                        >
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          data-slot="icon"
                          aria-hidden="true"
                          class="size-5"
                          :class="expandedSections.brand ? 'block' : 'hidden'"
                        >
                          <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd" fill-rule="evenodd" />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div v-if="expandedSections.brand" class="block pt-6">
                    <div class="space-y-6">
                      <div
                        v-for="brand in filters.brands"
                        :key="brand.value"
                        class="flex gap-3"
                      >
                        <UiCheckbox
                          :id="`filter-mobile-brand-${brand.value}`"
                          :model-value="isBrandSelected(brand.value)"
                          name="brand[]"
                          :value="brand.value"
                          @update:model-value="toggleBrand(brand.value)"
                        />
                        <label
                          :for="`filter-mobile-brand-${brand.value}`"
                          class="min-w-0 flex-1 text-gray-500"
                        >
                          {{ brand.label }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Desktop sidebar -->
    <form v-if="!mobileOnly" class="hidden lg:block">
      <!-- Categories (simple list) -->
      <h3 v-if="filters.categories && filters.categories.length > 0" class="sr-only">Categories</h3>
      <ul
        v-if="filters.categories && filters.categories.length > 0"
        role="list"
        class="space-y-4 border-b border-gray-200 pb-6 text-sm font-medium text-gray-900"
      >
        <li v-for="category in filters.categories" :key="category.value">
          <label class="cursor-pointer">
            <input
              type="checkbox"
              :checked="isCategorySelected(category.value)"
              class="mr-2"
              @change="toggleCategory(category.value)"
            >
            {{ category.label }}
            <span v-if="category.count" class="text-gray-400 ml-1">({{ category.count }})</span>
          </label>
        </li>
      </ul>

      <!-- Attribute filters -->
      <template v-if="filters.attributes && filters.attributes.length > 0">
        <div
          v-for="group in filters.attributes"
          :key="group.code"
          class="border-b border-gray-200 py-6"
        >
          <h3 class="-my-3 flow-root">
            <button
              type="button"
              class="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500"
              @click="toggleSection(getSectionKey(group.code))"
            >
              <span class="font-medium text-gray-900">{{ group.name }}</span>
              <span class="ml-6 flex items-center">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  data-slot="icon"
                  aria-hidden="true"
                  class="size-5"
                  :class="expandedSections[getSectionKey(group.code)] ? 'hidden' : 'block'"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  data-slot="icon"
                  aria-hidden="true"
                  class="size-5"
                  :class="expandedSections[getSectionKey(group.code)] ? 'block' : 'hidden'"
                >
                  <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
              </span>
            </button>
          </h3>
          <div
            v-if="expandedSections[getSectionKey(group.code)]"
            class="block pt-6"
          >
            <div class="space-y-4">
              <div
                v-for="option in group.options"
                :key="option.value"
                class="flex gap-3"
              >
                <UiCheckbox
                  :id="`filter-${group.code}-${option.value}`"
                  :model-value="isAttributeSelected(group.code, option.value)"
                  :name="`${group.code}[]`"
                  :value="option.value"
                  @update:model-value="toggleAttribute(group.code, option.value)"
                />
                <label
                  :for="`filter-${group.code}-${option.value}`"
                  class="text-sm text-gray-600"
                >
                  {{ option.label }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Brands as collapsible section -->
      <div v-if="filters.brands && filters.brands.length > 0" class="border-b border-gray-200 py-6">
        <h3 class="-my-3 flow-root">
          <button
            type="button"
            class="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500"
            @click="toggleSection('brand')"
          >
            <span class="font-medium text-gray-900">Brand</span>
            <span class="ml-6 flex items-center">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                data-slot="icon"
                aria-hidden="true"
                class="size-5"
                :class="expandedSections.brand ? 'hidden' : 'block'"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                data-slot="icon"
                aria-hidden="true"
                class="size-5"
                :class="expandedSections.brand ? 'block' : 'hidden'"
              >
                <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clip-rule="evenodd" fill-rule="evenodd" />
              </svg>
            </span>
          </button>
        </h3>
        <div v-if="expandedSections.brand" class="block pt-6">
          <div class="space-y-4">
            <div
              v-for="brand in filters.brands"
              :key="brand.value"
              class="flex gap-3"
            >
              <UiCheckbox
                :id="`filter-brand-${brand.value}`"
                :model-value="isBrandSelected(brand.value)"
                name="brand[]"
                :value="brand.value"
                @update:model-value="toggleBrand(brand.value)"
              />
              <label
                :for="`filter-brand-${brand.value}`"
                class="text-sm text-gray-600"
              >
                {{ brand.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
