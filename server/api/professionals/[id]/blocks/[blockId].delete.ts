import { and, eq } from 'drizzle-orm'
import { db } from '../../../../database'
import { timeBlock } from '../../../../database/schema'
import { getProfessionalOr404, requireProfessionalAccess } from '../../../../utils/professionals'

/** Remove um bloqueio da profissional. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const blockId = getRouterParam(event, 'blockId')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  if (!blockId) {
    throw createError({ statusCode: 400, message: 'Bloqueio não informado' })
  }

  await requireProfessionalAccess(event, id)
  await getProfessionalOr404(id)

  const [existing] = await db
    .select({ id: timeBlock.id })
    .from(timeBlock)
    .where(and(
      eq(timeBlock.id, blockId),
      eq(timeBlock.professionalId, id)
    ))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bloqueio não encontrado' })
  }

  await db.delete(timeBlock).where(eq(timeBlock.id, blockId))

  return { id: blockId }
})
