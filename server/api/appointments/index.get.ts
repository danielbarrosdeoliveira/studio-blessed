import { and, asc, eq, gte, lt } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { appointment, client, service, user } from '../../database/schema'
import { serializeStaffAppointment } from '../../utils/appointment-serialization'
import { appointmentColumns } from '../../utils/appointments'
import { requireUser } from '../../utils/auth-guard'
import { TIME_ZONE, dayBounds, isValidDate } from '../../utils/time'

const querySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(isValidDate, 'Data inválida'),
  professionalId: z.string().min(1).optional()
})

/** Agenda do dia para o staff. `partner` só enxerga os próprios agendamentos. */
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

  let professionalId = parsed.data.professionalId

  if (current.role !== 'admin') {
    if (professionalId && professionalId !== current.id) {
      throw createError({ statusCode: 403, message: 'Acesso negado' })
    }

    professionalId = current.id
  }

  const bounds = dayBounds(parsed.data.date)

  const conditions = [
    gte(appointment.startsAt, bounds.start),
    lt(appointment.startsAt, bounds.end)
  ]

  if (professionalId) {
    conditions.push(eq(appointment.professionalId, professionalId))
  }

  const rows = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .innerJoin(user, eq(appointment.professionalId, user.id))
    .where(and(...conditions))
    .orderBy(asc(appointment.startsAt))

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    date: parsed.data.date,
    timezone: TIME_ZONE,
    professionalId: professionalId ?? null,
    appointments: rows.map(row => serializeStaffAppointment(row))
  }
})
