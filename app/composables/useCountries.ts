/**
 * Countries composable
 * Provides a list of countries with ISO codes for address forms
 */

export interface Country {
  code: string
  name: string
}

// Common countries list with ISO 3166-1 alpha-2 codes
const countries: Country[] = [
  // Europe
  { code: 'UA', name: 'Ukraine' },
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'MD', name: 'Moldova' },
  
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  
  // Asia
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'AM', name: 'Armenia' },
  
  // Oceania
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  
  // South America
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  
  // Africa
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MA', name: 'Morocco' },
]

// Sort alphabetically by name
const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name))

/**
 * Use countries composable
 * @returns Countries list and helper functions
 */
export function useCountries() {
  /**
   * Get all countries sorted alphabetically
   */
  const getCountries = (): Country[] => sortedCountries

  /**
   * Get country by code
   */
  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code)
  }

  /**
   * Get country name by code
   */
  const getCountryName = (code: string): string => {
    return getCountryByCode(code)?.name || code
  }

  return {
    countries: sortedCountries,
    getCountries,
    getCountryByCode,
    getCountryName,
  }
}

