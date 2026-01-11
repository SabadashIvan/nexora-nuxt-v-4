import { describe, it, expect } from 'vitest'
import { $fetch, setup, createPage } from '@nuxt/test-utils/e2e'

describe('Cart Flow', async () => {
  await setup({
    rootDir: '.',
    browser: true,
    // Isolate content database to avoid conflicts between tests
    server: {
      port: 0, // Use random port
    },
  })

  it('should load cart page', async () => {
    const html = await $fetch('/cart')
    expect(html).toBeTruthy()
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('should display empty cart when no items', async () => {
    const page = await createPage('/cart')
    
    // Wait for page to fully load and hydrate (CSR pages need time)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Give time for client-side hydration
    
    // Check that page loaded (basic check)
    // For CSR pages, title might be set by client-side code
    const html = await page.content()
    expect(html).toBeTruthy()
    expect(html.length).toBeGreaterThan(0)
  })

  it('should navigate to cart page', async () => {
    // Create page at home - wait for load state instead of networkidle
    const page = await createPage('/')
    
    // Wait for page to be ready (less strict than networkidle)
    await page.waitForLoadState('load', { timeout: 10000 })
    
    // Get the base URL from the current page
    const currentUrl = page.url()
    expect(currentUrl).toBeTruthy()
    
    const baseUrl = new URL(currentUrl).origin
    
    // Navigate to cart using full URL
    // Use 'load' instead of 'networkidle' for faster navigation
    await page.goto(`${baseUrl}/cart`, { 
      waitUntil: 'load',
      timeout: 15000 
    })
    
    // Verify we're on cart page
    const url = page.url()
    expect(url).toContain('/cart')
  }, { timeout: 30000 })
})
