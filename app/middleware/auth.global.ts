/**
 * Global auth middleware
 * - Redirects guests from protected routes
 * - Redirects authenticated users from auth-only routes
 * Uses session-based authentication (Laravel Sanctum)
 */

import { getActivePinia } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server - session cookies are handled by browser
  if (import.meta.server) return

  // Only try to access store if Pinia is initialized
  const pinia = getActivePinia()
  if (!pinia) {
    // Pinia not available yet - skip auth checks
    return
  }

  // Capture Nuxt context to preserve it after await
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore()
  
  // Initialize auth state if not done yet (check session)
  if (!authStore.initialized) {
    await nuxtApp.runWithContext(async () => await authStore.initialize())
  }

  const isAuthenticated = authStore.isAuthenticated

  // Check route groups from (protected) and (guest) folders
  const groups = to.meta.groups as string[] | undefined
  const isProtectedRoute = groups?.includes('protected') ?? false
  const isGuestOnlyRoute = groups?.includes('guest') ?? false

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const localePath = useLocalePath()
    return navigateTo({
      path: localePath('/auth/login'),
      query: { redirect: to.fullPath },
    })
  }

  // Redirect authenticated users from guest-only routes
  if (isGuestOnlyRoute && isAuthenticated) {
    return navigateTo('/')
  }
})

