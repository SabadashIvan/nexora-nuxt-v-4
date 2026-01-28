import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CartCounter from '~/components/cart/CartCounter.vue'

// Mock cart store before importing component
const mockUseCartStore = vi.fn()
vi.mock('~/stores/cart.store', () => ({
  useCartStore: () => mockUseCartStore(),
}))

// Mock locale path
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app')
  return {
    ...actual,
    useLocalePath: vi.fn(() => (path: string) => path),
  }
})

describe('CartCounter component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render cart icon', () => {
    mockUseCartStore.mockReturnValue({
      itemCount: 0,
      cart: null,
      cartToken: null,
      loadCart: vi.fn(),
    })
    
    const wrapper = mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    expect(wrapper.find('.cart-icon').exists()).toBe(true)
  })

  it('should display item count badge when cart has items', () => {
    mockUseCartStore.mockReturnValue({
      itemCount: 5,
      cart: {
        items: [{ id: '1' }, { id: '2' }],
        totals: { items_minor: 5000, discounts_minor: 0, grand_total_minor: 5000 },
      },
      cartToken: 'test-token',
      loadCart: vi.fn(),
      formattedTotal: '$50.00',
    })
    
    const wrapper = mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    const badge = wrapper.find('.cart-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('should not display badge when cart is empty', () => {
    mockUseCartStore.mockReturnValue({
      itemCount: 0,
      cart: null,
      cartToken: null,
      loadCart: vi.fn(),
    })
    
    const wrapper = mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    const badge = wrapper.find('.cart-badge')
    expect(badge.exists()).toBe(false)
  })

  it('should display 99+ for counts over 99', () => {
    mockUseCartStore.mockReturnValue({
      itemCount: 150,
      cart: {
        items: Array(150).fill({ id: '1' }),
        totals: { items_minor: 150000, discounts_minor: 0, grand_total_minor: 150000 },
      },
      cartToken: 'test-token',
      loadCart: vi.fn(),
      formattedTotal: '$1,500.00',
    })
    
    const wrapper = mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    const badge = wrapper.find('.cart-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('99+')
  })

  it('should link to cart page', () => {
    mockUseCartStore.mockReturnValue({
      itemCount: 0,
      cart: null,
      cartToken: null,
      loadCart: vi.fn(),
    })
    
    const wrapper = mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('to')).toBe('/cart')
  })

  it('should load cart on mount if token exists', async () => {
    const mockLoadCart = vi.fn()
    mockUseCartStore.mockReturnValue({
      itemCount: 0,
      cart: null,
      cartToken: 'test-token',
      loadCart: mockLoadCart,
    })
    
    mount(CartCounter, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    
    // Wait for onMounted to execute
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(mockLoadCart).toHaveBeenCalled()
  })
})
