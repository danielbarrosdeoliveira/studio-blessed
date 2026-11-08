import { asc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { service } from '../../database/schema'

/**
 * Catálogo público (sem autenticação).
 * Lista serviços ativos. Como há apenas uma dona do salão, cada serviço
 * aparece uma única vez.
 */
export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      priceCents: service.priceCents,
      hasMaintenance: service.hasMaintenance,
      maintenancePriceCents: service.maintenancePriceCents,
      maintenanceDurationMin: service.maintenanceDurationMin
    })
    .from(service)
    .where(eq(service.active, true))
    .orderBy(asc(service.name))

  return rows
})
