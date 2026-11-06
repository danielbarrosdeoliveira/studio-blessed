import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { appointment, service, client } from '../../database/schema'
import { writeAuditLog } from '../../utils/audit-log'
import { findOrCreateClient } from '../../utils/appointments'
import { isSlotAvailable } from '../../utils/availability'
import { normalizePhone } from '../../utils/phone'
import { requireUser } from '../../utils/auth-guard'

const bodySchema = z.object({
  serviceId: z.string().min(1, 'Serviço não informado'),
  startsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Horário inválido'),
  clientName: z.string().trim().min(2, 'Informe o nome da cliente').max(120),
  clientPhone: z.string().trim().min(10, 'Informe o WhatsApp da cliente').max(20),
  notes: z.string().trim().max(500, 'Observações muito longas').optional()
})

/** Cria um agendamento pela dona do salão (origem `client`), com antecedência de 3 dias. */
export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const phone = normalizePhone(parsed.data.clientPhone)

  if (!phone) {
    throw createError({ statusCode: 400, message: 'WhatsApp inválido' })
  }

  const startsAt = new Date(parsed.data.startsAt)

  const [found] = await db
    .select({ durationMin: service.durationMin })
    .from(service)
    .where(and(
      eq(service.id, parsed.data.serviceId),
      eq(service.active, true)
    ))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  // Revalida imediatamente antes de gravar, como no fluxo público.
  const available = await isSlotAvailable({
    serviceId: parsed.data.serviceId,
    startsAt,
    origin: 'client'
  })

  if (!available) {
    throw createError({
      statusCode: 409,
      message: 'Este horário não está mais disponível. Escolha outro.'
    })
  }

  const clientRow = await findOrCreateClient(parsed.data.clientName, phone)

  const [created] = await db
    .insert(appointment)
    .values({
      clientId: clientRow.id,
      serviceId: parsed.data.serviceId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + found.durationMin * 60_000),
      status: 'scheduled',
      origin: 'client',
      notes: parsed.data.notes || null
    })
    // @ts-ignore - Drizzle returning type issue
    .returning({ id: appointment.id })

  if (!created) {
    throw createError({ statusCode: 500, message: 'Não foi possível criar o agendamento' })
  }

  const row = await getAppointmentById(created.id)

  if (!row) {
    throw createError({ statusCode: 500, message: 'Não foi possível carregar o agendamento' })
  }

  await writeAuditLog({
    action: 'appointment.create',
    entity: 'appointment',
    entityId: created.id,
    userId: current.id,
    userEmail: current.email,
    metadata: { serviceId: parsed.data.serviceId, clientPhone: phone, origin: 'client' },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return {
    appointment: serializeAppointment(row)
  }
})