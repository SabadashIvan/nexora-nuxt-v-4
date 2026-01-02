<script setup lang="ts">
/**
 * Mobile navigation menu - Shows menu items from API with icons
 */
import { X, ChevronRight, LogOut } from 'lucide-vue-next'
import type { Category, MenuItem } from '~/types'
import { getImageUrl } from '~/utils/image'
import { useSystemStore } from '~/stores/system.store'
import { useAuthStore } from '~/stores/auth.store'

interface Props {
  modelValue: boolean
  categories: Category[]
  categoryTabs?: Category[]
  menuItems?: MenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  categoryTabs: () => [],
  menuItems: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref(0)
const expandedMenuItemId = ref<number | null>(null)

function closeMenu() {
  isOpen.value = false
  expandedMenuItemId.value = null
}

function toggleMenuItem(itemId: number) {
  expandedMenuItemId.value = expandedMenuItemId.value === itemId ? null : itemId
}

// Use menu items from API if available, otherwise fallback to categories
const displayMenuItems = computed(() => {
  if (props.menuItems && props.menuItems.length > 0) {
    return props.menuItems
  }
  return []
})

// Get categories for active tab (fallback)
const activeTabCategories = computed(() => {
  if (props.categoryTabs.length === 0) return props.categories
  const activeCategory = props.categoryTabs[activeTab.value]
  if (!activeCategory) return props.categories
  
  // Get children of active category
  return props.categories.filter(c => c.parent_id === activeCategory.id)
})

// Get featured categories (first 2 children with images) - fallback
const featuredCategories = computed(() => {
  if (props.categoryTabs.length === 0) return []
  const activeCategory = props.categoryTabs[activeTab.value]
  if (!activeCategory) return []
  
  return props.categories
    .filter(c => c.parent_id === activeCategory.id && getImageUrl(c.image || c.icon))
    .slice(0, 2)
})

// Reset when menu opens
watch(isOpen, (value) => {
  if (value) {
    activeTab.value = 0
    expandedMenuItemId.value = null
  }
  if (import.meta.client) {
    document.body.style.overflow = value ? 'hidden' : ''
  }
})

// Helper to get menu item image
function getMenuItemImage(item: MenuItem) {
  return getImageUrl(item.icon)
}

// Helper to get category image (fallback)
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

// Auth state
const isAuthenticated = computed(() => {
  try {
    return useAuthStore().isAuthenticated
  } catch {
    return false
  }
})

const userName = computed(() => {
  try {
    return useAuthStore().userName
  } catch {
    return null
  }
})

// Logout handler
const router = useRouter()
const isLoggingOut = ref(false)

async function handleLogout() {
  if (isLoggingOut.value) return
  
  isLoggingOut.value = true
  try {
    const authStore = useAuthStore()
    await authStore.logout()
    closeMenu()
    await router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    isLoggingOut.value = false
  }
}
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

              <!-- Menu Items from API (Priority) -->
              <div v-if="displayMenuItems.length > 0" class="mt-2 space-y-1 px-4 pb-4">
                <div
                  v-for="item in displayMenuItems"
                  :key="item.id"
                  class="border-b border-gray-200 last:border-b-0"
                >
                  <!-- Menu Item with icon and link -->
                  <div class="flex items-center">
                    <NuxtLink
                      :to="item.link"
                      :target="item.target"
                      class="flex flex-1 items-center gap-3 py-4 text-base font-medium text-gray-900"
                      @click="closeMenu"
                    >
                      <!-- Icon if available -->
                      <NuxtImg
                        v-if="getMenuItemImage(item)"
                        :src="getMenuItemImage(item)!"
                        :alt="item.title"
                        class="size-8 shrink-0 rounded-lg bg-gray-100 object-cover"
                      />
                      <span class="flex-1">{{ item.title }}</span>
                    </NuxtLink>
                    
                    <!-- Expand button if has children -->
                    <button
                      v-if="item.children && item.children.length > 0"
                      type="button"
                      class="ml-2 flex items-center p-2 text-gray-400"
                      @click="toggleMenuItem(item.id)"
                    >
                      <ChevronRight
                        class="size-5 transition-transform"
                        :class="expandedMenuItemId === item.id ? 'rotate-90' : ''"
                      />
                    </button>
                  </div>
                  
                  <!-- Children submenu -->
                  <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 max-h-0"
                    enter-to-class="opacity-100 max-h-96"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 max-h-96"
                    leave-to-class="opacity-0 max-h-0"
                  >
                    <div
                      v-if="expandedMenuItemId === item.id && item.children && item.children.length > 0"
                      class="overflow-hidden pl-4 pb-2"
                    >
                      <ul class="space-y-2">
                        <li
                          v-for="child in item.children"
                          :key="child.id"
                        >
                          <NuxtLink
                            :to="child.link"
                            :target="child.target"
                            class="block py-2 text-sm text-gray-600"
                            @click="closeMenu"
                          >
                            {{ child.title }}
                          </NuxtLink>
                        </li>
                      </ul>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Fallback: Tabs (if no menu items) -->
              <div v-else-if="categoryTabs.length > 0" class="mt-2 block">
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
                        :to="`/categories/${category.slug}`"
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
                          :to="`/categories/${category.slug}`"
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
                        :to="`/categories/${category.slug}`"
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
                    to="/categories"
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
                <template v-if="!isAuthenticated">
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
                </template>
                <template v-else>
                  <div class="flow-root">
                    <NuxtLink
                      to="/profile"
                      class="-m-2 block p-2 font-medium text-gray-900"
                      @click="closeMenu"
                    >
                      <span v-if="userName">Profile ({{ userName }})</span>
                      <span v-else>Profile</span>
                    </NuxtLink>
                  </div>
                  <div class="flow-root">
                    <button
                      type="button"
                      :disabled="isLoggingOut"
                      @click="handleLogout"
                      class="-m-2 flex items-center gap-2 w-full p-2 font-medium text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut class="h-5 w-5" />
                      <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
                    </button>
                  </div>
                </template>
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
