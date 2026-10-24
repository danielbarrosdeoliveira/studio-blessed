import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db } from '../database'
import { service } from '../database/schema'
import { requireUser } from './auth-guard'

/** Campos públicos de um serviço. */
export const serviceColumns = {
  id: service.id,
  professionalId: service.professionalId,
  name: service.name,
  durationMin: service.durationMin,
  bufferMin: service.bufferMin,
  priceCents: service.priceCents,
  active: service.active,
  createdAt: service.createdAt
}

/**
 * Admin acessa qualquer serviço; `partner` só os próprios.
 * Lança 404 se não existir e 403 se for de outra profissional.
 */
export async function requireServiceAccess(event: H3Event, serviceId: string) {
  const current = await requireUser(event)

  const [existing] = await db
    .select({ id: service.id, professionalId: service.professionalId })
    .from(service)
    .where(eq(service.id, serviceId))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  if (current.role !== 'admin' && current.id !== existing.professionalId) {
    throw createError({ statusCode: 403, message: 'Acesso negado' })
  }

  return { current, existing }
}
