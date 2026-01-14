import { sendRedirect } from 'h3'
import { defineOAuthGoogleEventHandler, getUserSession, setUserSession } from '#auth-utils'

const getNameParts = (name?: string) => {
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

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const existingSession = await getUserSession(event)
    const nameParts = getNameParts(user.name)

    if (existingSession.user) {
      await setUserSession(event, {
        ...existingSession,
        user: {
          ...existingSession.user,
          googleId: user.id,
        },
      })
      return sendRedirect(event, '/profile/settings?linked=google')
    }

    await setUserSession(event, {
      user: {
        user_id: Number(user.id) || 0,
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        full_name: nameParts.fullName,
        email: user.email,
        googleId: user.id,
      },
      loggedInAt: new Date(),
      secure: {
        oauthProvider: 'google',
      },
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/auth/login?error=oauth_failed')
  },
})
