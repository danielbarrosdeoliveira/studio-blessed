import { asc, eq } from 'drizzle-orm'
import { db } from '../../../../database'
import { timeBlock } from '../../../../database/schema'
import { getProfessionalOr404, requireProfessionalAccess } from '../../../../utils/professionals'
import { serializeTimeBlock } from '../../../../utils/time-blocks'

/** Lista os bloqueios cadastrados da profissional. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)
  await getProfessionalOr404(id)

  const rows = await db
    .select()
    .from(timeBlock)
    .where(eq(timeBlock.professionalId, id))
    .orderBy(asc(timeBlock.startsAt))

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return rows.map(serializeTimeBlock)
})
