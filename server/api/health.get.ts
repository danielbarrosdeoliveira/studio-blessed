import { defineEventHandler } from 'h3'
import { db } from '../../server/database'
import { sql } from 'drizzle-orm'

/**
 * Health check da aplicação.
 *
 * Retorna 200 quando a API está no ar e o banco de dados responde.
 * Útil para load balancer e verificações de uptime.
 */
export default defineEventHandler(async () => {
  try {
    await db.execute(sql`SELECT 1`)
    return { status: 'ok', database: 'connected' }
  } catch (error) {
    const err = error as Error
    return { status: 'degraded', database: 'disconnected', error: err.message }
  }
})
