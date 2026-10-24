import { desc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { appointment, client, service, user } from '../../../database/schema'
import {
  cancellationPolicy,
  serializeAppointment
} from '../../../utils/appointment-serialization'
import { appointmentColumns } from '../../../utils/appointments'
import { normalizePhone } from '../../../utils/phone'

const querySchema = z.object({
  phone: z.string().min(1, 'Informe seu WhatsApp')
})

/** Histórico público da cliente, identificada apenas pelo WhatsApp. */
export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const phone = normalizePhone(parsed.data.phone)

  if (!phone) {
    throw createError({ statusCode: 400, message: 'WhatsApp inválido' })
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')

  const rows = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .innerJoin(user, eq(appointment.professionalId, user.id))
    .where(eq(client.phone, phone))
    .orderBy(desc(appointment.startsAt))

  return {
    phone,
    cancellation: cancellationPolicy,
    appointments: rows.map(row => serializeAppointment(row))
  }
})
