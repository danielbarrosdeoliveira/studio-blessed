import { auditLog } from '../database/schema'
import { db } from '../database'
import { eq } from 'drizzle-orm'

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
  | 'time_block.create'
  | 'time_block.update'
  | 'time_block.delete'
  | 'user.invite'
  | 'user.role_change'
  | 'user.delete'

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
export function extractRequestMeta(event: any) {
  return {
    ipAddress: event.node.req.socket?.remoteAddress ?? event.node.req.headers['x-forwarded-for'] ?? null,
    userAgent: event.node.req.headers['user-agent'] ?? null
  }
}
