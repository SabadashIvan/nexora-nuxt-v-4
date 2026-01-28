<script setup lang="ts">
/**
 * Product Reviews Section Component
 * Main component for displaying and managing product reviews
 * CSR-only: loads reviews on client mount
 */
import { Star, LogIn, ChevronDown, MessageSquareText } from 'lucide-vue-next'
import { useReviewsStore } from '~/stores/reviews.store'
import { useAuthStore } from '~/stores/auth.store'

// Get toast function from Nuxt app
const nuxtApp = useNuxtApp()
const $toast = nuxtApp.$toast as typeof import('vue-sonner').toast

// Get i18n for translations
const { t } = useI18n()

const props = defineProps<{
  /** Product ID (product_id, NOT variant_id) to fetch reviews for */
  productId: number
}>()

const reviewsStore = useReviewsStore()
const authStore = useAuthStore()
const router = useRouter()

// Locale-aware navigation
const localePath = useLocalePath()

const isInitialized = ref(false)

// Computed
const reviews = computed(() => reviewsStore.reviews)
const hasReviews = computed(() => reviewsStore.hasReviews)
const reviewsCount = computed(() => reviewsStore.reviewsCount)
const averageRating = computed(() => reviewsStore.averageRating)
const isLoading = computed(() => reviewsStore.loading)
const isSubmitting = computed(() => reviewsStore.submitting)
const hasMorePages = computed(() => reviewsStore.hasMorePages)
const error = computed(() => reviewsStore.error)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Load reviews on mount
onMounted(async () => {
  await loadReviews()
  isInitialized.value = true
})

// Watch for product changes and reload
watch(() => props.productId, async (newId, oldId) => {
  if (newId !== oldId && isInitialized.value) {
    reviewsStore.reset()
    await loadReviews()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  reviewsStore.reset()
})

async function loadReviews() {
  await reviewsStore.fetchReviews(props.productId, 1)
}

async function loadMore() {
  await reviewsStore.loadMoreReviews(props.productId)
}

async function handleReviewSubmit(rating: number, body: string, pros?: string, cons?: string) {
  const review = await reviewsStore.createReview({
    id: props.productId,
    rating,
    body,
    pros,
    cons,
  })
  
  if (review) {
    // Show success toast (review may be on moderation)
    $toast.success(t('product.reviews.submittedSuccess'), {
      description: t('product.reviews.moderationMessage'),
    })
  } else if (reviewsStore.error) {
    // Error is handled by toast watcher
    console.error('Failed to create review:', reviewsStore.error)
  }
}

function goToLogin() {
  router.push(localePath('/auth/login'))
}

// Watch for error messages and show toast
watch(error, (newError) => {
  if (newError && isSubmitting.value === false) {
    $toast.error(newError)
  }
})
</script>

<template>
  <section class="mt-16 border-t border-gray-200 pt-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <MessageSquareText class="h-6 w-6 text-gray-600" />
        <h2 class="text-xl font-semibold text-gray-900">
          {{ $t('product.reviews.title') }}
          <span v-if="reviewsCount > 0" class="text-gray-500 font-normal">
            ({{ reviewsCount }})
          </span>
        </h2>
      </div>
      
      <!-- Average rating -->
      <div v-if="hasReviews" class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
          <Star
            v-for="star in 5"
            :key="star"
            class="h-5 w-5"
            :class="[
              star <= Math.round(averageRating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            ]"
          />
        </div>
        <span class="text-sm font-medium text-gray-700">
          {{ averageRating.toFixed(1) }} {{ $t('product.reviews.outOf5') }}
        </span>
      </div>
    </div>

    <!-- Review Form or Login Prompt -->
    <div class="mb-8">
      <!-- Authenticated: Show form -->
      <div v-if="isAuthenticated" class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('product.reviews.writeReview') }}</h3>
        
        <ProductReviewForm 
          @submit="handleReviewSubmit"
        />
      </div>

      <!-- Not authenticated: Show login prompt -->
      <div 
        v-else 
        class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"
      >
        <LogIn class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-600 mb-4">
          {{ $t('product.reviews.loginToReview') }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          @click="goToLogin"
        >
          <LogIn class="h-4 w-4" />
          {{ $t('navigation.login') }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasReviews" class="py-8">
      <div class="flex justify-center">
        <UiSpinner size="lg" />
      </div>
      <p class="text-center text-gray-500 mt-3">{{ $t('product.reviews.loading') }}</p>
    </div>

    <!-- Reviews list -->
    <div v-else-if="hasReviews" class="space-y-4">
      <ProductReviewItem
        v-for="review in reviews"
        :key="review.id"
        :review="review"
      />

      <!-- Load more button -->
      <div v-if="hasMorePages" class="pt-4 text-center">
        <button
          type="button"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="loadMore"
        >
          <UiSpinner v-if="isLoading" size="sm" />
          <ChevronDown v-else class="h-4 w-4" />
          {{ $t('product.reviews.loadMore') }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div 
      v-else-if="!isLoading" 
      class="py-12 text-center"
    >
      <MessageSquareText class="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-1">{{ $t('product.reviews.noReviews') }}</h3>
      <p class="text-gray-500">
        {{ $t('product.reviews.beFirst') }}
      </p>
    </div>
  </section>
</template>

