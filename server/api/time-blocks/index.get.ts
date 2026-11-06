import { asc } from 'drizzle-orm'
import { db } from '../../database'
import { timeBlock } from '../../database/schema'
import { requireUser } from '../../utils/auth-guard'
import { serializeTimeBlock } from '../../utils/time-blocks'

/** Lista os bloqueios cadastrados da dona do salão. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const rows = await db
    .select()
    .from(timeBlock)
    .orderBy(asc(timeBlock.startsAt))

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return rows.map(serializeTimeBlock)
})
