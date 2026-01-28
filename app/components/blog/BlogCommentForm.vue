<script setup lang="ts">
/**
 * Blog Comment Form Component
 * Textarea form for creating comments with validation
 * Used for both new comments and replies
 */
import { Send, X } from 'lucide-vue-next'

const props = defineProps<{
  /** Parent comment ID for replies */
  parentId?: number | null
  /** Placeholder text */
  placeholder?: string
  /** Whether the form is for a reply (compact mode) */
  isReply?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when comment is submitted */
  submit: [text: string, parentId?: number | null]
  /** Emitted when reply form is cancelled */
  cancel: []
}>()

const text = ref('')
const maxLength = 5000
const minLength = 1

// Computed
const charCount = computed(() => text.value.length)
const isValid = computed(() => text.value.trim().length >= minLength && text.value.length <= maxLength)
const isNearLimit = computed(() => charCount.value > maxLength * 0.9)
const isOverLimit = computed(() => charCount.value > maxLength)

// Methods
function handleSubmit() {
  if (!isValid.value) return
  
  emit('submit', text.value.trim(), props.parentId)
  text.value = ''
}

function handleCancel() {
  text.value = ''
  emit('cancel')
}

function handleKeydown(event: KeyboardEvent) {
  // Submit on Ctrl+Enter or Cmd+Enter
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <div class="relative">
      <textarea
        v-model="text"
        :placeholder="placeholder || (isReply ? 'Write a reply...' : 'Write a comment...')"
        :rows="isReply ? 2 : 4"
        :maxlength="maxLength + 100"
        class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
        :class="{
          'border-red-300 focus:border-red-500 focus:ring-red-500': isOverLimit,
          'pr-16': isReply
        }"
        @keydown="handleKeydown"
      />
      
      <!-- Character count -->
      <div 
        class="absolute bottom-2 right-2 text-xs"
        :class="{
          'text-gray-400': !isNearLimit && !isOverLimit,
          'text-amber-500': isNearLimit && !isOverLimit,
          'text-red-500': isOverLimit
        }"
      >
        {{ charCount }}/{{ maxLength }}
      </div>
    </div>

    <!-- Error message -->
    <p v-if="isOverLimit" class="text-sm text-red-600">
      Comment exceeds maximum length of {{ maxLength }} characters
    </p>

    <!-- Actions -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-gray-500">
        Press <kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd>+<kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to submit
      </p>
      
      <div class="flex items-center gap-2">
        <!-- Cancel button for replies -->
        <button
          v-if="isReply"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          @click="handleCancel"
        >
          <X class="h-4 w-4" />
          Cancel
        </button>
        
        <!-- Submit button -->
        <button
          type="submit"
          :disabled="!isValid"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send class="h-4 w-4" />
          {{ isReply ? 'Reply' : 'Post Comment' }}
        </button>
      </div>
    </div>
  </form>
</template>

