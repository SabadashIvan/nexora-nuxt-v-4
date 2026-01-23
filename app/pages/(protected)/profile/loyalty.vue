<script setup lang="ts">
/**
 * Loyalty points page
 * Shows balance and transaction history
 */
import { Coins, RefreshCw } from 'lucide-vue-next'

definePageMeta({
  layout: 'profile',
  ssr: false,
})

const loyaltyStore = shallowRef<ReturnType<typeof useLoyaltyStore> | null>(null)

onMounted(async () => {
  const store = useLoyaltyStore()
  loyaltyStore.value = store
  await store.refresh()
})

const account = computed(() => loyaltyStore.value?.account ?? null)
const transactions = computed(() => loyaltyStore.value?.transactions ?? [])
const loading = computed(() => loyaltyStore.value?.loading ?? false)
const historyLoading = computed(() => loyaltyStore.value?.historyLoading ?? false)
const error = computed(() => loyaltyStore.value?.error ?? null)
const hasMorePages = computed(() => loyaltyStore.value?.hasMorePages ?? false)
const expiringCount = computed(() => loyaltyStore.value?.expiringTransactions.length ?? 0)

async function handleRefresh() {
  const store = loyaltyStore.value
  if (!store) return
  await store.refresh()
}

async function handleLoadMore() {
  const store = loyaltyStore.value
  if (!store) return
  await store.loadMoreHistory()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('profile.loyalty.title') }}</h1>
      <button
        type="button"
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        :disabled="loading"
        @click="handleRefresh"
      >
        <RefreshCw class="h-5 w-5" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <div class="space-y-6">
      <!-- Balance card -->
      <ProfileLoyaltyBalance
        :account="account"
        :loading="loading"
        :expiring-count="expiringCount"
      />

      <!-- How it works -->
      <div class="bg-white dark:bg-gray-900 rounded-lg p-6">
        <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">{{ $t('profile.loyalty.howItWorks') }}</h2>
        <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex-shrink-0">1</span>
            <span>{{ $t('profile.loyalty.step1') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex-shrink-0">2</span>
            <span>{{ $t('profile.loyalty.step2') }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex-shrink-0">3</span>
            <span>{{ $t('profile.loyalty.step3') }}</span>
          </li>
        </ul>
      </div>

      <!-- Transaction history -->
      <ProfileLoyaltyHistory
        :transactions="transactions"
        :loading="historyLoading"
        :has-more="hasMorePages"
        @load-more="handleLoadMore"
      />
    </div>
  </div>
</template>
