import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatPriceValue,
  getCurrencySymbol,
  calculateDiscountPercent,
  formatDiscountPercent,
  hasDiscount,
  formatPriceRange,
  parsePriceToMinorUnits,
} from '~/utils/price'

describe('price', () => {
  describe('formatPrice', () => {
    it('should format USD price correctly', () => {
      const result = formatPrice(10000, { currency: 'USD' })
      expect(result).toContain('100')
      expect(result).toContain('$')
    })

    it('should format EUR price correctly', () => {
      const result = formatPrice(5000, { currency: 'EUR' })
      expect(result).toContain('50')
      expect(result).toContain('€')
    })

    it('should format UAH price correctly', () => {
      const result = formatPrice(2500, { currency: 'UAH' })
      expect(result).toContain('25')
      expect(result).toContain('₴')
    })

    it('should handle custom locale', () => {
      const result = formatPrice(10000, { currency: 'USD', locale: 'en-US' })
      expect(result).toBeTruthy()
    })

    it('should format without currency symbol', () => {
      const result = formatPrice(10000, { currency: 'USD', showCurrency: false })
      expect(result).not.toContain('$')
      expect(result).toContain('100')
    })

    it('should handle custom fraction digits', () => {
      const result = formatPrice(10000, {
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      expect(result).toContain('100')
    })

    it('should handle fallback for invalid currency', () => {
      const result = formatPrice(10000, { currency: 'INVALID' })
      expect(result).toBeTruthy()
    })
  })

  describe('formatPriceValue', () => {
    it('should format price without currency', () => {
      const result = formatPriceValue(10000, { currency: 'USD' })
      expect(result).not.toContain('$')
      expect(result).toContain('100')
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('should return currency code if symbol not found', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('calculateDiscountPercent', () => {
    it('should calculate correct discount percentage', () => {
      expect(calculateDiscountPercent(10000, 8000)).toBe(20)
      expect(calculateDiscountPercent(10000, 5000)).toBe(50)
    })

    it('should return 0 if no discount', () => {
      expect(calculateDiscountPercent(10000, 10000)).toBe(0)
      expect(calculateDiscountPercent(10000, 12000)).toBe(0)
    })

    it('should return 0 for invalid prices', () => {
      expect(calculateDiscountPercent(0, 5000)).toBe(0)
      expect(calculateDiscountPercent(-1000, 5000)).toBe(0)
    })
  })

  describe('formatDiscountPercent', () => {
    it('should format discount with minus sign', () => {
      expect(formatDiscountPercent(10000, 8000)).toBe('-20%')
      expect(formatDiscountPercent(10000, 5000)).toBe('-50%')
    })

    it('should return empty string if no discount', () => {
      expect(formatDiscountPercent(10000, 10000)).toBe('')
      expect(formatDiscountPercent(10000, 12000)).toBe('')
    })
  })

  describe('hasDiscount', () => {
    it('should return true if effective price is less', () => {
      expect(hasDiscount(10000, 8000)).toBe(true)
    })

    it('should return false if prices are equal', () => {
      expect(hasDiscount(10000, 10000)).toBe(false)
    })

    it('should return false if effective price is greater', () => {
      expect(hasDiscount(10000, 12000)).toBe(false)
    })
  })

  describe('formatPriceRange', () => {
    it('should format single price if min equals max', () => {
      const result = formatPriceRange(10000, 10000, { currency: 'USD' })
      expect(result).not.toContain('-')
    })

    it('should format price range', () => {
      const result = formatPriceRange(5000, 10000, { currency: 'USD' })
      expect(result).toContain('-')
      expect(result).toContain('50')
      expect(result).toContain('100')
    })
  })

  describe('parsePriceToMinorUnits', () => {
    it('should parse price string with dollar sign', () => {
      expect(parsePriceToMinorUnits('$100.50')).toBe(10050)
    })

    it('should parse price string with comma', () => {
      expect(parsePriceToMinorUnits('100,50')).toBe(10050)
    })

    it('should parse simple number string', () => {
      expect(parsePriceToMinorUnits('100.50')).toBe(10050)
    })

    it('should handle whole numbers', () => {
      expect(parsePriceToMinorUnits('100')).toBe(10000)
    })

    it('should round to nearest cent', () => {
      // parseFloat('100.999') * 100 = 10099.9, Math.round = 10100
      expect(parsePriceToMinorUnits('100.999')).toBe(10100)
    })

    it('should handle empty string', () => {
      // Empty string results in NaN, which when multiplied becomes NaN
      const result = parsePriceToMinorUnits('')
      expect(isNaN(result) || result === 0).toBe(true)
    })
  })
})
