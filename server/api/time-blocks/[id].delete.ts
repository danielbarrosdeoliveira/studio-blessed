import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { timeBlock } from '../../database/schema'
import { requireUser } from '../../utils/auth-guard'

/** Remove um bloqueio da dona do salão. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const blockId = getRouterParam(event, 'id')

  if (!blockId) {
    throw createError({ statusCode: 400, message: 'Bloqueio não informado' })
  }

  const [existing] = await db
    .select({ id: timeBlock.id })
    .from(timeBlock)
    .where(eq(timeBlock.id, blockId))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bloqueio não encontrado' })
  }

  await db.delete(timeBlock).where(eq(timeBlock.id, blockId))

  return { id: blockId }
})
