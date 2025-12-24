<script setup lang="ts">
/**
 * Mega Menu Component - Two-level hover menu
 * - First level: shows on Catalog button hover
 * - Second level: shows on first level item hover
 * - Banner: fixed 350px width on the right
 */
import type { MenuItem } from '~/types'
import { ChevronRight } from 'lucide-vue-next'
import { getImageUrl } from '~/utils/image'

interface Props {
  menuItems: MenuItem[]
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const hoveredItemId = ref<number | null>(null)

function handleLinkClick() {
  emit('close')
}

function getItemImage(item: MenuItem) {
  return getImageUrl(item.icon)
}

function getBannerImage(item: MenuItem) {
  return getImageUrl(item.banner_desktop)
}

// Get hovered item's children grouped into columns
const hoveredItemChildren = computed(() => {
  if (!hoveredItemId.value) return []
  
  const item = props.menuItems.find(m => m.id === hoveredItemId.value)
  return item?.children || []
})

// Group children into columns for second level
const secondLevelColumns = computed(() => {
  const children = hoveredItemChildren.value
  if (children.length === 0) return []
  
  // Calculate columns (max 4 columns)
  const columnCount = Math.min(4, Math.ceil(children.length / 8))
  const itemsPerColumn = Math.ceil(children.length / columnCount)
  
  const cols: MenuItem[][] = []
  for (let i = 0; i < columnCount; i++) {
    const start = i * itemsPerColumn
    const end = start + itemsPerColumn
    cols.push(children.slice(start, end))
  }
  
  return cols
})

// Get banner from hovered item
const hoveredItemBanner = computed(() => {
  if (!hoveredItemId.value) return null
  
  const item = props.menuItems.find(m => m.id === hoveredItemId.value)
  return item ? getBannerImage(item) : null
})

function handleFirstLevelHover(itemId: number | null) {
  hoveredItemId.value = itemId
}

function handleMouseLeave() {
  hoveredItemId.value = null
}
</script>

<template>
  <Transition
    enter-active-class="transition transition-discrete duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition transition-discrete duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="isOpen"
      class="w-full bg-white text-sm text-gray-500 shadow-xl"
      @mouseleave="handleMouseLeave"
      @click.stop
    >
      <div class="relative w-full bg-white">
        <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex gap-0 py-6 min-h-[400px]">
            <!-- First Level: Left sidebar with main categories -->
            <div class="w-64 shrink-0 border-r border-gray-200 pr-6">
              <div v-if="menuItems && menuItems.length > 0" class="space-y-1">
                <NuxtLink
                  v-for="item in menuItems"
                  :key="item.id"
                  :to="item.link"
                  :target="item.target"
                  class="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  :class="hoveredItemId === item.id ? 'bg-gray-50 text-indigo-600' : ''"
                  @mouseenter="handleFirstLevelHover(item.id)"
                  @click="handleLinkClick"
                >
                  <span>{{ item.title }}</span>
                  <ChevronRight
                    v-if="item.children && item.children.length > 0"
                    class="size-4 text-gray-400 transition-opacity"
                    :class="hoveredItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                  />
                </NuxtLink>
              </div>
              <div v-else class="p-4 text-sm text-gray-500">
                No menu items available
              </div>
            </div>

            <!-- Second Level: Subcategories (shows on hover) -->
            <div
              v-if="hoveredItemId && secondLevelColumns.length > 0"
              class="flex-1 px-6"
            >
              <div
                class="grid gap-8"
                :class="{
                  'grid-cols-2': secondLevelColumns.length === 2,
                  'grid-cols-3': secondLevelColumns.length === 3,
                  'grid-cols-4': secondLevelColumns.length === 4,
                }"
              >
                <div
                  v-for="(column, colIndex) in secondLevelColumns"
                  :key="colIndex"
                  class="space-y-6"
                >
                  <div
                    v-for="item in column"
                    :key="item.id"
                    class="group"
                  >
                    <!-- Category with icon -->
                    <div class="flex items-start space-x-3">
                      <NuxtImg
                        v-if="getItemImage(item)"
                        :src="getItemImage(item)!"
                        :alt="item.title"
                        class="size-12 shrink-0 rounded-lg bg-gray-100 object-cover"
                      />
                      <div class="flex-1 min-w-0">
                        <NuxtLink
                          :to="item.link"
                          :target="item.target"
                          class="block font-medium text-gray-900 hover:text-indigo-600"
                          @click="handleLinkClick"
                        >
                          {{ item.title }}
                        </NuxtLink>
                        <!-- Sub-items if available -->
                        <ul
                          v-if="item.children && item.children.length > 0"
                          class="mt-2 space-y-1"
                        >
                          <li
                            v-for="subItem in item.children.slice(0, 6)"
                            :key="subItem.id"
                          >
                            <NuxtLink
                              :to="subItem.link"
                              :target="subItem.target"
                              class="text-sm text-gray-600 hover:text-gray-900"
                              @click="handleLinkClick"
                            >
                              {{ subItem.title }}
                            </NuxtLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Banner: Fixed 350px width on the right -->
            <div
              v-if="hoveredItemBanner"
              class="w-[300px] shrink-0 border-l border-gray-200 pl-4"
            >
              <NuxtLink
                :to="menuItems.find(m => m.id === hoveredItemId)?.link || '#'"
                class="block h-full"
                @click="handleLinkClick"
              >
                <NuxtImg
                  :src="hoveredItemBanner"
                  :alt="menuItems.find(m => m.id === hoveredItemId)?.title || ''"
                  class="h-full w-full rounded-lg object-cover"
                />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
