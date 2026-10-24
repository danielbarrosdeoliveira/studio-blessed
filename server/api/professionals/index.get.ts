import { asc } from 'drizzle-orm'
import { db } from '../../database'
import { user } from '../../database/schema'
import { professionalColumns } from '../../utils/professionals'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  return db
    .select(professionalColumns)
    .from(user)
    .orderBy(asc(user.name))
})
