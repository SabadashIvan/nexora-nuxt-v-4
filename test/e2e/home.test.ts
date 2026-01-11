import { describe, it, expect } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Home Page', async () => {
  await setup({
    rootDir: '.',
    // Isolate content database to avoid conflicts between tests
    server: {
      port: 0, // Use random port
    },
  })

  it('should load home page', async () => {
    const html = await $fetch('/')
    expect(html).toBeTruthy()
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('should render page content', async () => {
    const html = await $fetch('/')
    // Basic check that page has content
    expect(html.length).toBeGreaterThan(100)
  })

  it('should have proper HTML structure', async () => {
    const html = await $fetch('/')
    // Check for common HTML elements
    expect(html).toMatch(/<html/i)
    expect(html).toMatch(/<body/i)
  })
})
