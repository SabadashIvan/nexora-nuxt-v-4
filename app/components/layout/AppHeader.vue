<script setup lang="ts">
/**
 * Main application header with navigation - Tailwind template design
 */
import { 
  Menu,
} from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCatalogStore } from '~/stores/catalog.store'
import { useSystemStore } from '~/stores/system.store'
import { getImageUrl } from '~/utils/image'

const isMobileMenuOpen = ref(false)
const openPopoverId = ref<string | null>(null)

// Access stores inside computed properties (lazy evaluation)
const cartItemCount = computed(() => {
  try {
    return useCartStore().itemCount
  } catch {
    return 0
  }
})

const isAuthenticated = computed(() => {
  try {
    return useAuthStore().isAuthenticated
  } catch {
    return false
  }
})

const categories = computed(() => {
  try {
    return useCatalogStore().rootCategories
  } catch {
    return []
  }
})

// Get first 2 categories for tabs (or all if less than 2)
const categoryTabs = computed(() => {
  return categories.value.slice(0, 2)
})

// Current currency
const currentCurrency = computed(() => {
  try {
    return useSystemStore().currentCurrencyObject || { code: 'USD', symbol: '$', name: 'US Dollar' }
  } catch {
    return { code: 'USD', symbol: '$', name: 'US Dollar' }
  }
})

function handleSearchSelect(query: string) {
  navigateTo({
    path: '/catalog',
    query: { q: query },
  })
}

function togglePopover(id: string) {
  openPopoverId.value = openPopoverId.value === id ? null : id
}

function closePopover() {
  openPopoverId.value = null
}

// Close popover on click outside
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-popover]')) {
        closePopover()
      }
    })
  }
})

