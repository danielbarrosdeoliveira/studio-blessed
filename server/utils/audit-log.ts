import { auditLog } from '../database/schema'
import { db } from '../database'
import type { H3Event } from 'h3'

export type AuditAction =
  | 'appointment.create'
  | 'appointment.update'
  | 'appointment.cancel'
  | 'appointment.complete'
  | 'appointment.completed'
  | 'appointment.cancelled'
  | 'appointment.no_show'
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'working_hours.create'
  | 'working_hours.update'
  | 'working_hours.delete'
  | 'user.delete'
  | 'client.create'

export async function writeAuditLog({
  action,
  entity,
  entityId,
  userId,
  userEmail,
  metadata,
  ipAddress,
  userAgent
}: {
  action: AuditAction
  entity: string
  entityId?: string
  userId?: string
  userEmail?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  await db.insert(auditLog).values({
    action,
    entity,
    entityId,
    userId,
    userEmail,
    metadata: metadata ? JSON.stringify(metadata) : null,
    ipAddress,
    userAgent
  })
}

/**
 * Helper para extrair IP e user agent do evento H3/Nitro.
 */
export function extractRequestMeta(event: H3Event) {
  return {
    ipAddress:
      event.node.req.socket?.remoteAddress ?? event.node.req.headers['x-forwarded-for'] ?? null,
    userAgent: event.node.req.headers['user-agent'] ?? null
  }
}
