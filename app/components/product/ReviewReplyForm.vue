<script setup lang="ts">
/**
 * Review reply form component
 * Allows authenticated users to reply to a review
 */
import { Send, X, Loader2 } from 'lucide-vue-next'

interface Props {
  reviewId: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [body: string]
  cancel: []
}>()

const body = ref('')
const isValid = computed(() => body.value.trim().length >= 3)

function handleSubmit() {
  if (!isValid.value || props.loading) return
  emit('submit', body.value.trim())
}

function handleCancel() {
  body.value = ''
  emit('cancel')
}

// Reset form when reviewId changes
watch(() => props.reviewId, () => {
  body.value = ''
})
</script>

<template>
  <div class="mt-3 ml-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <textarea
        v-model="body"
        rows="3"
        placeholder="Write your reply..."
        :disabled="loading"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <div class="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
          :disabled="loading"
          @click="handleCancel"
        >
          <X class="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-1.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          :disabled="!isValid || loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <Send v-else class="h-4 w-4" />
          Reply
        </button>
      </div>
    </div>
  </div>
</template>
