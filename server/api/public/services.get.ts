import { asc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { service, user } from '../../database/schema'

interface PublicService {
  id: string
  durationMin: number
  bufferMin: number
  priceCents: number
}

/**
 * Catálogo público (sem autenticação).
 * Lista serviços ativos. Como há apenas uma dona do salão, não há distinção de profissional por serviço.
 */
export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      priceCents: service.priceCents
    })
    .from(service)
    .where(eq(service.active, true))
    .orderBy(asc(service.name))

  return rows
})
