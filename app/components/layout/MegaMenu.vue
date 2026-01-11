<script setup lang="ts">
/**
 * Mega Menu Component - Structured category menu
 * - First level: shows on Catalog button hover
 * - Second level: shows children of active menu item in 3 fixed columns
 * - Third level: shows children below second level items (not on hover)
 * - Main items are bold to show category structure
 * - Fixed height: 700px with scrollbar
 */
import type { MenuItem } from '~/types'
import { makeLocalePath } from '~/utils/locale-link'

interface Props {
  menuItems: MenuItem[]
  activeMenuId: number
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Locale-aware navigation
const localePath = useLocalePath()

const hoveredItemId = ref<number | null>(null)

function handleLinkClick() {
  emit('close')
}

// Helper function to find menu item by ID recursively
function findMenuItemById(items: MenuItem[], id: number): MenuItem | undefined {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children && item.children.length > 0) {
      const found = findMenuItemById(item.children, id)
      if (found) return found
    }
  }
  return undefined
}

// Get active menu item
const activeMenuItem = computed(() => {
  return props.menuItems.find(m => m.id === props.activeMenuId)
})

// Get hovered item's children grouped into columns
const hoveredItemChildren = computed(() => {
  // First check hovered item, then fall back to active menu item
  if (hoveredItemId.value) {
    const item = findMenuItemById(props.menuItems, hoveredItemId.value)
    return item?.children || []
  }
  
  // Use active menu item children if no hover
  return activeMenuItem.value?.children || []
})

// Group children into 3 fixed columns
const secondLevelColumns = computed(() => {
  const children = hoveredItemChildren.value
  if (children.length === 0) return [[], [], []]
  
  // Always use 3 columns
  const itemsPerColumn = Math.ceil(children.length / 3)
  
  const cols: MenuItem[][] = []
  for (let i = 0; i < 3; i++) {
    const start = i * itemsPerColumn
    const end = start + itemsPerColumn
    cols.push(children.slice(start, end))
  }
  
  return cols
})

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
          <!-- Fixed height container with scrollbar -->
          <div class="h-[700px] overflow-y-auto py-6">
            <!-- Three columns grid -->
            <div
              v-if="secondLevelColumns.length > 0"
              class="grid grid-cols-3 gap-8"
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
                  <!-- Main Category (Bold) -->
                  <div class="mb-3">
                    <NuxtLink
                      :to="makeLocalePath(item.link, localePath)"
                      :target="item.target"
                      class="block font-bold text-gray-900 hover:text-indigo-600 transition-colors text-base"
                      @click="handleLinkClick"
                    >
                      {{ item.title }}
                    </NuxtLink>
                  </div>
                  
                  <!-- Children subitems shown below main item (recursive) -->
                  <div
                    v-if="item.children && item.children.length > 0"
                    class="space-y-2"
                  >
                    <template v-for="child in item.children" :key="child.id">
                      <!-- Second level item -->
                      <div>
                        <NuxtLink
                          :to="makeLocalePath(child.link, localePath)"
                          :target="child.target"
                          class="block text-sm text-gray-600 hover:text-indigo-600 transition-colors py-1"
                          @click="handleLinkClick"
                        >
                          {{ child.title }}
                        </NuxtLink>
                        <!-- Third level children (if any) -->
                        <div
                          v-if="child.children && child.children.length > 0"
                          class="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3"
                        >
                          <NuxtLink
                            v-for="grandchild in child.children"
                            :key="grandchild.id"
                            :to="makeLocalePath(grandchild.link, localePath)"
                            :target="grandchild.target"
                            class="block text-xs text-gray-500 hover:text-indigo-600 transition-colors py-0.5"
                            @click="handleLinkClick"
                          >
                            {{ grandchild.title }}
                          </NuxtLink>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
