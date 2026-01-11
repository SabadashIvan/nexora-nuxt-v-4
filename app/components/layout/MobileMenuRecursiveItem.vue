<script setup lang="ts">
/**
 * Recursive menu item component for mobile menu
 * Handles nested children at any depth
 */
import { ChevronRight } from 'lucide-vue-next'
import type { MenuItem } from '~/types'
import { getImageUrl } from '~/utils/image'
import { makeLocalePath } from '~/utils/locale-link'

interface Props {
  item: MenuItem
  level: number
  expandedIds: Set<number>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [id: number]
  close: []
}>()

const localePath = useLocalePath()

function getMenuItemImage(item: MenuItem) {
  return getImageUrl(item.icon)
}

function handleToggle() {
  emit('toggle', props.item.id)
}

function handleClose() {
  emit('close')
}

const isExpanded = computed(() => props.expandedIds.has(props.item.id))
const hasChildren = computed(() => props.item.children && props.item.children.length > 0)
const paddingLeft = computed(() => props.level * 16)
</script>

<template>
  <div class="border-b border-gray-200 last:border-b-0">
    <!-- Menu Item with icon and link -->
    <div class="flex items-center" :style="{ paddingLeft: paddingLeft + 'px' }">
      <NuxtLink
        :to="makeLocalePath(item.link, localePath)"
        :target="item.target"
        class="flex flex-1 items-center gap-3 py-4 text-base font-medium text-gray-900"
        :class="{ 'text-sm text-gray-600': level > 0 }"
        @click="handleClose"
      >
        <!-- Icon if available (only show for level 0) -->
        <NuxtImg
          v-if="level === 0 && getMenuItemImage(item)"
          :src="getMenuItemImage(item)!"
          :alt="item.title"
          class="size-8 shrink-0 rounded-lg bg-gray-100 object-cover"
        />
        <span class="flex-1">{{ item.title }}</span>
      </NuxtLink>
      
      <!-- Expand button if has children -->
      <button
        v-if="hasChildren"
        type="button"
        class="ml-2 flex items-center p-2 text-gray-400"
        @click.stop="handleToggle"
      >
        <ChevronRight
          class="size-5 transition-transform"
          :class="isExpanded ? 'rotate-90' : ''"
        />
      </button>
    </div>
    
    <!-- Children submenu (recursive) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-96"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isExpanded && hasChildren"
        class="overflow-hidden pb-2"
      >
        <MobileMenuRecursiveItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :level="level + 1"
          :expanded-ids="expandedIds"
          @toggle="emit('toggle', $event)"
          @close="handleClose"
        />
      </div>
    </Transition>
  </div>
</template>
