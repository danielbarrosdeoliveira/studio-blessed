import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '../../database'
import { appointment, client, service } from '../../database/schema'
import { appointmentColumns } from '../../utils/appointments'
import { requireUser } from '../../utils/auth-guard'

/** Janela de criação considerada "recente" para as notificações do painel. */
const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000
const MAX_RESULTS = 50

/**
 * Retorna os agendamentos criados recentemente por clientes (origem `client`).
 * Usado pelo polling do painel para avisar a dona sobre novos agendamentos.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const since = new Date(Date.now() - LOOKBACK_MS)

  const rows = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(
      and(
        eq(appointment.origin, 'client'),
        eq(appointment.status, 'scheduled'),
        gte(appointment.createdAt, since)
      )
    )
    .orderBy(desc(appointment.createdAt))
    .limit(MAX_RESULTS)

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    serverTime: new Date().toISOString(),
    appointments: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      serviceName: row.serviceName,
      clientName: row.clientName,
      clientPhone: row.clientPhone
    }))
  }
})
