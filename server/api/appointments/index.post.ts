import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { appointment, service } from '../../database/schema'
import { serializeStaffAppointment } from '../../utils/appointment-serialization'
import { findOrCreateClient, getAppointmentById } from '../../utils/appointments'
import { requireUser } from '../../utils/auth-guard'
import { isSlotAvailable } from '../../utils/availability'
import { normalizePhone } from '../../utils/phone'
import { getProfessionalOr404 } from '../../utils/professionals'

const bodySchema = z.object({
  professionalId: z.string().min(1).optional(),
  serviceId: z.string().min(1, 'Serviço não informado'),
  startsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Horário inválido'),
  clientName: z.string().trim().min(2, 'Informe o nome da cliente').max(120),
  clientPhone: z.string().trim().min(10, 'Informe o WhatsApp da cliente').max(20),
  notes: z.string().trim().max(500, 'Observações muito longas').optional()
})

/** Cria um agendamento pelo staff (origem `staff`), sem a antecedência de 3 dias. */
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

  let professionalId = parsed.data.professionalId

  if (current.role === 'admin') {
    if (!professionalId) {
      throw createError({ statusCode: 400, message: 'Selecione a profissional' })
    }

    await getProfessionalOr404(professionalId)
  } else {
    if (professionalId && professionalId !== current.id) {
      throw createError({ statusCode: 403, message: 'Acesso negado' })
    }

    professionalId = current.id
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
      eq(service.professionalId, professionalId),
      eq(service.active, true)
    ))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  // Revalida imediatamente antes de gravar, como no fluxo público.
  const available = await isSlotAvailable({
    professionalId,
    serviceId: parsed.data.serviceId,
    startsAt,
    origin: 'staff'
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
      professionalId,
      serviceId: parsed.data.serviceId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + found.durationMin * 60_000),
      status: 'scheduled',
      origin: 'staff',
      notes: parsed.data.notes || null
    })
    .returning({ id: appointment.id })

  if (!created) {
    throw createError({ statusCode: 500, message: 'Não foi possível criar o agendamento' })
  }

  const row = await getAppointmentById(created.id)

  if (!row) {
    throw createError({ statusCode: 500, message: 'Não foi possível carregar o agendamento' })
  }

  setResponseStatus(event, 201)

  return {
    appointment: serializeStaffAppointment(row)
  }
})
