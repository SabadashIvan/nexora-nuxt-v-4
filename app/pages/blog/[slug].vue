<script setup lang="ts">
/**
 * Blog post detail page - SSR for SEO
 */
import { Calendar, Clock, Facebook, Twitter, Linkedin } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'

const route = useRoute()
const blogStore = useBlogStore()

const slug = computed(() => route.params.slug as string)

// Locale-aware navigation
const localePath = useLocalePath()

// Fetch post with SSR
const { data: post, pending } = await useAsyncData(
  `blog-post-${slug.value}`,
  async () => {
    return await blogStore.fetchPost(slug.value)
  },
  { watch: [slug] }
)

// Handle 404
if (!post.value && !pending.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post Not Found',
  })
}

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Blog', to: localePath('/blog') },
  { label: post.value?.title || 'Post' },
])

// Debug: log content when post changes
watch(() => post.value, (newPost) => {
  if (newPost) {
    console.log('Post content debug in template:', {
      hasContent: !!newPost.content,
      contentType: typeof newPost.content,
      contentValue: newPost.content,
      contentLength: newPost.content?.length
    })
  }
}, { immediate: true })

// Helper to get featured image URL (handles both object and string)
const featuredImageUrl = computed(() => {
  if (!post.value) return null
  const img = post.value.featured_image || post.value.image
  if (!img) return null
  if (typeof img === 'string') return img
  if (typeof img === 'object' && 'url' in img) return img.url
  return null
})

// SEO meta tags
useHead({
  title: post.value?.seo?.title || post.value?.title || 'Blog Post',
  meta: [
    { name: 'description', content: post.value?.seo?.description || post.value?.excerpt || '' },
    ...(post.value?.seo?.keywords ? [{ name: 'keywords', content: post.value.seo.keywords }] : []),
    // Handle robots - can be empty string, null, or a value
    ...(post.value?.seo?.robots && post.value.seo.robots.trim() ? [{ name: 'robots', content: post.value.seo.robots }] : []),
    // Handle og_image - can be empty string, null, or a value
    ...(post.value?.seo?.og_image && post.value.seo.og_image.trim() ? [{ property: 'og:image', content: post.value.seo.og_image }] : []),
    ...(post.value?.seo?.title ? [{ property: 'og:title', content: post.value.seo.title }] : []),
    ...(post.value?.seo?.description ? [{ property: 'og:description', content: post.value.seo.description }] : []),
  ],
  link: [
    ...(post.value?.seo?.canonical ? [{ rel: 'canonical', href: post.value.seo.canonical }] : []),
  ],
})
</script>

<template>
  <div class="bg-white">
    <!-- Breadcrumbs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <UiBreadcrumbs :items="breadcrumbs" class="mb-6" />
    </div>

    <main class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
      <!-- Loading -->
      <div v-if="pending" class="animate-pulse space-y-6 pt-24">
        <div class="h-10 bg-gray-200 rounded w-3/4" />
        <div class="h-4 bg-gray-200 rounded w-1/4" />
        <div class="aspect-video bg-gray-200 rounded-lg" />
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 rounded" />
          <div class="h-4 bg-gray-200 rounded" />
          <div class="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>

      <!-- Content -->
      <article v-else-if="post" class="pt-24">
        <!-- Category -->
        <NuxtLink
          v-if="post.category"
          :to="localePath(`/blog/category/${post.category.slug}`)"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {{ post.category.title || post.category.name }}
        </NuxtLink>

        <!-- Title -->
        <h1 class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {{ post.title }}
        </h1>

        <!-- Meta -->
        <div class="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <!-- Author -->
          <div v-if="post.author" class="flex items-center gap-2">
            <div class="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
              <NuxtImg
                v-if="post.author.avatar"
                :src="post.author.avatar"
                :alt="post.author.name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="font-medium text-gray-700">{{ post.author.name }}</span>
          </div>
          
          <span class="flex items-center gap-1">
            <Calendar class="h-4 w-4" />
            {{ formatDate(post.published_at) }}
          </span>
          
          <span v-if="post.reading_time" class="flex items-center gap-1">
            <Clock class="h-4 w-4" />
            {{ post.reading_time }} min read
          </span>
        </div>

        <!-- Featured image -->
        <div v-if="featuredImageUrl" class="mt-8 aspect-video overflow-hidden rounded-lg bg-gray-100">
          <NuxtImg
            :src="featuredImageUrl"
            :alt="post.title"
            class="h-full w-full object-cover object-center"
          />
        </div>

        <!-- Content -->
        <div 
          v-if="post.content"
          class="mt-8 prose prose-lg prose-indigo max-w-none"
        >
          <!-- Render as HTML if it contains HTML tags, otherwise as plain text -->
          <!-- eslint-disable vue/no-v-html -->
          <div 
            v-if="post.content && typeof post.content === 'string' && post.content.includes('<')"
            v-html="post.content" 
          />
          <!-- eslint-enable vue/no-v-html -->
          <div 
            v-else-if="post.content"
            class="whitespace-pre-wrap text-gray-700"
          >
            {{ post.content }}
          </div>
        </div>
        <div v-else class="mt-8 text-gray-500 italic">
          No content available for this post.
        </div>

        <!-- Tags -->
        <div v-if="post.tags?.length" class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Share -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <p class="text-sm font-medium text-gray-700 mb-4">Share this article</p>
          <div class="flex gap-3">
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent($route.fullPath)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook class="h-5 w-5" />
            </a>
            <a
              :href="`https://twitter.com/intent/tweet?url=${encodeURIComponent($route.fullPath)}&text=${encodeURIComponent(post.title)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              <Twitter class="h-5 w-5" />
            </a>
            <a
              :href="`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent($route.fullPath)}&title=${encodeURIComponent(post.title)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Linkedin class="h-5 w-5" />
            </a>
          </div>
        </div>
      </article>

      <!-- Comments -->
      <ClientOnly>
        <BlogComments v-if="post" :post-id="post.id" />
      </ClientOnly>
    </main>
  </div>
</template>

