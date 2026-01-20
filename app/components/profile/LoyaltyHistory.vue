<script setup lang="ts">
/**
 * Loyalty transaction history list
 */
import { ArrowUpCircle, ArrowDownCircle, Clock, AlertTriangle } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'
import type { LoyaltyTransaction } from '~/types'

interface Props {
  transactions: LoyaltyTransaction[]
  loading?: boolean
  hasMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: false,
})

const emit = defineEmits<{
  loadMore: []
}>()

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiresDate = new Date(expiresAt)
  return expiresDate <= thirtyDaysFromNow && expiresDate > new Date()
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <h2 class="font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>
    </div>

    <!-- Loading -->
    <div v-if="loading && transactions.length === 0" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div v-for="i in 5" :key="i" class="px-6 py-4">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div class="flex-1">
            <div class="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
            <div class="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div class="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Transactions list -->
    <div v-else-if="transactions.length" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="px-6 py-4 flex items-center gap-4"
        :class="{ 'opacity-50': isExpired(transaction.expires_at) }"
      >
        <!-- Icon -->
        <div
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          :class="[
            transaction.type === 'Accrual'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          ]"
        >
          <ArrowDownCircle v-if="transaction.type === 'Accrual'" class="h-5 w-5" />
          <ArrowUpCircle v-else class="h-5 w-5" />
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ transaction.description }}
          </p>
          <div class="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ formatDate(transaction.created_at) }}</span>

            <!-- Expiration warning -->
            <span
              v-if="transaction.expires_at && transaction.type === 'Accrual'"
              class="flex items-center gap-1"
              :class="{
                'text-yellow-600 dark:text-yellow-400': isExpiringSoon(transaction.expires_at),
                'text-red-500 dark:text-red-400': isExpired(transaction.expires_at),
              }"
            >
              <AlertTriangle v-if="isExpiringSoon(transaction.expires_at) || isExpired(transaction.expires_at)" class="h-3.5 w-3.5" />
              <Clock v-else class="h-3.5 w-3.5" />
              <span v-if="isExpired(transaction.expires_at)">Expired</span>
              <span v-else>Expires {{ formatDate(transaction.expires_at) }}</span>
            </span>
          </div>
        </div>

        <!-- Amount -->
        <p
          class="flex-shrink-0 font-semibold"
          :class="[
            transaction.type === 'Accrual'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          ]"
        >
          {{ transaction.type === 'Accrual' ? '+' : '-' }}{{ transaction.amount }}
        </p>
      </div>

      <!-- Load more -->
      <button
        v-if="hasMore"
        type="button"
        class="w-full py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        :disabled="loading"
        @click="emit('loadMore')"
      >
        {{ loading ? 'Loading...' : 'Load more' }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else class="px-6 py-12 text-center">
      <Clock class="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <p class="text-gray-500 dark:text-gray-400">No transactions yet</p>
    </div>
  </div>
</template>
