<script setup lang="ts">
/**
 * Sort dropdown for catalog - Tailwind template design
 */

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const options = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

const currentLabel = computed(() => {
  return options.find(o => o.value === props.modelValue)?.label || 'Most Popular'
})

const dropdownRef = ref<HTMLElement>()

function selectOption(value: string) {
  emit('update:modelValue', value)
  isOpen.value = false
}

// Close on click outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (dropdownRef.value && !dropdownRef.value.contains(target)) {
      isOpen.value = false
    }
  })
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <button
      type="button"
      class="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900"
      @click="isOpen = !isOpen"
    >
      Sort
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        data-slot="icon"
        aria-hidden="true"
        class="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500"
        :class="{ 'rotate-180': isOpen }"
      >
        <path
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clip-rule="evenodd"
          fill-rule="evenodd"
        />
      </svg>
    </button>

    <Transition
      enter-active-class="transition transition-discrete duration-100 ease-out"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition transition-discrete duration-75 ease-in"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black/5 focus:outline-hidden z-10"
      >
        <div class="py-1">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="block w-full px-4 py-2 text-sm text-left focus:bg-gray-100 focus:outline-hidden"
            :class="option.value === modelValue ? 'font-medium text-gray-900' : 'text-gray-500'"
            @click="selectOption(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

