import { sendRedirect } from 'h3'
import { getNameParts } from '#server/utils/oauth'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const existingSession = await getUserSession(event)
    const nameParts = getNameParts(user.name)

    if (existingSession.user) {
      await setUserSession(event, {
        ...existingSession,
        user: {
          ...existingSession.user,
          googleId: String(user.id),
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
        email: user.email ?? undefined,
        googleId: String(user.id),
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
