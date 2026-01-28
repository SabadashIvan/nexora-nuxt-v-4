/**
 * Comments Store
 * Handles fetching and creating comments for products (and other entities)
 * CSR-only (comments are not SEO-critical)
 */

import { defineStore } from 'pinia'
import type {
  Comment,
  CommentsState,
  CommentsParams,
  CommentsResponse,
  CreateCommentPayload,
} from '~/types'
import { parseApiError, getFieldErrors, getErrorMessage } from '~/utils/errors'

export const useCommentsStore = defineStore('comments', {
  state: (): CommentsState => ({
    comments: [],
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
    loading: false,
    submitting: false,
    error: null,
    fieldErrors: {},
  }),

  getters: {
    /**
     * Check if there are comments
     */
    hasComments: (state): boolean => {
      return state.comments.length > 0
    },

    /**
     * Get total comments count
     */
    commentsCount: (state): number => {
      return state.pagination.total
    },

    /**
     * Check if there are more pages to load
     */
    hasMorePages: (state): boolean => {
      return state.pagination.page < state.pagination.lastPage
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
     * Fetch comments for an entity
     * GET /api/v1/comments
     * Public endpoint - no auth required
     */
    async fetchComments(params: CommentsParams): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const queryParams: Record<string, string | number> = {
          type: params.type,
          id: params.id,
          page: params.page || this.pagination.page,
        }

        if (params.per_page) {
          queryParams.per_page = params.per_page
        }

        const response = await api.get<CommentsResponse>('/comments', queryParams)

        // Ensure response has data array
        const commentsData = response.data || []

        // If loading first page, replace comments; otherwise append for infinite scroll
        if (params.page === 1 || !params.page) {
          this.comments = commentsData
        } else {
          // Append new comments for pagination
          this.comments = [...this.comments, ...commentsData]
        }

        // Safely update pagination with fallback values
        if (response.meta && response.meta.pagination) {
          this.pagination = {
            page: response.meta.pagination.current_page || this.pagination.page,
            perPage: response.meta.pagination.per_page || this.pagination.perPage,
            total: response.meta.pagination.total || 0,
            lastPage: response.meta.pagination.last_page || 1,
          }
        } else {
          // If no pagination data, reset to defaults but keep current page
          this.pagination = {
            page: this.pagination.page,
            perPage: this.pagination.perPage,
            total: commentsData.length,
            lastPage: 1,
          }
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch comments error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Load more comments (next page)
     */
    async loadMoreComments(type: string, id: number): Promise<void> {
      if (!this.hasMorePages || this.loading) return

      await this.fetchComments({
        type,
        id,
        page: this.pagination.page + 1,
      })
    },

    /**
     * Create a new comment
     * POST /api/v1/comments
     * Requires authentication
     */
    async createComment(payload: CreateCommentPayload): Promise<Comment | null> {
      const api = useApi()
      this.submitting = true
      this.clearErrors()

      try {
        const comment = await api.post<Comment>('/comments', payload)

        // Comments go to moderation, so we don't add them to the list immediately
        // and we don't increment the total count
        // The comment will appear after moderation when the page is refreshed

        return comment
      } catch (error) {
        const apiError = parseApiError(error)
        this.error = apiError.message
        this.fieldErrors = getFieldErrors(apiError)
        console.error('Create comment error:', error)
        return null
      } finally {
        this.submitting = false
      }
    },

    /**
     * Helper to recursively add a reply to the correct parent comment
     */
    addReplyToComment(comments: Comment[], parentId: number, newReply: Comment): boolean {
      for (const comment of comments) {
        if (comment.id === parentId) {
          // Found the parent - add reply
          if (!comment.replies) {
            comment.replies = []
          }
          comment.replies.push(newReply)
          return true
        }
        // Check nested replies
        if (comment.replies && comment.replies.length > 0) {
          if (this.addReplyToComment(comment.replies, parentId, newReply)) {
            return true
          }
        }
      }
      return false
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.comments = []
      this.pagination = {
        page: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      }
      this.loading = false
      this.submitting = false
      this.error = null
      this.fieldErrors = {}
    },
  },
})

