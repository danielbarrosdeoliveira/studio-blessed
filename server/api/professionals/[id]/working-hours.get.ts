import { asc, eq } from 'drizzle-orm'
import { db } from '../../../database'
import { workingHours } from '../../../database/schema'
import { getProfessionalOr404, requireProfessionalAccess } from '../../../utils/professionals'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)
  await getProfessionalOr404(id)

  return db
    .select()
    .from(workingHours)
    .where(eq(workingHours.professionalId, id))
    .orderBy(asc(workingHours.weekday), asc(workingHours.startMinute))
})
