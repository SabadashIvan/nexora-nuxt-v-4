declare module '#auth-utils' {
  interface User {
    user_id: number
    first_name: string
    last_name: string
    full_name: string
    email?: string
    email_verified_at?: string | null
    githubId?: string
    googleId?: string
  }

  interface UserSession {
    loggedInAt: Date
  }

  interface SecureSessionData {
    oauthProvider?: string
  }
}

export {}
