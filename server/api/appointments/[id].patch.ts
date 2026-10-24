import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { appointment } from '../../database/schema'
import {
  canCancelAppointment,
  canSetAppointmentStatus
} from '../../utils/appointment-actions'
import { serializeStaffAppointment } from '../../utils/appointment-serialization'
import { getAppointmentById } from '../../utils/appointments'
import { requireUser } from '../../utils/auth-guard'

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('cancel')
  }),
  z.object({
    action: z.literal('status'),
    status: z.enum(['completed', 'no_show'], 'Status inválido')
  })
])

/** Cancela ou atualiza o resultado de um atendimento pelo staff. */
export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
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

  const existing = await getAppointmentById(id)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Agendamento não encontrado' })
  }

  if (current.role !== 'admin' && current.id !== existing.professionalId) {
    throw createError({ statusCode: 403, message: 'Acesso negado' })
  }

  if (parsed.data.action === 'cancel') {
    if (!canCancelAppointment(current, existing)) {
      throw createError({
        statusCode: 409,
        message: 'Somente agendamentos agendados podem ser cancelados'
      })
    }

    await db
      .update(appointment)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointment.id, id))
  } else {
    if (parsed.data.status === existing.status) {
      throw createError({ statusCode: 409, message: 'O agendamento já está com este status' })
    }

    if (!canSetAppointmentStatus(current, existing, parsed.data.status)) {
      throw createError({
        statusCode: 409,
        message: 'Este status não pode mais ser alterado'
      })
    }

    await db
      .update(appointment)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(appointment.id, id))
  }

  const updated = await getAppointmentById(id)

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Não foi possível carregar o agendamento' })
  }

  return {
    appointment: serializeStaffAppointment(updated)
  }
})
