/**
 * Comments domain types
 * Supports threaded comments for products (and other entities)
 */

import type { Pagination } from './common'

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: number
  name: string
  avatar?: string | null
}

/**
 * Single comment object
 */
export interface Comment {
  id: number
  text: string
  author: CommentAuthor
  parent_id: number | null
  created_at: string
  updated_at?: string
  /** Nested replies (threaded comments) */
  replies?: Comment[]
}

/**
 * Parameters for fetching comments
 */
export interface CommentsParams {
  /** Type of the commentable entity (e.g., 'product') */
  type: string
  /** Entity ID to fetch comments for */
  id: number
  /** Page number for pagination */
  page?: number
  /** Items per page */
  per_page?: number
}

/**
 * API response for comments list
 */
export interface CommentsResponse {
  data: Comment[]
  meta: {
    pagination: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

/**
 * Payload for creating a new comment
 */
export interface CreateCommentPayload {
  /** Type of the commentable entity (e.g., 'product') */
  type: string
  /** Entity ID to comment on (product_id, NOT variant_id) */
  id: number
  /** Comment text (max 5000 characters) */
  text: string
  /** Parent comment ID for replies (optional) */
  parent_id?: number | null
}

/**
 * Comments store state
 */
export interface CommentsState {
  comments: Comment[]
  pagination: Pagination
  loading: boolean
  submitting: boolean
  error: string | null
  fieldErrors: Record<string, string>
}

