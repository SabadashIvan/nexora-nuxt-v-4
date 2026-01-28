<script setup lang="ts">
/**
 * Custom checkbox component matching Tailwind template
 */
interface Props {
  modelValue: boolean
  id?: string
  name?: string
  value?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  name: undefined,
  value: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checkboxId = computed(() => props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`)
</script>

<template>
  <div class="flex h-5 shrink-0 items-center">
    <div class="group grid size-4 grid-cols-1">
      <input
        :id="checkboxId"
        :name="name"
        :value="value"
        :checked="modelValue"
        :disabled="disabled"
        type="checkbox"
        class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      >
      <svg
        viewBox="0 0 14 14"
        fill="none"
        class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
        :class="disabled ? 'stroke-gray-950/25' : ''"
      >
        <path
          d="M3 8L6 11L11 3.5"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="modelValue ? 'opacity-100' : 'opacity-0'"
        />
        <path
          d="M3 7H11"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="opacity-0"
        />
      </svg>
    </div>
  </div>
</template>

