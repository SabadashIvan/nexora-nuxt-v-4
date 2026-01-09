import { describe, it, expect } from 'vitest'
import { generateUUID, TOKEN_KEYS } from '~/utils/tokens'

describe('tokens', () => {
  describe('generateUUID', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUUID()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })

    it('should generate multiple unique UUIDs', () => {
      const uuids = new Set()
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID())
      }
      expect(uuids.size).toBe(100)
    })

    it('should have correct version identifier (4)', () => {
      const uuid = generateUUID()
      const parts = uuid.split('-')
      expect(parts[2][0]).toBe('4')
    })

    it('should have correct variant bits (8, 9, a, or b)', () => {
      const uuid = generateUUID()
      const parts = uuid.split('-')
      const variantChar = parts[3][0].toLowerCase()
      expect(['8', '9', 'a', 'b']).toContain(variantChar)
    })
  })

  describe('TOKEN_KEYS', () => {
    it('should have all required token keys', () => {
      expect(TOKEN_KEYS.CART).toBe('cart_token')
      expect(TOKEN_KEYS.GUEST).toBe('guest_id')
      expect(TOKEN_KEYS.COMPARISON).toBe('comparison_token')
      expect(TOKEN_KEYS.LOCALE).toBe('locale')
      expect(TOKEN_KEYS.CURRENCY).toBe('currency')
    })
  })
})
