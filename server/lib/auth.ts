import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database'
import * as schema from '../database/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  // Disable email/password - only Google OAuth allowed
  emailAndPassword: {
    enabled: false
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // IMPORTANTE: accessType 'offline' + prompt 'consent' garantem que o Google
      // retorne o refresh_token (necessário para server-to-server Calendar API)
      accessType: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ] as string[]
    }
  },

  // Sessão do usuário no app (cookie) - 7 dias, renova a cada uso
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7 dias (em segundos)
    updateAge: 60 * 60 * 24,          // Renova se último update > 1 dia
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5                  // Cache do cookie por 5 min (performance)
    }
  },

  // Better Auth automatically syncs user profile (name, image) from Google
  // when user signs in with the 'userinfo.profile' and 'userinfo.email' scopes.
  // The user table has 'name' and 'image' fields that will be populated.
})

export type Auth = typeof auth