// Fetch categories on mount
onMounted(async () => {
  try {
    const catalogStore = useCatalogStore()
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories()
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
})

// Helper to get category image
function getCategoryImage(category: any) {
  return getImageUrl(category.image) || getImageUrl(category.icon)
}

// Helper to get category children grouped
function getCategoryChildren(categoryId: number) {
  try {
    const catalogStore = useCatalogStore()
    return catalogStore.categories.filter(c => c.parent_id === categoryId)
  } catch {
    return []
  }
}
</script>

<template>
  <div class="bg-white">
    <!-- Promo banner -->
    <p class="flex h-10 items-center justify-center bg-indigo-600 px-4 text-sm font-medium text-white sm:px-6 lg:px-8">
      Get free delivery on orders over $100
    </p>

    <header class="relative bg-white">
      <nav aria-label="Top" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="border-b border-gray-200">
          <div class="flex h-16 items-center">
            <!-- Mobile menu button -->
            <button
              type="button"
              class="relative rounded-md bg-white p-2 text-gray-400 lg:hidden"
              @click="isMobileMenuOpen = true"
            >
              <span class="absolute -inset-0.5" />
              <span class="sr-only">Open menu</span>
              <Menu class="size-6" />
            </button>

            <!-- Logo -->
            <div class="ml-4 flex lg:ml-0">
              <NuxtLink to="/">
                <span class="sr-only">Your Company</span>
                <span class="text-2xl font-bold text-indigo-600">Nexora</span>
              </NuxtLink>
            </div>

            <!-- Desktop Navigation with Mega Menus -->
            <div class="hidden lg:ml-8 lg:block lg:self-stretch">
              <div class="flex h-full space-x-8">
                <!-- Category menus -->
                <div
                  v-for="(category, index) in categoryTabs"
                  :key="category.id"
                  class="group/popover flex"
                  data-popover
                >
                  <div class="relative flex">
                    <button
                      class="relative flex items-center justify-center text-sm font-medium transition-colors duration-200 ease-out"
                      :class="openPopoverId === `menu-${category.id}` ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-800'"
                      @click.stop="togglePopover(`menu-${category.id}`)"
                    >
                      {{ category.title || category.name }}
                      <span
                        aria-hidden="true"
                        class="absolute inset-x-0 -bottom-px z-30 h-0.5 bg-transparent duration-200 ease-in"
                        :class="openPopoverId === `menu-${category.id}` ? 'bg-indigo-600' : ''"
                      />
                    </button>
                  </div>

                  <!-- Mega Menu Popover -->
                  <Transition
                    enter-active-class="transition transition-discrete duration-200 ease-out"
                    enter-from-class="opacity-0"
                    enter-to-class="opacity-100"
                    leave-active-class="transition transition-discrete duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="openPopoverId === `menu-${category.id}`"
                      class="absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 bg-white text-sm text-gray-500 shadow-lg"
                      @click.stop
                    >
                      <div aria-hidden="true" class="absolute inset-0 top-1/2 bg-white shadow-sm" />
                      <div class="relative bg-white">
                        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                          <div class="grid grid-cols-2 gap-x-8 gap-y-10 py-16">
                            <!-- Category images -->
                            <div class="col-start-2 grid grid-cols-2 gap-x-8">
                              <div
                                v-for="(child, idx) in getCategoryChildren(category.id).slice(0, 2)"
                                :key="child.id"
                                class="group relative text-base sm:text-sm"
                              >
                                <NuxtImg
                                  v-if="getCategoryImage(child)"
                                  :src="getCategoryImage(child)"
                                  :alt="child.title || child.name || 'Category'"
                                  class="aspect-square w-full rounded-lg bg-gray-100 object-cover group-hover:opacity-75"
                                />
                                <NuxtLink
                                  :to="`/catalog/${child.slug}`"
                                  class="mt-6 block font-medium text-gray-900"
                                  @click="closePopover"
                                >
                                  <span aria-hidden="true" class="absolute inset-0 z-10" />
                                  {{ child.title || child.name }}
                                </NuxtLink>
                                <p aria-hidden="true" class="mt-1">Shop now</p>
                              </div>
                            </div>

                            <!-- Category links -->
                            <div class="row-start-1 grid grid-cols-3 gap-x-8 gap-y-10 text-sm">
                              <div>
                                <p :id="`${category.slug}-heading`" class="font-medium text-gray-900">
                                  Categories
                                </p>
                                <ul
                                  role="list"
                                  :aria-labelledby="`${category.slug}-heading`"
                                  class="mt-6 space-y-6 sm:mt-4 sm:space-y-4"
                                >
                                  <li
                                    v-for="child in getCategoryChildren(category.id)"
                                    :key="child.id"
                                    class="flex"
                                  >
                                    <NuxtLink
                                      :to="`/catalog/${child.slug}`"
                                      class="hover:text-gray-800"
                                      @click="closePopover"
                                    >
                                      {{ child.title || child.name }}
                                    </NuxtLink>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- All Categories link -->
                <NuxtLink
                  to="/catalog"
                  class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  All Categories
                </NuxtLink>

                <!-- Other links -->
                <NuxtLink
                  to="/blog"
                  class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Blog
                </NuxtLink>
              </div>
            </div>

            <!-- Right side actions -->
            <div class="ml-auto flex items-center">
              <!-- Auth links (desktop) -->
              <div class="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                <NuxtLink
                  v-if="!isAuthenticated"
                  to="/auth/login"
                  class="text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Sign in
                </NuxtLink>
                <span v-if="!isAuthenticated" aria-hidden="true" class="h-6 w-px bg-gray-200" />
                <NuxtLink
                  v-if="!isAuthenticated"
                  to="/auth/register"
                  class="text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Create account
                </NuxtLink>
                <NuxtLink
                  v-else
                  to="/profile"
                  class="text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Profile
                </NuxtLink>
              </div>

              <!-- Currency selector (desktop) -->
              <div class="hidden lg:ml-8 lg:flex">
                <button
                  type="button"
                  class="flex items-center text-gray-700 hover:text-gray-800"
                >
                  <span class="block text-sm font-medium">{{ currentCurrency.code }}</span>
                  <span class="sr-only">, change currency</span>
                </button>
              </div>

              <!-- Search -->
              <div class="flex lg:ml-6 w-64">
                <SearchLiveSearch
                  placeholder="Search products..."
                  @select="handleSearchSelect"
                />
              </div>

              <!-- Cart -->
              <div class="ml-4 flow-root lg:ml-6">
                <NuxtLink to="/cart" class="group -m-2 flex items-center p-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    data-slot="icon"
                    aria-hidden="true"
                    class="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                  >
                    <path
                      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                    {{ cartItemCount }}
                  </span>
                  <span class="sr-only">items in cart, view bag</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Mobile Menu -->
    <LayoutMobileMenu
      v-model="isMobileMenuOpen"
      :categories="categories"
      :category-tabs="categoryTabs"
    />
  </div>
</template>
