/**
 * Reviews domain types
 * Handles product reviews with ratings, pros/cons, and replies
 */

/**
 * Review author information
 */
export interface ReviewAuthor {
  id: number
  name: string
}

/**
 * Reply to a review (from store/admin)
 */
export interface ReviewReply {
  id: number
  body: string
  is_active: boolean
  author: ReviewAuthor
  created_at: string
}

/**
 * Single review object
 */
export interface Review {
  id: number
  rating: number
  body: string
  pros: string | null
  cons: string | null
  author: ReviewAuthor
  created_at: string
  replies?: ReviewReply[]
}

/**
 * Payload for creating a new review
 */
export interface CreateReviewPayload {
  /** Product ID (product_id, NOT variant_id) */
  id: number
  /** Rating from 1 to 5 */
  rating: number
  /** Review text */
  body: string
  /** Advantages of the product (optional) */
  pros?: string
  /** Disadvantages of the product (optional) */
  cons?: string
}

/**
 * Payload for creating a reply to a review
 */
export interface CreateReplyPayload {
  /** Reply text */
  body: string
}

/**
 * API response for reviews list
 * Uses simplified pagination with has_more_pages
 */
export interface ReviewsResponse {
  data: Review[]
  meta: {
    current_page: number
    has_more_pages: boolean
  }
}

/**
 * Reviews store state
 */
export interface ReviewsState {
  reviews: Review[]
  currentPage: number
  hasMorePages: boolean
  loading: boolean
  submitting: boolean
  error: string | null
  fieldErrors: Record<string, string>
}

