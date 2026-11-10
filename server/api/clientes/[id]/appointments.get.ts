import { desc, eq } from 'drizzle-orm'
import { db } from '../../../database'
import { appointment, client, service } from '../../../database/schema'
import { serializeStaffAppointment } from '../../../utils/appointment-serialization'
import { appointmentColumns } from '../../../utils/appointments'
import { requireUser } from '../../../utils/auth-guard'

/** Limite de segurança para o histórico de uma cliente. */
const MAX_RESULTS = 200

/** Histórico completo de agendamentos de uma cliente. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Cliente não informada' })
  }

  const [clientRow] = await db
    .select({ id: client.id, name: client.name, phone: client.phone, blocked: client.blocked })
    .from(client)
    .where(eq(client.id, id))
    .limit(1)

  if (!clientRow) {
    throw createError({ statusCode: 404, message: 'Cliente não encontrada' })
  }

  const rows = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(eq(appointment.clientId, id))
    .orderBy(desc(appointment.startsAt))
    .limit(MAX_RESULTS)

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    client: clientRow,
    appointments: rows.map((row) => serializeStaffAppointment(row))
  }
})
