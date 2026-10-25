import { requireUser } from '../../utils/auth-guard'
import { db } from '../../database'
import { account } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)

  const [acct] = await db
    .select({ providerId: account.providerId, accessToken: account.accessToken })
    .from(account)
    .where(eq(account.userId, current.id))
    .limit(1)

  return {
    connected: !!acct?.accessToken,
    provider: acct?.providerId ?? null
  }
})
