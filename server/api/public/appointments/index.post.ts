import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { appointment, service } from '../../../database/schema'
import { cancellationPolicy, serializeAppointment } from '../../../utils/appointment-serialization'
import { findOrCreateClient, getAppointmentById } from '../../../utils/appointments'
import { isSlotAvailable } from '../../../utils/availability'
import { normalizePhone } from '../../../utils/phone'
import { createGoogleCalendarEvent } from '../../../utils/google-calendar'

const bodySchema = z.object({
  serviceId: z.string().min(1, 'Serviço não informado'),
  startsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Horário inválido'),
  clientName: z.string().trim().min(2, 'Informe seu nome').max(120),
  clientPhone: z.string().trim().min(10, 'Informe seu WhatsApp').max(20),
  bookingType: z.enum(['application', 'maintenance']).default('application')
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
    .select({
      durationMin: service.durationMin,
      hasMaintenance: service.hasMaintenance,
      maintenancePriceCents: service.maintenancePriceCents,
      maintenanceDurationMin: service.maintenanceDurationMin
    })
    .from(service)
    .where(and(eq(service.id, parsed.data.serviceId), eq(service.active, true)))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  // Determine duration and price based on booking type
  const isMaintenance = parsed.data.bookingType === 'maintenance'
  const hasMaintenance = found.hasMaintenance ?? false
  const durationMin =
    isMaintenance && hasMaintenance
      ? (found.maintenanceDurationMin ?? found.durationMin)
      : found.durationMin

  // Revalida imediatamente antes de gravar (US6.3).
  const available = await isSlotAvailable({
    serviceId: parsed.data.serviceId,
    startsAt,
    origin: 'client',
    bookingType: parsed.data.bookingType
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
      endsAt: new Date(startsAt.getTime() + durationMin * 60_000),
      status: 'scheduled',
      origin: 'client',
      bookingType: parsed.data.bookingType
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

  // Sync with Google Calendar if connected
  const bookingTypeLabel = row.bookingType === 'maintenance' ? '[Manutenção]' : '[Aplicação]'
  const googleResult = await createGoogleCalendarEvent({
    summary: `${bookingTypeLabel} ${row.clientName} - ${row.serviceName}`,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    appointmentId: row.id
  })

  if (googleResult.ok) {
    await db
      .update(appointment)
      .set({ googleEventId: googleResult.googleEventId })
      .where(eq(appointment.id, row.id))
    row.googleEventId = googleResult.googleEventId
  }

  return {
    appointment: serializeAppointment(row),
    cancellation: cancellationPolicy
  }
})
