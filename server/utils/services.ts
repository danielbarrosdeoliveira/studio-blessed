import { eq, sql } from 'drizzle-orm'
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

/** Compara nomes de serviço sem diferenciar caixa nem espaços nas pontas. */
export function sameServiceName(name: string) {
  return sql`lower(btrim(${service.name})) = lower(btrim(${name}))`
}

/** Violação de índice único do PostgreSQL. */
export function isUniqueViolation(error: unknown) {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === '23505'
}

/**
 * Admin acessa qualquer serviço; `partner` só os próprios.
 * Lança 404 se não existir e 403 se for de outra profissional.
 */
export async function requireServiceAccess(event: H3Event, serviceId: string) {
  const current = await requireUser(event)

  const [existing] = await db
    .select({
      id: service.id,
      professionalId: service.professionalId,
      name: service.name,
      active: service.active
    })
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
