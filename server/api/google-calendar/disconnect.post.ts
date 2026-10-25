import { auth } from '../../lib/auth'
import { db } from '../../database'
import { account } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { data: session } = await auth.api.getSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  await db
    .delete(account)
    .where(eq(account.userId, session.user.id))

  await db
    .update(user)
    .set({ agendaProvider: 'internal' })
    .where(eq(user.id, session.user.id))

  return { ok: true }
})
