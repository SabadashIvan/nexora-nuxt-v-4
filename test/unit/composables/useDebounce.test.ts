import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebouncedRef, useDebounce, useThrottle } from '~/composables/useDebounce'

// Mock onUnmounted (auto-imported in Nuxt)
global.onUnmounted = vi.fn((fn) => {
  // Store cleanup function but don't execute immediately
  // This allows testing the composable without actual unmount
})

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('useDebouncedRef', () => {
    it('should debounce value changes', async () => {
      const source = ref('initial')
      const debounced = useDebouncedRef(source, 300)

      expect(debounced.value).toBe('initial')

      source.value = 'changed'
      await nextTick() // Wait for watch to register change
      expect(debounced.value).toBe('initial') // Not updated yet

      vi.advanceTimersByTime(300)
      await nextTick() // Wait for debounced update
      expect(debounced.value).toBe('changed')
    })

    it('should cancel previous timeout on rapid changes', async () => {
      const source = ref('initial')
      const debounced = useDebouncedRef(source, 300)

      source.value = 'first'
      await nextTick()
      vi.advanceTimersByTime(100)
      source.value = 'second'
      await nextTick()
      vi.advanceTimersByTime(100)
      source.value = 'third'
      await nextTick()
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debounced.value).toBe('third')
    })

    it('should use default delay of 300ms', async () => {
      const source = ref('initial')
      const debounced = useDebouncedRef(source)

      source.value = 'changed'
      await nextTick()
      vi.advanceTimersByTime(300)
      await nextTick()
      expect(debounced.value).toBe('changed')
    })
  })

  describe('useDebounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn()
      const { debounced } = useDebounce(fn, 300)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls on rapid invocations', async () => {
      const fn = vi.fn()
      const { debounced } = useDebounce(fn, 300)

      debounced()
      vi.advanceTimersByTime(100)
      debounced()
      vi.advanceTimersByTime(100)
      debounced()
      vi.advanceTimersByTime(300)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', async () => {
      const fn = vi.fn()
      const { debounced } = useDebounce(fn, 300)

      debounced('arg1', 'arg2')
      vi.advanceTimersByTime(300)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should track pending state', async () => {
      const fn = vi.fn()
      const { debounced, pending } = useDebounce(fn, 300)

      expect(pending.value).toBe(false)

      debounced()
      expect(pending.value).toBe(true)

      vi.advanceTimersByTime(300)
      expect(pending.value).toBe(false)
    })

    it('should allow cancellation', async () => {
      const fn = vi.fn()
      const { debounced, cancel, pending } = useDebounce(fn, 300)

      debounced()
      expect(pending.value).toBe(true)

      cancel()
      expect(pending.value).toBe(false)

      vi.advanceTimersByTime(300)
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('useThrottle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn()
      const throttled = useThrottle(fn, 300)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1) // Not called again

      vi.advanceTimersByTime(300)
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments correctly', async () => {
      const fn = vi.fn()
      const throttled = useThrottle(fn, 300)

      throttled('arg1', 'arg2')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should allow multiple calls after interval', async () => {
      const fn = vi.fn()
      const throttled = useThrottle(fn, 300)

      throttled()
      vi.advanceTimersByTime(300)
      throttled()
      vi.advanceTimersByTime(300)
      throttled()

      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})
