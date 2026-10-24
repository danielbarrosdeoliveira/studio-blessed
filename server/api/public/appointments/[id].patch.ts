import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { appointment } from '../../../database/schema'
import {
  canChangeAppointment,
  cancellationPolicy,
  getAppointmentById,
  serializeAppointment
} from '../../../utils/appointments'
import { isSlotAvailable } from '../../../utils/availability'
import { normalizePhone } from '../../../utils/phone'

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('cancel'),
    phone: z.string().min(1, 'Informe seu WhatsApp')
  }),
  z.object({
    action: z.literal('reschedule'),
    phone: z.string().min(1, 'Informe seu WhatsApp'),
    startsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Horário inválido')
  })
])

/** Cancela ou remarca um agendamento da cliente (até 24h antes). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Agendamento não informado' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const phone = normalizePhone(parsed.data.phone)
  const current = await getAppointmentById(id)

  if (!current) {
    throw createError({ statusCode: 404, message: 'Agendamento não encontrado' })
  }

  if (!phone || phone !== current.clientPhone) {
    throw createError({ statusCode: 403, message: 'Telefone não confere com o agendamento' })
  }

  if (current.status !== 'scheduled') {
    throw createError({ statusCode: 409, message: 'Este agendamento não pode mais ser alterado' })
  }

  if (!canChangeAppointment(current.startsAt)) {
    throw createError({
      statusCode: 409,
      message: 'Alterações só podem ser feitas até 24h antes do horário',
      data: cancellationPolicy
    })
  }

  if (parsed.data.action === 'cancel') {
    await db
      .update(appointment)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointment.id, id))
  } else {
    const startsAt = new Date(parsed.data.startsAt)

    const available = await isSlotAvailable({
      professionalId: current.professionalId,
      serviceId: current.serviceId,
      startsAt,
      origin: 'client'
    })

    if (!available) {
      throw createError({
        statusCode: 409,
        message: 'Este horário não está mais disponível. Escolha outro.'
      })
    }

    await db
      .update(appointment)
      .set({
        startsAt,
        endsAt: new Date(startsAt.getTime() + current.durationMin * 60_000),
        updatedAt: new Date()
      })
      .where(eq(appointment.id, id))
  }

  const updated = await getAppointmentById(id)

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Não foi possível carregar o agendamento' })
  }

  return {
    appointment: serializeAppointment(updated),
    cancellation: cancellationPolicy
  }
})
