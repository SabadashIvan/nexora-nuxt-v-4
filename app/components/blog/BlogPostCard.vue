<script setup lang="ts">
/**
 * Blog post card component
 */
import { Calendar, Clock } from 'lucide-vue-next'
import type { BlogPost } from '~/types'
import { formatDate } from '~/utils/format'

interface Props {
  post: BlogPost
}

const props = defineProps<Props>()

// Locale-aware navigation
const localePath = useLocalePath()

// Helper to get featured image URL (handles both object and string)
const featuredImageUrl = computed(() => {
  const img = props.post.featured_image || props.post.image
  if (!img) return null
  if (typeof img === 'string') return img
  if (typeof img === 'object' && 'url' in img) return img.url
  return null
})
</script>

<template>
  <article class="group relative">
    <!-- Image -->
    <div class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-100 group-hover:opacity-75">
      <NuxtLink :to="localePath(`/blog/posts/${post.slug}`)">
        <NuxtImg
          v-if="featuredImageUrl"
          :src="featuredImageUrl"
          :alt="post.title"
          class="h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div v-else class="h-full w-full bg-gray-200 flex items-center justify-center">
          <span class="text-gray-400 text-sm">No image</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Content -->
    <div class="mt-4">
      <!-- Category -->
      <NuxtLink
        v-if="post.category"
        :to="localePath(`/blog/category/${post.category.slug}`)"
        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        {{ post.category.title || post.category.name }}
      </NuxtLink>

      <!-- Title -->
      <NuxtLink :to="localePath(`/blog/posts/${post.slug}`)" class="mt-2 block">
        <h3 class="text-base font-semibold text-gray-900 group-hover:text-gray-700 line-clamp-2">
          {{ post.title }}
        </h3>
      </NuxtLink>

      <!-- Excerpt -->
      <p v-if="post.excerpt" class="mt-2 text-sm text-gray-600 line-clamp-3">
        {{ post.excerpt }}
      </p>

      <!-- Meta -->
      <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <span class="flex items-center gap-1">
          <Calendar class="h-4 w-4" />
          {{ formatDate(post.published_at) }}
        </span>
        <span v-if="post.reading_time" class="flex items-center gap-1">
          <Clock class="h-4 w-4" />
          {{ post.reading_time }} min
        </span>
      </div>
    </div>
  </article>
</template>

