import { requireUser } from '../../utils/auth-guard'
import { db } from '../../database'
import { account, user } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)

  await db
    .delete(account)
    .where(eq(account.userId, current.id))

  return { ok: true }
})
