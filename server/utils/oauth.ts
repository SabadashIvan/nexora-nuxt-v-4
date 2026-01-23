/**
 * OAuth-related server utilities
 */

export function getNameParts(name?: string): {
  firstName: string
  lastName: string
  fullName: string
} {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return { firstName: 'OAuth', lastName: 'User', fullName: 'OAuth User' }
  }
  const parts = trimmed.split(' ')
  const firstName = parts[0] || trimmed
  const lastName = parts.slice(1).join(' ') || 'User'
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
  }
}
