import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { service } from '../../database/schema'
import { requireUser } from '../../utils/auth-guard'
import { serviceColumns } from '../../utils/services'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const query = getQuery(event)
  const active = query.active === 'true'

  const conditions = []
  if (active) {
    conditions.push(eq(service.active, true))
  }

  return db
    .select(serviceColumns)
    .from(service)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(service.name))
})
