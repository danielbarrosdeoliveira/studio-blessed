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

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },

  user: {
    additionalFields: {
      // Nunca aceitos como input do cliente — evitam escalada de privilégio.
      role: {
        type: 'string',
        required: false,
        defaultValue: 'partner',
        input: false
      },
      agendaProvider: {
        type: 'string',
        required: false,
        defaultValue: 'internal',
        input: false
      }
    }
  }
})

export type Auth = typeof auth
