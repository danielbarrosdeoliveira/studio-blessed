import { and, asc, eq, gte, lt } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { appointment, client, service } from '../../database/schema'
import { serializeAppointment } from '../../utils/appointment-serialization'
import { requireUser } from '../../utils/auth-guard'
import { TIME_ZONE, dayBounds, isValidDate } from '../../utils/time'

const querySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(isValidDate, 'Data inválida')
})

/** Retorna a agenda do dia para a dona do salão (apenas admin). */
export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  if (current.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acesso negado' })
  }

  const bounds = dayBounds(parsed.data.date)

  const conditions = [
    gte(appointment.startsAt, bounds.start),
    lt(appointment.startsAt, bounds.end)
  ]

  const rows = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(...conditions))
    .orderBy(asc(appointment.startsAt))

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    date: parsed.data.date,
    timezone: TIME_ZONE,
    appointments: rows.map(row => serializeAppointment(row))
  }
})