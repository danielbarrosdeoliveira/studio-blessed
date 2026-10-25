import { auth } from '../../lib/auth'
import { db } from '../../database'
import { user } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { data: session } = await auth.api.getSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const [account] = await db
    .select({ providerId: account.providerId, accessToken: account.accessToken })
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(1)

  return {
    connected: !!account?.accessToken,
    provider: account?.providerId ?? null
  }
})
