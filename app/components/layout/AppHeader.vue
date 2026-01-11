<script setup lang="ts">
/**
 * Main application header with navigation - Tailwind template design
 * Uses mega menu from API endpoint /api/v1/site/menus/tree
 */
import { 
  Menu,
  Search,
  X,
  Loader2,
  Heart,
  GitCompare,
  User,
  ShoppingCart,
  LogOut,
} from 'lucide-vue-next'
import { useCartStore } from '~/stores/cart.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCatalogStore } from '~/stores/catalog.store'
import { useFavoritesStore } from '~/stores/favorites.store'
import { useComparisonStore } from '~/stores/comparison.store'
import { useSystemStore } from '~/stores/system.store'
import type { MenuItem, MenuTreeResponse, ProductListItem } from '~/types'
import { useApi } from '~/composables/useApi'
import { getImageUrl } from '~/utils/image'
import { makeLocalePath } from '~/utils/locale-link'

// Type for LiveSearch component instance
interface LiveSearchInstance {
  searchResults: { data: { variants?: ProductListItem[]; suggestions?: Array<{ text: string; score: number }>; categories?: Array<{ id: number; title: string; count: number }>; brands?: Array<{ id: number; title: string; count: number }> } } | null
  isLoading: boolean
  searchQuery: string
  isOpen: boolean
  handleSelect: (index: number) => void
  getProductImage: (product: ProductListItem) => string | undefined
}

const isMobileMenuOpen = ref(false)
const isMobileSearchOpen = ref(false)
const isCatalogMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const activeMenuId = ref<number | null>(null)
const menuItems = ref<MenuItem[]>([])
const isLoadingMenu = ref(false)
const mobileSearchRef = ref<LiveSearchInstance | null>(null)

// Get search data from mobile search component
const mobileSearchResults = computed(() => mobileSearchRef.value?.searchResults || null)
const mobileSearchLoading = computed(() => mobileSearchRef.value?.isLoading || false)
const mobileSearchQuery = computed(() => mobileSearchRef.value?.searchQuery || '')
const handleMobileSearchSelect = computed(() => mobileSearchRef.value?.handleSelect || (() => {}))

// Helper function to get product image
function getMobileProductImage(product: ProductListItem): string | undefined {
  return getImageUrl(product?.image) || product?.images?.[0]?.url
}

// Helper to calculate index for mobile search
function getMobileSearchIndex(variantsCount: number, suggestionsCount: number, categoriesCount: number, index: number | string, type: 'variant' | 'suggestion' | 'category' | 'brand'): number {
  const idx = typeof index === 'string' ? parseInt(index, 10) : index
  if (type === 'variant') return idx
  if (type === 'suggestion') return variantsCount + idx
  if (type === 'category') return variantsCount + suggestionsCount + idx
  return variantsCount + suggestionsCount + categoriesCount + idx
}

// Access stores inside computed properties (lazy evaluation)
const cartItemCount = computed(() => {
  try {
    return useCartStore().itemCount
  } catch {
    return 0
  }
})

const favoritesCount = computed(() => {
  try {
    return useFavoritesStore().count
  } catch {
    return 0
  }
})

