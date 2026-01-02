<script setup lang="ts">
/**
 * Review Item Component
 * Displays a single product review with rating, pros/cons, and optional replies
 */
import { Star, User, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-vue-next'
import type { Review } from '~/types'

const props = defineProps<{
  review: Review
}>()

const hasReplies = computed(() => props.review.replies && props.review.replies.length > 0)
const hasPros = computed(() => props.review.pros && props.review.pros.trim().length > 0)
const hasCons = computed(() => props.review.cons && props.review.cons.trim().length > 0)

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
</script>

<template>
  <article class="bg-white border border-gray-200 rounded-lg p-5">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span class="text-sm font-medium text-indigo-600">
              {{ review.author.name.charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>
        
        <!-- Author & Date -->
        <div>
          <p class="text-sm font-medium text-gray-900">
            {{ review.author.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatDate(review.created_at) }}
          </p>
        </div>
      </div>
      
      <!-- Rating -->
      <div class="flex items-center gap-0.5">
        <Star
          v-for="star in 5"
          :key="star"
          class="h-4 w-4"
          :class="[
            star <= review.rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300'
          ]"
        />
      </div>
    </div>
    
    <!-- Body -->
    <p class="text-sm text-gray-700 whitespace-pre-wrap break-words mb-4">
      {{ review.body }}
    </p>
    
    <!-- Pros & Cons -->
    <div v-if="hasPros || hasCons" class="space-y-3 mb-4">
      <!-- Pros -->
      <div v-if="hasPros" class="flex gap-2">
        <div class="flex-shrink-0">
          <div class="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <ThumbsUp class="h-3.5 w-3.5 text-green-600" />
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-green-700 mb-0.5">Advantages</p>
          <p class="text-sm text-gray-700">{{ review.pros }}</p>
        </div>
      </div>
      
      <!-- Cons -->
      <div v-if="hasCons" class="flex gap-2">
        <div class="flex-shrink-0">
          <div class="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
            <ThumbsDown class="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-red-600 mb-0.5">Disadvantages</p>
          <p class="text-sm text-gray-700">{{ review.cons }}</p>
        </div>
      </div>
    </div>
    
    <!-- Replies -->
    <div v-if="hasReplies" class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center gap-1.5 mb-3">
        <MessageCircle class="h-4 w-4 text-gray-400" />
        <span class="text-xs font-medium text-gray-500">
          {{ review.replies!.length }} {{ review.replies!.length === 1 ? 'Reply' : 'Replies' }}
        </span>
      </div>
      
      <div class="space-y-3">
        <div
          v-for="reply in review.replies"
          :key="reply.id"
          class="ml-4 pl-4 border-l-2 border-gray-200"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium text-gray-900">
              {{ reply.author.name }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatDate(reply.created_at) }}
            </span>
          </div>
          <p class="text-sm text-gray-700">
            {{ reply.body }}
          </p>
        </div>
      </div>
    </div>
  </article>
</template>

