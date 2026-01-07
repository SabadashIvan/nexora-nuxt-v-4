<script setup lang="ts">
/**
 * Blog listing page - SSR for SEO
 */
const route = useRoute()
const blogStore = useBlogStore()

const page = computed(() => route.query.page ? parseInt(route.query.page as string) : 1)

// Fetch posts and categories with SSR
const { pending } = await useAsyncData(
  `blog-posts-${page.value}`,
  async () => {
    await blogStore.fetchPosts({ page: page.value })
    return blogStore.posts
  },
  { watch: [page] }
)

await useAsyncData('blog-categories', async () => {
  if (blogStore.categories.length === 0) {
    await blogStore.fetchCategories()
  }
  return blogStore.categories
})

const posts = computed(() => blogStore.posts)
const categories = computed(() => blogStore.categories)
const pagination = computed(() => blogStore.pagination)

// Locale-aware navigation
const localePath = useLocalePath()

function handlePageChange(newPage: number) {
  navigateTo({ path: localePath('/blog'), query: { page: newPage.toString() } })
}
</script>

<template>
  <div class="bg-white">
    <!-- Breadcrumbs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <UiBreadcrumbs :items="[{ label: 'Blog' }]" class="mb-6" />
    </div>

    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
      <!-- Header -->
      <div class="flex items-baseline justify-between border-b border-gray-200 pt-24 pb-6">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-gray-900">Our Blog</h1>
          <p class="mt-2 text-base text-gray-600">
            Discover tips, guides, and stories from our team
          </p>
        </div>
      </div>

      <!-- Categories -->
      <div v-if="categories.length" class="flex flex-wrap gap-2 mt-6 pb-6 border-b border-gray-200">
        <NuxtLink
          :to="localePath('/blog')"
          class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
          :class="[
            !route.query.category 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          All Posts
        </NuxtLink>
        <NuxtLink
          v-for="category in categories"
          :key="category.id"
          :to="localePath(`/blog/category/${category.slug}`)"
          class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {{ category.title || category.name }}
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="group relative animate-pulse">
          <div class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75">
            <div class="h-full w-full bg-gray-300" />
          </div>
          <div class="mt-4 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-1/4" />
            <div class="h-6 bg-gray-200 rounded w-3/4" />
            <div class="h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      <!-- Posts -->
      <div v-else-if="posts.length" class="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>

      <!-- Empty -->
      <div v-else class="mt-12">
        <UiEmptyState title="No posts yet" description="Check back soon for new content" />
      </div>

      <!-- Pagination -->
      <div v-if="pagination.lastPage > 1" class="mt-12">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.lastPage"
          @update:current-page="handlePageChange"
        />
      </div>
    </main>
  </div>
</template>