const comparisonCount = computed(() => {
  try {
    return useComparisonStore().count
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

const userName = computed(() => {
  try {
    return useAuthStore().userName
  } catch {
    return null
  }
})

const userEmail = computed(() => {
  try {
    return useAuthStore().userEmail
  } catch {
    return null
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


// Locale-aware navigation
const localePath = useLocalePath()
const router = useRouter()

// Logout handler
const isLoggingOut = ref(false)

async function handleLogout() {
  if (isLoggingOut.value) return
  
  isLoggingOut.value = true
  isUserMenuOpen.value = false
  try {
    const authStore = useAuthStore()
    await authStore.logout()
    await router.push(localePath('/'))
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    isLoggingOut.value = false
  }
}

function handleSearchSelect(query: string) {
  navigateTo({
    path: localePath('/categories'),
    query: { q: query },
  })
  // Close mobile search after selection
  isMobileSearchOpen.value = false
}

function openMobileSearch() {
  isMobileSearchOpen.value = true
}

// Focus search input when mobile search opens and manage body scroll
watch(isMobileSearchOpen, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    
    if (isOpen) {
      nextTick(() => {
        // Find input in the search component after animation
        setTimeout(() => {
          const searchPanel = document.querySelector('.fixed.inset-x-0.top-0.z-50.bg-white')
          if (searchPanel) {
            const input = searchPanel.querySelector('input[type="search"]') as HTMLInputElement
            if (input) {
              input.focus()
            }
          }
        }, 250)
      })
    }
  }
})

function closeMobileSearch() {
  isMobileSearchOpen.value = false
}

function openCatalogMenuForItem(menuId: number) {
  activeMenuId.value = menuId
  isCatalogMenuOpen.value = true
}

function closeCatalogMenu() {
  isCatalogMenuOpen.value = false
  // Delay clearing activeMenuId to allow smooth transition
  setTimeout(() => {
    if (!isCatalogMenuOpen.value) {
      activeMenuId.value = null
    }
  }, 150)
}

function getActiveMenuItem(): MenuItem | undefined {
  if (!activeMenuId.value) return undefined
  return menuItems.value.find(m => m.id === activeMenuId.value)
}

// Close menu on click outside
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-catalog-menu]')) {
        closeCatalogMenu()
      }
      if (!target.closest('[data-user-menu]')) {
        isUserMenuOpen.value = false
      }
    })
  }
})

// Fetch menu tree from API
async function fetchMenuTree() {
  if (isLoadingMenu.value) return
  
  try {
    isLoadingMenu.value = true
    const api = useApi()
    const response = await api.get<MenuTreeResponse>('/site/menus/tree')
    
    // Handle response - check if it's wrapped in 'data' or direct array
    if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        menuItems.value = response.data
      } else if (Array.isArray(response)) {
        menuItems.value = response
      } else {
        console.warn('Unexpected menu tree response format:', response)
        menuItems.value = []
      }
    } else {
      menuItems.value = []
    }
  } catch (error) {
    console.error('Failed to fetch menu tree:', error)
    menuItems.value = []
  } finally {
    isLoadingMenu.value = false
  }
}

// Get current locale from system store for watching
const systemStore = computed(() => {
  try {
    return useSystemStore()
  } catch {
    return null
  }
})

const currentLocale = computed(() => {
  return systemStore.value?.currentLocale || 'ru'
})

// Watch for locale changes and re-fetch menu
watch(currentLocale, async (newLocale, oldLocale) => {
  // Only re-fetch if locale actually changed and we're not on initial mount
  if (newLocale !== oldLocale && oldLocale !== undefined) {
    await fetchMenuTree()
  }
})

