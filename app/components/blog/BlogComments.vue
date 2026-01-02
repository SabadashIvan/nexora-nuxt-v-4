<script setup lang="ts">
/**
 * Blog Comments Section Component
 * Main component for displaying and managing blog post comments
 * CSR-only: loads comments on client mount
 */
import { MessageSquare, LogIn, ChevronDown, CheckCircle } from 'lucide-vue-next'
import { useCommentsStore } from '~/stores/comments.store'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps<{
  /** Blog post ID to fetch comments for */
  postId: number
}>()

const commentsStore = useCommentsStore()
const authStore = useAuthStore()
const router = useRouter()

const isInitialized = ref(false)
const showSuccessMessage = ref(false)

// Computed
const comments = computed(() => commentsStore.comments)
const hasComments = computed(() => commentsStore.hasComments)
const totalComments = computed(() => commentsStore.commentsCount)
const isLoading = computed(() => commentsStore.loading)
const isSubmitting = computed(() => commentsStore.submitting)
const hasMorePages = computed(() => commentsStore.hasMorePages)
const error = computed(() => commentsStore.error)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Load comments on mount
onMounted(async () => {
  await loadComments()
  isInitialized.value = true
})

// Watch for post changes and reload
watch(() => props.postId, async (newId, oldId) => {
  if (newId !== oldId && isInitialized.value) {
    commentsStore.reset()
    await loadComments()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  commentsStore.reset()
})

async function loadComments() {
  await commentsStore.fetchComments({
    type: 'post',
    id: props.postId,
    page: 1,
  })
}

async function loadMore() {
  await commentsStore.loadMoreComments('post', props.postId)
}

async function handleCommentSubmit(text: string, parentId?: number | null) {
  const comment = await commentsStore.createComment({
    type: 'post',
    id: props.postId,
    text,
    parent_id: parentId || null,
  })
  
  if (comment) {
    // Show success message (comment is on moderation)
    showSuccessMessage.value = true
    // Hide success message after 5 seconds
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 5000)
  } else if (commentsStore.error) {
    // Error is handled by store
    console.error('Failed to create comment:', commentsStore.error)
  }
}

function goToLogin() {
  router.push('/auth/login')
}
</script>

<template>
  <section class="mt-16 border-t border-gray-200 pt-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <MessageSquare class="h-6 w-6 text-gray-600" />
        <h2 class="text-xl font-semibold text-gray-900">
          Comments
          <span v-if="totalComments > 0" class="text-gray-500 font-normal">
            ({{ totalComments }})
          </span>
        </h2>
      </div>
    </div>

    <!-- Comment Form or Login Prompt -->
    <div class="mb-8">
      <!-- Authenticated: Show form -->
      <div v-if="isAuthenticated">
        <div class="flex items-start gap-3 mb-4">
          <div class="flex-shrink-0">
            <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span class="text-sm font-medium text-indigo-600">
                {{ authStore.userName?.charAt(0)?.toUpperCase() || 'U' }}
              </span>
            </div>
          </div>
          <div class="flex-1">
            <BlogCommentForm 
              @submit="handleCommentSubmit"
            />
          </div>
        </div>

        <!-- Success message -->
        <div 
          v-if="showSuccessMessage" 
          class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
        >
          <CheckCircle class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-green-800">Comment submitted successfully</p>
            <p class="text-xs text-green-600 mt-1">Your comment is under moderation and will be published after review.</p>
          </div>
        </div>

        <!-- Submission error -->
        <div 
          v-if="error && isSubmitting === false && !showSuccessMessage" 
          class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>

      <!-- Not authenticated: Show login prompt -->
      <div 
        v-else 
        class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"
      >
        <LogIn class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-600 mb-4">
          Please log in to leave a comment
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          @click="goToLogin"
        >
          <LogIn class="h-4 w-4" />
          Log In
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasComments" class="py-8">
      <div class="flex justify-center">
        <UiSpinner size="lg" />
      </div>
      <p class="text-center text-gray-500 mt-3">Loading comments...</p>
    </div>

    <!-- Comments list -->
    <div v-else-if="hasComments" class="space-y-6">
      <BlogCommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :depth="0"
        :max-depth="3"
        @reply="handleCommentSubmit"
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
          Load More Comments
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div 
      v-else-if="!isLoading" 
      class="py-12 text-center"
    >
      <MessageSquare class="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-1">No comments yet</h3>
      <p class="text-gray-500">
        Be the first to share your thoughts about this article
      </p>
    </div>
  </section>
</template>

