// Better Auth configuration for single-owner model
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/drizzle"
import { db } from "./server/database"
import { user } from "./server/database/schema"

export default betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
    },
  }),
  // Single owner model - no professional columns
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  // Configure the user model to not expect role/agendaProvider
  user: {
    additionalFields: {
      // No role or agendaProvider in single-owner model
    },
  },
})
