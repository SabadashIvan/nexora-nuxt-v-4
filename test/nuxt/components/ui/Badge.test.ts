import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '~/components/ui/Badge.vue'

describe('Badge component', () => {
  it('should render with default variant', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Test Badge',
      },
    })
    
    expect(wrapper.text()).toBe('Test Badge')
    expect(wrapper.classes()).toContain('bg-gray-100')
  })

  it('should apply success variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'success',
      },
      slots: {
        default: 'Success',
      },
    })
    
    expect(wrapper.classes()).toContain('bg-green-100')
  })

  it('should apply warning variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'warning',
      },
      slots: {
        default: 'Warning',
      },
    })
    
    expect(wrapper.classes()).toContain('bg-yellow-100')
  })

  it('should apply error variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'error',
      },
      slots: {
        default: 'Error',
      },
    })
    
    expect(wrapper.classes()).toContain('bg-red-100')
  })

  it('should apply info variant', () => {
    const wrapper = mount(Badge, {
      props: {
        variant: 'info',
      },
      slots: {
        default: 'Info',
      },
    })
    
    expect(wrapper.classes()).toContain('bg-blue-100')
  })

  it('should apply size classes', () => {
    const wrapper = mount(Badge, {
      props: {
        size: 'sm',
      },
      slots: {
        default: 'Small',
      },
    })
    
    expect(wrapper.classes()).toContain('text-xs')
  })

  it('should render slot content', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Custom Content',
      },
    })
    
    expect(wrapper.text()).toBe('Custom Content')
  })
})
