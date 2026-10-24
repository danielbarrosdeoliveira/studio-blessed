import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { service, user } from '../../database/schema'
import { serviceColumns } from '../../utils/services'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  const query = getQuery(event)

  const requestedProfessionalId = typeof query.professionalId === 'string' && query.professionalId
    ? query.professionalId
    : undefined

  // `partner` só enxerga os próprios serviços.
  const professionalId = current.role === 'admin' ? requestedProfessionalId : current.id

  const conditions = []
  if (professionalId) {
    conditions.push(eq(service.professionalId, professionalId))
  }
  if (query.active === 'true') {
    conditions.push(eq(service.active, true))
  }

  return db
    .select({
      ...serviceColumns,
      professionalName: user.name
    })
    .from(service)
    .innerJoin(user, eq(service.professionalId, user.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(user.name), asc(service.name))
})
