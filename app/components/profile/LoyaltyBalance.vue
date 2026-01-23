<script setup lang="ts">
/**
 * Loyalty balance display widget
 */
import { Coins, Clock, AlertTriangle } from 'lucide-vue-next'
import type { LoyaltyAccount } from '~/types'

interface Props {
  account: LoyaltyAccount | null
  loading?: boolean
  /** Number of transactions expiring soon */
  expiringCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  expiringCount: 0,
})
</script>

<template>
  <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse">
      <div class="h-4 w-24 bg-white/30 rounded mb-2" />
      <div class="h-8 w-32 bg-white/30 rounded mb-4" />
      <div class="h-4 w-20 bg-white/30 rounded" />
    </div>

    <!-- Content -->
    <template v-else-if="account">
      <div class="flex items-center gap-2 mb-1">
        <Coins class="h-5 w-5 text-white/80" />
        <span class="text-sm text-white/80">{{ $t('profile.loyaltyBalance.availableBalance') }}</span>
      </div>

      <p class="text-3xl font-bold mb-4">
        {{ account.balance }}
      </p>

      <!-- Pending points -->
      <div v-if="account.pending && account.pending !== '$0.00'" class="flex items-center gap-2 text-sm text-white/70">
        <Clock class="h-4 w-4" />
        <span>{{ account.pending }} {{ $t('profile.loyaltyBalance.pending') }}</span>
      </div>

      <!-- Expiring warning -->
      <div
        v-if="expiringCount > 0"
        class="mt-3 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2"
      >
        <AlertTriangle class="h-4 w-4 text-yellow-300" />
        <span>{{ $t('profile.loyaltyBalance.expiringSoon', { count: expiringCount }) }}</span>
      </div>
    </template>

    <!-- No account -->
    <div v-else class="text-center py-4">
      <Coins class="h-12 w-12 mx-auto text-white/50 mb-2" />
      <p class="text-white/70">{{ $t('profile.loyaltyBalance.noLoyaltyAccount') }}</p>
    </div>
  </div>
</template>
