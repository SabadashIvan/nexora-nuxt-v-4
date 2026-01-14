import { sendRedirect } from 'h3'
import { defineOAuthGitHubEventHandler, getUserSession, setUserSession } from '#auth-utils/server'

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

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const existingSession = await getUserSession(event)
    const nameParts = getNameParts(user.name)

    if (existingSession.user) {
      await setUserSession(event, {
        ...existingSession,
        user: {
          ...existingSession.user,
          githubId: user.id,
        },
      })
      return sendRedirect(event, '/profile/settings?linked=github')
    }

    await setUserSession(event, {
      user: {
        user_id: Number(user.id) || 0,
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        full_name: nameParts.fullName,
        email: user.email,
        githubId: user.id,
      },
      loggedInAt: new Date(),
      secure: {
        oauthProvider: 'github',
      },
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/auth/login?error=oauth_failed')
  },
})
