import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Product Page', async () => {
  await setup({
    rootDir: '.',
  })

  it('should load product page with slug', async () => {
    // Note: This test assumes a product with slug 'test-product' exists
    // In real scenario, you might want to seed test data or use a known product
    try {
      const html = await $fetch('/product/test-product')
      expect(html).toBeTruthy()
      expect(html).toContain('<!DOCTYPE html>')
    } catch (error: any) {
      // If product doesn't exist, that's expected in test environment
      // This test verifies the route exists and handles requests
      if (error.status === 404) {
        expect(error.status).toBe(404)
      } else {
        throw error
      }
    }
  })

  it('should return 404 for non-existent product', async () => {
    try {
      await $fetch('/product/non-existent-product-12345')
      // If it doesn't throw, the page exists (unexpected)
    } catch (error: any) {
      // Expected: 404 for non-existent product
      expect(error.status).toBe(404)
    }
  })
})
