<script setup lang="ts">
/**
 * Review Form Component
 * Form for creating product reviews with rating, body, pros/cons
 * Requires authentication
 */
import { Star, Send, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const emit = defineEmits<{
  /** Emitted when review is submitted */
  submit: [rating: number, body: string, pros?: string, cons?: string]
}>()

// Form state
const rating = ref(0)
const hoverRating = ref(0)
const body = ref('')
const pros = ref('')
const cons = ref('')

// Validation constants
const bodyMaxLength = 5000
const bodyMinLength = 10
const prosConsMaxLength = 1000

// Computed
const displayRating = computed(() => hoverRating.value || rating.value)
const bodyCharCount = computed(() => body.value.length)
const isBodyValid = computed(() => body.value.trim().length >= bodyMinLength && body.value.length <= bodyMaxLength)
const isRatingValid = computed(() => rating.value >= 1 && rating.value <= 5)
const isValid = computed(() => isBodyValid.value && isRatingValid.value)
const isBodyOverLimit = computed(() => body.value.length > bodyMaxLength)
const isProsOverLimit = computed(() => pros.value.length > prosConsMaxLength)
const isConsOverLimit = computed(() => cons.value.length > prosConsMaxLength)

// Methods
function setRating(value: number) {
  rating.value = value
}

function handleMouseEnter(value: number) {
  hoverRating.value = value
}

function handleMouseLeave() {
  hoverRating.value = 0
}

function handleSubmit() {
  if (!isValid.value) return
  
  emit(
    'submit',
    rating.value,
    body.value.trim(),
    pros.value.trim() || undefined,
    cons.value.trim() || undefined
  )
  
  // Reset form
  rating.value = 0
  body.value = ''
  pros.value = ''
  cons.value = ''
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
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Rating -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Rating <span class="text-red-500">*</span>
      </label>
      <div class="flex items-center gap-1">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-sm transition-transform hover:scale-110"
          @click="setRating(star)"
          @mouseenter="handleMouseEnter(star)"
          @mouseleave="handleMouseLeave"
        >
          <Star
            class="h-8 w-8 transition-colors"
            :class="[
              star <= displayRating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            ]"
          />
        </button>
        <span v-if="rating > 0" class="ml-2 text-sm text-gray-600">
          {{ rating }} out of 5
        </span>
      </div>
      <p v-if="!isRatingValid && rating === 0" class="mt-1 text-xs text-gray-500">
        Please select a rating
      </p>
    </div>

    <!-- Body -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Your Review <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <textarea
          v-model="body"
          placeholder="Share your experience with this product..."
          rows="4"
          :maxlength="bodyMaxLength + 100"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': isBodyOverLimit
          }"
          @keydown="handleKeydown"
        />
        <div 
          class="absolute bottom-2 right-2 text-xs"
          :class="{
            'text-gray-400': bodyCharCount < bodyMaxLength * 0.9,
            'text-amber-500': bodyCharCount >= bodyMaxLength * 0.9 && !isBodyOverLimit,
            'text-red-500': isBodyOverLimit
          }"
        >
          {{ bodyCharCount }}/{{ bodyMaxLength }}
        </div>
      </div>
      <p v-if="body.length > 0 && body.trim().length < bodyMinLength" class="mt-1 text-xs text-amber-600">
        Minimum {{ bodyMinLength }} characters required
      </p>
    </div>

    <!-- Pros -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <ThumbsUp class="inline h-4 w-4 text-green-600 mr-1" />
        Advantages
        <span class="text-gray-400 font-normal">(optional)</span>
      </label>
      <div class="relative">
        <textarea
          v-model="pros"
          placeholder="What did you like about this product?"
          rows="2"
          :maxlength="prosConsMaxLength + 50"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': isProsOverLimit
          }"
        />
        <div 
          class="absolute bottom-2 right-2 text-xs"
          :class="{
            'text-gray-400': pros.length < prosConsMaxLength * 0.9,
            'text-amber-500': pros.length >= prosConsMaxLength * 0.9 && !isProsOverLimit,
            'text-red-500': isProsOverLimit
          }"
        >
          {{ pros.length }}/{{ prosConsMaxLength }}
        </div>
      </div>
    </div>

    <!-- Cons -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <ThumbsDown class="inline h-4 w-4 text-red-500 mr-1" />
        Disadvantages
        <span class="text-gray-400 font-normal">(optional)</span>
      </label>
      <div class="relative">
        <textarea
          v-model="cons"
          placeholder="What could be improved?"
          rows="2"
          :maxlength="prosConsMaxLength + 50"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': isConsOverLimit
          }"
        />
        <div 
          class="absolute bottom-2 right-2 text-xs"
          :class="{
            'text-gray-400': cons.length < prosConsMaxLength * 0.9,
            'text-amber-500': cons.length >= prosConsMaxLength * 0.9 && !isConsOverLimit,
            'text-red-500': isConsOverLimit
          }"
        >
          {{ cons.length }}/{{ prosConsMaxLength }}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-gray-500">
        Press <kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd>+<kbd class="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to submit
      </p>
      
      <button
        type="submit"
        :disabled="!isValid"
        class="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send class="h-4 w-4" />
        Submit Review
      </button>
    </div>
  </form>
</template>

