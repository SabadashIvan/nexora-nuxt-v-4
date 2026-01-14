/**
 * Reviews Store
 * Handles fetching and creating product reviews
 * CSR-only (reviews are not SEO-critical)
 */

import { defineStore } from 'pinia'
import type {
  Review,
  ReviewReply,
  ReviewsState,
  ReviewsResponse,
  CreateReviewPayload,
} from '~/types'
import { parseApiError, getFieldErrors, getErrorMessage } from '~/utils/errors'

export const useReviewsStore = defineStore('reviews', {
  state: (): ReviewsState => ({
    reviews: [],
    currentPage: 1,
    hasMorePages: false,
    loading: false,
    submitting: false,
    error: null,
    fieldErrors: {},
  }),

  getters: {
    /**
     * Check if there are reviews
     */
    hasReviews: (state): boolean => {
      return state.reviews.length > 0
    },

    /**
     * Get total reviews count (from loaded reviews)
     */
    reviewsCount: (state): number => {
      return state.reviews.length
    },

    /**
     * Calculate average rating from loaded reviews
     */
    averageRating: (state): number => {
      if (state.reviews.length === 0) return 0
      const sum = state.reviews.reduce((acc, review) => acc + review.rating, 0)
      return Math.round((sum / state.reviews.length) * 10) / 10
    },
  },

  actions: {
    /**
     * Clear errors
     */
    clearErrors() {
      this.error = null
      this.fieldErrors = {}
    },

    /**
     * Fetch reviews for a product
     * GET /api/v1/reviews
     * Public endpoint - no auth required
     */
    async fetchReviews(productId: number, page: number = 1): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const queryParams: Record<string, string | number> = {
          id: productId,
          page,
        }

        const response = await api.get<ReviewsResponse>('/reviews', queryParams)

        // Ensure response has data array
        const reviewsData = response.data || []

        // If loading first page, replace reviews; otherwise append for infinite scroll
        if (page === 1) {
          this.reviews = reviewsData
        } else {
          // Append new reviews for pagination
          this.reviews = [...this.reviews, ...reviewsData]
        }

        // Update pagination from meta
        if (response.meta) {
          this.currentPage = response.meta.current_page || page
          this.hasMorePages = response.meta.has_more_pages || false
        } else {
          this.currentPage = page
          this.hasMorePages = false
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch reviews error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Load more reviews (next page)
     */
    async loadMoreReviews(productId: number): Promise<void> {
      if (!this.hasMorePages || this.loading) return

      await this.fetchReviews(productId, this.currentPage + 1)
    },

    /**
     * Create a new review
     * POST /api/v1/reviews
     * Requires authentication
     */
    async createReview(payload: CreateReviewPayload): Promise<Review | null> {
      const api = useApi()
      this.submitting = true
      this.clearErrors()

      try {
        const review = await api.post<Review>('/reviews', payload)

        // Reviews may go to moderation, so we don't add them to the list immediately
        // The review will appear after moderation when the page is refreshed
        // Or we can reset and reload to get fresh data

        return review
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Create review error:', error)
        return null
      } finally {
        this.submitting = false
      }
    },

    /**
     * Reply to a review (store/admin reply)
     * POST /api/v1/reviews/{reviewId}/reply
     * Note: This endpoint may not exist in API yet - placeholder implementation
     */
    async replyToReview(reviewId: number, message: string): Promise<ReviewReply | null> {
      const api = useApi()
      this.submitting = true
      this.clearErrors()

      try {
        // TODO: Verify endpoint exists in API
        // Expected: POST /api/v1/reviews/{reviewId}/reply
        // Body: { message: string }
        const reply = await api.post<ReviewReply>(`/reviews/${reviewId}/reply`, {
          message,
        })

        // Update local state - add reply to the review
        const review = this.reviews.find(r => r.id === reviewId)
        if (review) {
          if (!review.replies) {
            review.replies = []
          }
          review.replies.push(reply)
        }

        return reply
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Reply to review error:', error)
        return null
      } finally {
        this.submitting = false
      }
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.reviews = []
      this.currentPage = 1
      this.hasMorePages = false
      this.loading = false
      this.submitting = false
      this.error = null
      this.fieldErrors = {}
    },
  },
})

