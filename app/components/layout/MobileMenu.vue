<script setup lang="ts">
/**
 * Mobile navigation menu - Tailwind template design with tabs
 */
import { X } from 'lucide-vue-next'
import type { Category } from '~/types'
import { getImageUrl } from '~/utils/image'
import { useSystemStore } from '~/stores/system.store'

interface Props {
  modelValue: boolean
  categories: Category[]
  categoryTabs?: Category[]
}

const props = withDefaults(defineProps<Props>(), {
  categoryTabs: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref(0)

function closeMenu() {
  isOpen.value = false
}

// Get categories for active tab
const activeTabCategories = computed(() => {
  if (props.categoryTabs.length === 0) return props.categories
  const activeCategory = props.categoryTabs[activeTab.value]
  if (!activeCategory) return props.categories
  
  // Get children of active category
  return props.categories.filter(c => c.parent_id === activeCategory.id)
})

// Get featured categories (first 2 children with images)
const featuredCategories = computed(() => {
  if (props.categoryTabs.length === 0) return []
  const activeCategory = props.categoryTabs[activeTab.value]
  if (!activeCategory) return []
  
  return props.categories
    .filter(c => c.parent_id === activeCategory.id && getImageUrl(c.image || c.icon))
    .slice(0, 2)
})

// Reset active tab when menu opens
watch(isOpen, (value) => {
  if (value) {
    activeTab.value = 0
  }
  if (import.meta.client) {
    document.body.style.overflow = value ? 'hidden' : ''
  }
})

// Helper to get category image
function getCategoryImage(category: Category) {
  return getImageUrl(category.image) || getImageUrl(category.icon)
}

// Get current currency
const currentCurrency = computed(() => {
  try {
    return useSystemStore().currentCurrencyObject || { code: 'USD', symbol: '$', name: 'US Dollar' }
  } catch {
    return { code: 'USD', symbol: '$', name: 'US Dollar' }
  }
})
</script>

<template>
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
        v-if="isOpen"
        class="fixed inset-0 z-50 lg:hidden"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/25"
          @click="closeMenu"
        />

        <!-- Menu panel -->
        <div class="fixed inset-0 flex focus:outline-none">
          <Transition
            enter-active-class="transition duration-300 ease-in-out transform"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition duration-300 ease-in-out transform"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
          >
            <div
              v-if="isOpen"
              class="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl"
            >
              <!-- Header -->
              <div class="flex px-4 pt-5 pb-2">
                <button
                  type="button"
                  class="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                  @click="closeMenu"
                >
                  <span class="absolute -inset-0.5" />
                  <span class="sr-only">Close menu</span>
                  <X class="size-6" />
                </button>
              </div>

              <!-- Tabs -->
              <div v-if="categoryTabs.length > 0" class="mt-2 block">
                <div class="border-b border-gray-200">
                  <div class="-mb-px flex space-x-8 px-4">
                    <button
                      v-for="(tab, index) in categoryTabs"
                      :key="tab.id"
                      type="button"
                      class="flex-1 border-b-2 border-transparent px-1 py-4 text-base font-medium whitespace-nowrap"
                      :class="activeTab === index ? 'border-indigo-600 text-indigo-600' : 'text-gray-900'"
                      @click="activeTab = index"
                    >
                      {{ tab.title || tab.name }}
                    </button>
                  </div>
                </div>

                <!-- Tab panels -->
                <div class="space-y-10 px-4 pt-10 pb-8">
                  <!-- Featured categories with images -->
                  <div v-if="featuredCategories.length > 0" class="grid grid-cols-2 gap-x-4">
                    <div
                      v-for="category in featuredCategories"
                      :key="category.id"
                      class="group relative text-sm"
                    >
                      <NuxtImg
                        v-if="getCategoryImage(category)"
                        :src="getCategoryImage(category)"
                        :alt="category.title || category.name || 'Category'"
                        class="aspect-square w-full rounded-lg bg-gray-100 object-cover group-hover:opacity-75"
                      />
                      <NuxtLink
                        :to="`/catalog/${category.slug}`"
                        class="mt-6 block font-medium text-gray-900"
                        @click="closeMenu"
                      >
                        <span aria-hidden="true" class="absolute inset-0 z-10" />
                        {{ category.title || category.name }}
                      </NuxtLink>
                      <p aria-hidden="true" class="mt-1">Shop now</p>
                    </div>
                  </div>

                  <!-- Category list -->
                  <div v-if="activeTabCategories.length > 0">
                    <p class="font-medium text-gray-900">Categories</p>
                    <ul role="list" class="mt-6 flex flex-col space-y-6">
                      <li
                        v-for="category in activeTabCategories"
                        :key="category.id"
                        class="flow-root"
                      >
                        <NuxtLink
                          :to="`/catalog/${category.slug}`"
                          class="-m-2 block p-2 text-gray-500"
                          @click="closeMenu"
                        >
                          {{ category.title || category.name }}
                        </NuxtLink>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Fallback: no tabs, show all categories -->
              <div v-else class="mt-2 space-y-10 px-4 pt-10 pb-8">
                <div>
                  <p class="font-medium text-gray-900">Categories</p>
                  <ul role="list" class="mt-6 flex flex-col space-y-6">
                    <li
                      v-for="category in categories"
                      :key="category.id"
                      class="flow-root"
                    >
                      <NuxtLink
                        :to="`/catalog/${category.slug}`"
                        class="-m-2 block p-2 text-gray-500"
                        @click="closeMenu"
                      >
                        {{ category.title || category.name }}
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Additional links -->
              <div class="space-y-6 border-t border-gray-200 px-4 py-6">
                <div class="flow-root">
                  <NuxtLink
                    to="/catalog"
                    class="-m-2 block p-2 font-medium text-gray-900"
                    @click="closeMenu"
                  >
                    All Products
                  </NuxtLink>
                </div>
                <div class="flow-root">
                  <NuxtLink
                    to="/blog"
                    class="-m-2 block p-2 font-medium text-gray-900"
                    @click="closeMenu"
                  >
                    Blog
                  </NuxtLink>
                </div>
              </div>

              <!-- Auth links -->
              <div class="space-y-6 border-t border-gray-200 px-4 py-6">
                <div class="flow-root">
                  <NuxtLink
                    to="/auth/login"
                    class="-m-2 block p-2 font-medium text-gray-900"
                    @click="closeMenu"
                  >
                    Sign in
                  </NuxtLink>
                </div>
                <div class="flow-root">
                  <NuxtLink
                    to="/auth/register"
                    class="-m-2 block p-2 font-medium text-gray-900"
                    @click="closeMenu"
                  >
                    Create account
                  </NuxtLink>
                </div>
              </div>

              <!-- Currency -->
              <div class="border-t border-gray-200 px-4 py-6">
                <button
                  type="button"
                  class="-m-2 flex items-center p-2"
                >
                  <span class="block text-base font-medium text-gray-900">{{ currentCurrency.code }}</span>
                  <span class="sr-only">, change currency</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
