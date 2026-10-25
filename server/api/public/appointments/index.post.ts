import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { appointment, service } from '../../../database/schema'
import {
  cancellationPolicy,
  serializeAppointment
} from '../../../utils/appointment-serialization'
import { findOrCreateClient, getAppointmentById } from '../../../utils/appointments'
import { isSlotAvailable } from '../../../utils/availability'
import { normalizePhone } from '../../../utils/phone'

const bodySchema = z.object({
  professionalId: z.string().min(1, 'Profissional não informada'),
  serviceId: z.string().min(1, 'Serviço não informado'),
  startsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Horário inválido'),
  clientName: z.string().trim().min(2, 'Informe seu nome').max(120),
  clientPhone: z.string().trim().min(10, 'Informe seu WhatsApp').max(20)
})

/** Cria um agendamento público (origem `client`) com revalidação do horário. */
export default defineEventHandler(async (event) => {
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
      eq(service.professionalId, parsed.data.professionalId),
      eq(service.active, true)
    ))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  // Revalida imediatamente antes de gravar (US6.3).
  const available = await isSlotAvailable({
    professionalId: parsed.data.professionalId,
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
      professionalId: parsed.data.professionalId,
      serviceId: parsed.data.serviceId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + found.durationMin * 60_000),
      status: 'scheduled',
      origin: 'client'
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

  return {
    appointment: serializeAppointment(row),
    cancellation: cancellationPolicy
  }
})
