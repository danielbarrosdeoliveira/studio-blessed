import { asc } from 'drizzle-orm'
import { db } from '../../database'
import { client } from '../../database/schema'
import { requireUser } from '../../utils/auth-guard'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const rows = await db
    .select({
      id: client.id,
      name: client.name,
      phone: client.phone,
      blocked: client.blocked,
      createdAt: client.createdAt
    })
    .from(client)
    .orderBy(asc(client.name))

  return rows
})
