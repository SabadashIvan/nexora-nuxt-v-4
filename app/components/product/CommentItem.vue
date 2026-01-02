<script setup lang="ts">
/**
 * Comment Item Component
 * Displays a single comment with recursive reply support
 * Includes reply form for authenticated users
 */
import { MessageCircle, User } from 'lucide-vue-next'
import type { Comment } from '~/types'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps<{
  comment: Comment
  /** Depth level for indentation (0 = top-level) */
  depth?: number
  /** Maximum nesting depth for replies */
  maxDepth?: number
}>()

const emit = defineEmits<{
  /** Emitted when a reply is submitted */
  reply: [text: string, parentId: number]
}>()

const authStore = useAuthStore()
const showReplyForm = ref(false)
const currentDepth = computed(() => props.depth || 0)
const maxNestingDepth = computed(() => props.maxDepth || 3)
const canReply = computed(() => currentDepth.value < maxNestingDepth.value)
const hasReplies = computed(() => props.comment.replies && props.comment.replies.length > 0)

// Format date relative to now
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function handleReplySubmit(text: string) {
  emit('reply', text, props.comment.id)
  showReplyForm.value = false
}

function toggleReplyForm() {
  showReplyForm.value = !showReplyForm.value
}
</script>

<template>
  <article 
    class="group"
    :class="{ 'ml-6 pl-4 border-l-2 border-gray-100': currentDepth > 0 }"
  >
    <div class="flex gap-3">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <div 
          v-if="comment.author.avatar" 
          class="h-8 w-8 rounded-full overflow-hidden bg-gray-100"
        >
          <img 
            :src="comment.author.avatar" 
            :alt="comment.author.name"
            class="h-full w-full object-cover"
          />
        </div>
        <div 
          v-else 
          class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"
        >
          <User class="h-4 w-4 text-indigo-600" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium text-gray-900">
            {{ comment.author.name }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatDate(comment.created_at) }}
          </span>
        </div>

        <!-- Text -->
        <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {{ comment.text }}
        </p>

        <!-- Actions -->
        <div class="mt-2 flex items-center gap-3">
          <!-- Reply button -->
          <button
            v-if="canReply && authStore.isAuthenticated"
            type="button"
            class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
            @click="toggleReplyForm"
          >
            <MessageCircle class="h-3.5 w-3.5" />
            {{ showReplyForm ? 'Cancel' : 'Reply' }}
          </button>
        </div>

        <!-- Reply form -->
        <div v-if="showReplyForm" class="mt-3">
          <ProductCommentForm
            :parent-id="comment.id"
            :is-reply="true"
            @submit="handleReplySubmit"
            @cancel="showReplyForm = false"
          />
        </div>
      </div>
    </div>

    <!-- Nested replies -->
    <div v-if="hasReplies" class="mt-4 space-y-4">
      <ProductCommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :depth="currentDepth + 1"
        :max-depth="maxNestingDepth"
        @reply="(text, parentId) => emit('reply', text, parentId)"
      />
    </div>
  </article>
</template>

