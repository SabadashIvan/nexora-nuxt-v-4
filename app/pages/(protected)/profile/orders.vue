<script setup lang="ts">
/**
 * Order history page
 */
import { Package, Eye, Filter, X } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'
import { getImageUrl } from '~/utils'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

// Locale-aware navigation
const localePath = useLocalePath()

const ordersStore = shallowRef<ReturnType<typeof useOrdersStore> | null>(null)

const defaultPagination = {
  page: 1,
  lastPage: 1,
  perPage: 10,
  total: 0,
}

onMounted(async () => {
  const store = useOrdersStore()
  ordersStore.value = store
  // Fetch statuses and orders in parallel
  await Promise.all([
    store.fetchOrderStatuses(),
    store.fetchOrders(),
  ])
})

const orders = computed(() => ordersStore.value?.orders ?? [])
const pagination = computed(() => ordersStore.value?.pagination ?? defaultPagination)
const loading = computed(() => ordersStore.value?.loading ?? false)
const statuses = computed(() => ordersStore.value?.statuses ?? [])
const selectedStatuses = computed(() => ordersStore.value?.selectedStatuses ?? [])
const hasActiveFilters = computed(() => selectedStatuses.value.length > 0)

async function handlePageChange(page: number) {
  const store = ordersStore.value
  if (!store) return

  await store.goToPage(page)
}

async function handleStatusToggle(statusId: number) {
  const store = ordersStore.value
  if (!store) return

  store.toggleStatus(statusId)
  // Re-fetch orders with new filter, reset to page 1
  await store.fetchOrders(1)
}

async function handleClearFilters() {
  const store = ordersStore.value
  if (!store) return

  store.clearStatusFilters()
  await store.fetchOrders(1)
}

function isStatusSelected(statusId: number): boolean {
  return selectedStatuses.value.includes(statusId)
}

function getStatusVariant(status: string) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'default',
  }
  return variants[status] || 'default'
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{{ $t('profile.orders.title') }}</h1>

    <!-- Status Filters -->
    <div v-if="statuses.length > 0" class="mb-6">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Filter class="h-4 w-4" />
          {{ $t('profile.orders.filter') }}
        </span>
        <button
          v-for="status in statuses"
          :key="status.id"
          type="button"
          class="px-3 py-1.5 text-sm rounded-full border transition-colors"
          :class="[
            isStatusSelected(status.id)
              ? 'bg-indigo-500 text-white border-indigo-500'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          ]"
          @click="handleStatusToggle(status.id)"
        >
          {{ status.title }}
        </button>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center gap-1"
          @click="handleClearFilters"
        >
          <X class="h-3.5 w-3.5" />
          {{ $t('profile.orders.clear') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && orders.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
    </div>

    <!-- Orders list -->
    <div v-else-if="orders.length" class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white dark:bg-gray-900 rounded-lg p-6"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100">
              {{ $t('profile.index.orderNumber', { number: order.order_number }) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('profile.orders.placedOn', { date: formatDate(order.created_at) }) }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <UiBadge :variant="getStatusVariant(order.status)">
              {{ order.status }}
            </UiBadge>
            <NuxtLink
              :to="localePath(`/profile/order/${order.id}`)"
              class="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
            >
              <Eye class="h-4 w-4" />
              {{ $t('profile.orders.viewDetails') }}
            </NuxtLink>
          </div>
        </div>

        <!-- Order items preview -->
        <div class="flex items-center gap-3 overflow-x-auto pb-2">
          <div
            v-for="item in order.items.slice(0, 4)"
            :key="item.id"
            class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <NuxtImg
              v-if="getImageUrl(item.image)"
              :src="getImageUrl(item.image)"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-if="order.items.length > 4" class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('profile.orders.more', { count: order.items.length - 4 }) }}
          </div>
        </div>

        <!-- Total -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('profile.orders.items', { count: order.items.length }) }}
          </span>
          <div class="font-semibold">
            <UiPrice :price="order.totals.total" :currency="order.totals.currency" :show-discount="false" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.lastPage > 1" class="mt-6">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.lastPage"
          @update:current-page="handlePageChange"
        />
      </div>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      :title="$t('profile.orders.noOrdersYet')"
      :description="$t('profile.orders.emptyDescription')"
      :icon="Package"
    >
      <template #action>
        <NuxtLink
          :to="localePath('/categories')"
          class="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          {{ $t('profile.orders.startShopping') }}
        </NuxtLink>
      </template>
    </UiEmptyState>
  </div>
</template>
