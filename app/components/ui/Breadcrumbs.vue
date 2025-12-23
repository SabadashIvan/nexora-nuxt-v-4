<script setup lang="ts">
/**
 * Breadcrumb navigation component
 */

interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  items: BreadcrumbItem[]
  showHome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHome: true,
})

const allItems = computed(() => {
  if (props.showHome) {
    return [{ label: 'Home', to: '/' }, ...props.items]
  }
  return props.items
})
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol role="list" class="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
      <template v-for="(item, index) in allItems" :key="index">
        <li v-if="index !== allItems.length - 1">
          <div class="flex items-center">
            <NuxtLink
              v-if="item.to"
              :to="item.to"
              class="mr-2 text-sm font-medium text-gray-900"
            >
              {{ item.label }}
            </NuxtLink>
            <span v-else class="mr-2 text-sm font-medium text-gray-900">
              {{ item.label }}
            </span>
            <svg
              viewBox="0 0 16 20"
              width="16"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              class="h-5 w-4 text-gray-300"
            >
              <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
            </svg>
          </div>
        </li>
        <li v-else class="text-sm">
          <a
            href="#"
            aria-current="page"
            class="font-medium text-gray-500 hover:text-gray-600"
          >
            {{ item.label }}
          </a>
        </li>
      </template>
    </ol>
  </nav>
</template>

