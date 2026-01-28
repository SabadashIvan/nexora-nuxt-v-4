/**
 * Composable to classify variant axes into color, size, and remaining (generic).
 * Used by PDP to render color swatch, size selector, and generic fallback for other axes
 * (e.g. material, length) so all variant dimensions are selectable.
 */

import { computed, type ComputedRef } from 'vue'
import type { VariantOptions, VariantOptionAxis } from '~/types'

function isColorAxis(axis: VariantOptionAxis): boolean {
  const code = axis.code.toLowerCase()
  const title = axis.title.toLowerCase()
  return code === 'color' || title.includes('color')
}

function isSizeAxis(axis: VariantOptionAxis): boolean {
  const code = axis.code.toLowerCase()
  const title = axis.title.toLowerCase()
  if (code === 'color' || title.includes('color')) return false
  return (
    code === 'size' ||
    code === 'thickness' ||
    code === 'dimension' ||
    title.includes('size') ||
    title.includes('thickness') ||
    title.includes('dimension')
  )
}

export function useVariantAxes(
  variantOptions: ComputedRef<VariantOptions | null | undefined>
): {
  colorAxis: ComputedRef<VariantOptionAxis | null>
  sizeAxis: ComputedRef<VariantOptionAxis | null>
  remainingAxes: ComputedRef<VariantOptionAxis[]>
} {
  const colorAxis = computed(() => {
    const axes = variantOptions.value?.axes
    if (!axes?.length) return null
    return axes.find(isColorAxis) ?? null
  })

  const sizeAxis = computed(() => {
    const axes = variantOptions.value?.axes
    if (!axes?.length) return null
    return axes.find(isSizeAxis) ?? null
  })

  const remainingAxes = computed(() => {
    const axes = variantOptions.value?.axes
    if (!axes?.length) return []
    const color = colorAxis.value
    const size = sizeAxis.value
    return axes.filter((a) => a !== color && a !== size)
  })

  return { colorAxis, sizeAxis, remainingAxes }
}
