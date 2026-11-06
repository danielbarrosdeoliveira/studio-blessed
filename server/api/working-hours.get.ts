import { asc } from 'drizzle-orm'
import { db } from '../database'
import { workingHours } from '../database/schema'
import { requireUser } from '../utils/auth-guard'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  return db
    .select()
    .from(workingHours)
    .orderBy(asc(workingHours.weekday), asc(workingHours.startMinute))
})
