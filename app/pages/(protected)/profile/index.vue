<script setup lang="ts">
/**
 * Profile dashboard page
 */
import { Package, MapPin, Heart, Settings } from 'lucide-vue-next'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const authStore = shallowRef<ReturnType<typeof useAuthStore> | null>(null)
const ordersStore = shallowRef<ReturnType<typeof useOrdersStore> | null>(null)

// Locale-aware navigation
const localePath = useLocalePath()

// Load recent orders
onMounted(async () => {
  const auth = useAuthStore()
  const orders = useOrdersStore()

  authStore.value = auth
  ordersStore.value = orders

  await orders.fetchOrders(1)
})

const userName = computed(() => authStore.value?.userName ?? '')
const recentOrders = computed(() => ordersStore.value?.orders.slice(0, 3) ?? [])

const quickLinks = computed(() => [
  { icon: Package, labelKey: 'profile.index.myOrders', to: localePath('/profile/orders'), descriptionKey: 'profile.index.viewOrderHistory' },
  { icon: MapPin, labelKey: 'profile.nav.addresses', to: localePath('/profile/addresses'), descriptionKey: 'profile.index.manageAddresses' },
  { icon: Heart, labelKey: 'favorites.title', to: localePath('/favorites'), descriptionKey: 'profile.index.savedItems' },
  { icon: Settings, labelKey: 'profile.nav.settings', to: localePath('/profile/settings'), descriptionKey: 'profile.index.accountSettings' },
])
</script>

<template>
  <div>
    <!-- Welcome section -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6 mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {{ $t('profile.index.welcomeBack', { name: userName }) }}
      </h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        {{ $t('profile.index.manageAccount') }}
      </p>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-shadow"
      >
        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <component :is="link.icon" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="font-medium text-gray-900 dark:text-gray-100">{{ $t(link.labelKey) }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t(link.descriptionKey) }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Recent orders -->
    <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ $t('profile.index.recentOrders') }}</h2>
        <NuxtLink :to="localePath('/profile/orders')" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          {{ $t('profile.index.viewAll') }}
        </NuxtLink>
      </div>

      <div v-if="recentOrders.length" class="space-y-4">
        <NuxtLink
          v-for="order in recentOrders"
          :key="order.id"
          :to="localePath(`/profile/order/${order.id}`)"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ $t('profile.index.orderNumber', { number: order.order_number }) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('profile.index.items', { count: order.items.length }) }}
            </p>
          </div>
          <div class="text-right">
            <UiBadge
              :variant="order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'default'"
              size="sm"
            >
              {{ order.status }}
            </UiBadge>
            <p class="mt-1">
              <UiPrice :price="order.totals.total" :currency="order.totals.currency" size="sm" :show-discount="false" />
            </p>
          </div>
        </NuxtLink>
      </div>

      <UiEmptyState
        v-else
        :title="$t('profile.index.noOrdersYet')"
        :description="$t('profile.index.startShoppingHere')"
        :icon="Package"
      >
        <template #action>
          <NuxtLink
            :to="localePath('/categories')"
            class="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            {{ $t('profile.index.browseProducts') }}
          </NuxtLink>
        </template>
      </UiEmptyState>
    </div>
  </div>
</template>
