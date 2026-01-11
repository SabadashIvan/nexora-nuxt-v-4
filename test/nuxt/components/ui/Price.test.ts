import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Price from '~/components/ui/Price.vue'
import type { ProductPrice } from '~/types'

// Mock system store
vi.mock('~/stores/system.store', () => ({
  useSystemStore: vi.fn(() => ({
    currentCurrency: 'USD',
  })),
}))

describe('Price component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render price from number', () => {
    const wrapper = mount(Price, {
      props: {
        price: 10000, // $100.00 in minor units
      },
    })
    
    expect(wrapper.text()).toContain('100')
  })

  it('should render price from ProductPrice object', () => {
    const priceObject: ProductPrice = {
      list_minor: '10000',
      effective_minor: '8000',
      currency: 'USD',
    }
    
    const wrapper = mount(Price, {
      props: {
        price: priceObject,
      },
    })
    
    expect(wrapper.text()).toBeTruthy()
  })

  it('should show discount when effective price is less', () => {
    const wrapper = mount(Price, {
      props: {
        price: 10000,
        effectivePrice: 8000,
        showDiscount: true,
      },
    })
    
    // Should show original price with line-through
    const originalPrice = wrapper.find('.line-through')
    expect(originalPrice.exists()).toBe(true)
  })

  it('should hide discount badge when showDiscount is false', () => {
    const wrapper = mount(Price, {
      props: {
        price: 10000,
        effectivePrice: 8000,
        showDiscount: false,
      },
    })
    
    // Discount badge should not be visible
    const badge = wrapper.find('.bg-red-100')
    expect(badge.exists()).toBe(false)
  })

  it('should apply size classes correctly', () => {
    const wrapper = mount(Price, {
      props: {
        price: 10000,
        size: 'lg',
      },
    })
    
    // Size class is applied to the price span, not the root div
    const priceSpan = wrapper.find('span.text-lg')
    expect(priceSpan.exists()).toBe(true)
  })

  it('should handle different currencies', () => {
    const wrapper = mount(Price, {
      props: {
        price: 10000,
        currency: 'EUR',
      },
    })
    
    expect(wrapper.text()).toBeTruthy()
  })

  it('should handle zero price', () => {
    const wrapper = mount(Price, {
      props: {
        price: 0,
      },
    })
    
    expect(wrapper.text()).toBeTruthy()
  })

  it('should handle null/undefined price gracefully', () => {
    const wrapper = mount(Price, {
      props: {
        price: undefined,
      },
    })
    
    // Component should render without errors
    expect(wrapper.exists()).toBe(true)
  })
})
