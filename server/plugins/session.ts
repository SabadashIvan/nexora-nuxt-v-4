import { sessionHooks } from '#auth-utils'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session) => {
    if (session.loggedInAt && typeof session.loggedInAt === 'string') {
      return {
        ...session,
        loggedInAt: new Date(session.loggedInAt),
      }
    }

    return session
  })
})