// Fetch categories and menu on mount
onMounted(async () => {
  try {
    const catalogStore = useCatalogStore()
    if (catalogStore.categories.length === 0) {
      await catalogStore.fetchCategories()
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
  
  // Fetch menu tree
  await fetchMenuTree()
})
</script>

<template>
  <div class="bg-white">
    <!-- Top bar with blog link, language and currency switchers -->
    <div class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-10 items-center justify-end gap-6">
          <!-- Blog Link -->
          <NuxtLink
            :to="localePath('/blog')"
            class="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Blog
          </NuxtLink>
          
          <!-- Language Switcher -->
          <UiLanguageSwitcher />
          
          <!-- Currency Switcher -->
          <UiCurrencySwitcher />
        </div>
      </div>
    </div>

    <header class="relative bg-white">
      <nav aria-label="Top" class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="border-b border-gray-200">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center flex-shrink-0 min-w-0">
              <!-- Mobile menu button -->
              <button
                type="button"
                class="relative rounded-md bg-white p-2 text-gray-400 lg:hidden flex-shrink-0"
                @click="isMobileMenuOpen = true"
              >
                <span class="absolute -inset-0.5" />
                <span class="sr-only">Open menu</span>
                <Menu class="size-6" />
              </button>

              <!-- Logo -->
              <div class="ml-2 sm:ml-4 flex lg:ml-0 flex-shrink-0">
                <NuxtLink :to="localePath('/')">
                  <span class="sr-only">Your Company</span>
                  <span class="text-xl sm:text-2xl font-bold text-indigo-600 whitespace-nowrap">Nexora</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Desktop Navigation with Mega Menus -->
            <div class="hidden lg:ml-8 lg:block lg:self-stretch lg:flex-shrink-0">
              <div class="flex h-full space-x-8">
                <!-- First-level menu items as header links -->
                <template v-for="menuItem in menuItems" :key="menuItem.id">
                  <div
                    class="group/menu-item relative flex"
                    data-catalog-menu
                    :data-menu-id="menuItem.id"
                    @mouseenter="() => openCatalogMenuForItem(menuItem.id)"
                    @mouseleave="closeCatalogMenu"
                  >
                    <NuxtLink
                      :to="makeLocalePath(menuItem.link, localePath)"
                      :target="menuItem.target"
                      class="relative flex items-center justify-center text-sm font-medium transition-colors duration-200 ease-out"
                      :class="activeMenuId === menuItem.id ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-800'"
                    >
                      {{ menuItem.title }}
                      <span
                        aria-hidden="true"
                        class="absolute inset-x-0 -bottom-px z-30 h-0.5 bg-transparent duration-200 ease-in"
                        :class="activeMenuId === menuItem.id ? 'bg-indigo-600' : ''"
                      />
                    </NuxtLink>
                  </div>
                </template>

              </div>
            </div>
            
            <!-- Mega Menu Component - positioned relative to nav container -->
            <div
              v-if="menuItems.length > 0 && isCatalogMenuOpen && activeMenuId && getActiveMenuItem()?.children && getActiveMenuItem()!.children.length > 0"
              class="absolute left-0 right-0 top-full z-50 hidden lg:block"
              @mouseenter="() => openCatalogMenuForItem(activeMenuId!)"
              @mouseleave="closeCatalogMenu"
            >
              <LayoutMegaMenu
                :menu-items="menuItems"
                :active-menu-id="activeMenuId!"
                :is-open="isCatalogMenuOpen"
                @close="closeCatalogMenu"
              />
            </div>

            <!-- Right side icons -->
            <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <!-- Search Icon -->
              <button
                type="button"
                class="-m-2 flex items-center p-2 text-gray-400 hover:text-gray-500"
                @click="openMobileSearch"
              >
                <span class="sr-only">Search</span>
                <Search class="size-6" />
              </button>

              <!-- Favorites -->
              <NuxtLink :to="localePath('/favorites')" class="group -m-2 flex items-center p-2">
                <Heart
                  class="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                  :class="{ 'fill-current': favoritesCount > 0 }"
                />
                <span class="sr-only">favorites, view wishlist</span>
              </NuxtLink>

              <!-- Comparison -->
              <NuxtLink :to="localePath('/comparison')" class="group -m-2 flex items-center p-2">
                <GitCompare
                  class="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                  :class="{ 'fill-current': comparisonCount > 0 }"
                />
                <span class="sr-only">comparison, view comparison</span>
              </NuxtLink>

              <!-- Cart -->
              <NuxtLink :to="localePath('/cart')" class="group -m-2 flex items-center p-2 relative">
                <ShoppingCart class="size-6 shrink-0 text-gray-400 group-hover:text-gray-500" />
                <span v-if="cartItemCount > 0" class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                  {{ cartItemCount > 99 ? '99+' : cartItemCount }}
                </span>
                <span class="sr-only">items in cart, view bag</span>
              </NuxtLink>

              <!-- User Menu -->
              <div class="relative" data-user-menu>
                <button
                  type="button"
                  class="group -m-2 flex items-center p-2 text-gray-400 hover:text-gray-500"
                  @click="isUserMenuOpen = !isUserMenuOpen"
                >
                  <span class="sr-only">User account</span>
                  <User class="size-6 shrink-0" />
                </button>

                <!-- Dropdown -->
                <Transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="isUserMenuOpen"
                    class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <!-- Not authenticated: Register and Login -->
                    <template v-if="!isAuthenticated">
                      <NuxtLink
                        :to="localePath('/auth/register')"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        @click="isUserMenuOpen = false"
                      >
                        Register
                      </NuxtLink>
                      <NuxtLink
                        :to="localePath('/auth/login')"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        @click="isUserMenuOpen = false"
                      >
                        Login
                      </NuxtLink>
                    </template>

                    <!-- Authenticated: User info, Profile, Logout -->
                    <template v-else>
                      <!-- User info -->
                      <div class="px-4 py-3 border-b border-gray-200">
                        <div v-if="userName" class="text-sm font-medium text-gray-900">
                          {{ userName }}
                        </div>
                        <div v-if="userEmail" class="text-sm text-gray-500 truncate">
                          {{ userEmail }}
                        </div>
                      </div>

                      <!-- Profile link -->
                      <NuxtLink
                        :to="localePath('/profile')"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        @click="isUserMenuOpen = false"
                      >
                        Profile
                      </NuxtLink>

                      <!-- Logout button -->
                      <button
                        type="button"
                        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        :disabled="isLoggingOut"
                        @click="handleLogout"
                      >
                        <LogOut class="h-4 w-4" />
                        <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
                      </button>
                    </template>
                  </div>
                </Transition>
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
      :menu-items="menuItems"
    />

    <!-- Mobile Search Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMobileSearchOpen"
          class="fixed inset-0 z-50"
        >
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-black/50"
            @click="closeMobileSearch"
          />

          <!-- Search Panel -->
          <Transition
            enter-active-class="transition-transform duration-200 ease-out"
            enter-from-class="translate-y-[-100%]"
            enter-to-class="translate-y-0"
            leave-active-class="transition-transform duration-150 ease-in"
            leave-from-class="translate-y-0"
            leave-to-class="translate-y-[-100%]"
          >
            <div
              v-if="isMobileSearchOpen"
              class="fixed inset-x-0 top-0 z-50 bg-white shadow-lg"
            >
              <!-- Header -->
              <div class="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                <button
                  type="button"
                  class="-m-2 flex items-center p-2 text-gray-400 hover:text-gray-500"
                  @click="closeMobileSearch"
                >
                  <span class="sr-only">Close search</span>
                  <X class="size-6" />
                </button>
                
                <!-- Search Input -->
                <div class="flex-1">
                  <SearchLiveSearch
                    ref="mobileSearchRef"
                    placeholder="Search products..."
                    :hide-dropdown="true"
                    @select="handleSearchSelect"
                  />
                </div>
              </div>

              <!-- Search Results / Info -->
              <div class="border-b border-gray-200 bg-gray-50 max-h-[calc(100vh-200px)] overflow-y-auto">
                <!-- Loading state -->
                <div v-if="mobileSearchLoading" class="px-4 py-8 flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin text-indigo-600" />
                  <span class="ml-3 text-sm text-gray-600">Searching...</span>
                </div>

                <!-- Search Results -->
                <div v-else-if="mobileSearchResults?.data && mobileSearchQuery.length >= 2" class="px-4 py-4 space-y-4">
                  <!-- Products -->
                  <div v-if="mobileSearchResults.data.variants && mobileSearchResults.data.variants.length > 0">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Products
                    </h4>
                    <div class="space-y-2">
                      <button
                        v-for="(variant, index) in mobileSearchResults.data.variants"
                        :key="variant.id"
                        type="button"
                        class="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors text-left"
                        @click="() => { handleMobileSearchSelect(getMobileSearchIndex(mobileSearchResults?.data?.variants?.length || 0, mobileSearchResults?.data?.suggestions?.length || 0, mobileSearchResults?.data?.categories?.length || 0, index, 'variant')); closeMobileSearch(); }"
                      >
                        <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <NuxtImg
                            v-if="getMobileProductImage(variant)"
                            :src="getMobileProductImage(variant)!"
                            :alt="variant.title"
                            class="w-full h-full object-cover"
                          />
                          <div v-else class="w-full h-full flex items-center justify-center">
                            <span class="text-xs text-gray-400">No image</span>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 line-clamp-1">
                            {{ variant.title }}
                          </div>
                          <div class="mt-1">
                            <UiPrice :price="variant.price" size="sm" />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Suggestions -->
                  <div v-if="mobileSearchResults.data.suggestions && mobileSearchResults.data.suggestions.length > 0">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Suggestions
                    </h4>
                    <div class="space-y-1">
                      <button
                        v-for="(suggestion, index) in mobileSearchResults.data.suggestions"
                        :key="index"
                        type="button"
                        class="w-full flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors text-left text-sm"
                        @click="() => { handleMobileSearchSelect(getMobileSearchIndex(mobileSearchResults?.data?.variants?.length || 0, 0, 0, index, 'suggestion')); closeMobileSearch(); }"
                      >
                        <Search class="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span class="font-medium text-gray-700">{{ suggestion.text }}</span>
                        <span class="ml-auto text-xs text-gray-400">({{ Math.round(suggestion.score * 100) }}%)</span>
                      </button>
                    </div>
                  </div>

                  <!-- Categories -->
                  <div v-if="mobileSearchResults.data.categories && mobileSearchResults.data.categories.length > 0">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Categories
                    </h4>
                    <div class="space-y-1">
                      <button
                        v-for="(category, index) in mobileSearchResults.data.categories"
                        :key="category.id"
                        type="button"
                        class="w-full p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors text-left text-sm text-gray-700"
                        @click="() => { handleMobileSearchSelect(getMobileSearchIndex(mobileSearchResults?.data?.variants?.length || 0, mobileSearchResults?.data?.suggestions?.length || 0, 0, index, 'category')); closeMobileSearch(); }"
                      >
                        {{ category.title }} <span class="text-gray-400">({{ category.count }})</span>
                      </button>
                    </div>
                  </div>

                  <!-- Brands -->
                  <div v-if="mobileSearchResults.data.brands && mobileSearchResults.data.brands.length > 0">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Brands
                    </h4>
                    <div class="space-y-1">
                      <button
                        v-for="(brand, index) in mobileSearchResults.data.brands"
                        :key="brand.id"
                        type="button"
                        class="w-full p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors text-left text-sm text-gray-700"
                        @click="() => { handleMobileSearchSelect(getMobileSearchIndex(mobileSearchResults?.data?.variants?.length || 0, mobileSearchResults?.data?.suggestions?.length || 0, mobileSearchResults?.data?.categories?.length || 0, index, 'brand')); closeMobileSearch(); }"
                      >
                        {{ brand.title }} <span class="text-gray-400">({{ brand.count }})</span>
                      </button>
                    </div>
                  </div>

                  <!-- No results -->
                  <div v-if="!mobileSearchResults.data.variants?.length && !mobileSearchResults.data.suggestions?.length && !mobileSearchResults.data.categories?.length && !mobileSearchResults.data.brands?.length" class="py-8 text-center">
                    <p class="text-sm text-gray-500">No results found</p>
                  </div>
                </div>

                <!-- Initial Info (when no search query) -->
                <div v-else class="px-4 py-4">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <Search class="size-5 text-indigo-600" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-gray-900">
                        Search Products
                      </h3>
                      <p class="mt-1 text-sm text-gray-600">
                        Find products by name, brand, or category. Start typing to see suggestions.
                      </p>
                      <div class="mt-3 flex flex-wrap gap-2">
                        <span class="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                          Quick search
                        </span>
                        <span class="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                          Autocomplete
                        </span>
                        <span class="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                          Categories
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
