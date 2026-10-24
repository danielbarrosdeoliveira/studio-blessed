import { eq } from 'drizzle-orm'
import { db } from '../database'
import { appointment, client, service, user } from '../database/schema'
import type { Appointment } from '../database/schema'

export const CANCELLATION_HOURS = 24
export const CANCELLATION_FEE_PERCENTAGE = 50
const CANCELLATION_WINDOW_MS = CANCELLATION_HOURS * 60 * 60 * 1000

export const cancellationPolicy = {
  hours: CANCELLATION_HOURS,
  feePercentage: CANCELLATION_FEE_PERCENTAGE,
  message: 'Cancelamento ou remarcação até 24h antes do horário. Após esse prazo, aplica-se a política de taxa de 50%.'
}

/** Só é possível alterar agendamentos futuros com pelo menos 24h de antecedência. */
export function canChangeAppointment(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() - now.getTime() >= CANCELLATION_WINDOW_MS
}

export const appointmentColumns = {
  id: appointment.id,
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
  status: appointment.status,
  origin: appointment.origin,
  serviceId: appointment.serviceId,
  professionalId: appointment.professionalId,
  serviceName: service.name,
  professionalName: user.name,
  durationMin: service.durationMin,
  priceCents: service.priceCents,
  clientName: client.name,
  clientPhone: client.phone
}

export interface AppointmentDetails {
  id: string
  startsAt: Date
  endsAt: Date
  status: Appointment['status']
  origin: Appointment['origin']
  serviceId: string
  professionalId: string
  serviceName: string
  professionalName: string
  durationMin: number
  priceCents: number
  clientName: string
  clientPhone: string
}

export async function getAppointmentById(id: string): Promise<AppointmentDetails | null> {
  const [row] = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .innerJoin(user, eq(appointment.professionalId, user.id))
    .where(eq(appointment.id, id))
    .limit(1)

  return row ?? null
}

/** Objeto público: sem o telefone da cliente; datas em ISO e `canChange` calculado. */
export function serializeAppointment(row: AppointmentDetails, now = new Date()) {
  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    origin: row.origin,
    serviceId: row.serviceId,
    professionalId: row.professionalId,
    serviceName: row.serviceName,
    professionalName: row.professionalName,
    durationMin: row.durationMin,
    priceCents: row.priceCents,
    clientName: row.clientName,
    canChange: row.status === 'scheduled' && canChangeAppointment(row.startsAt, now)
  }
}

/** Reaproveita a cliente pelo telefone; cria se ainda não existir. */
export async function findOrCreateClient(name: string, phone: string) {
  const [existing] = await db
    .select()
    .from(client)
    .where(eq(client.phone, phone))
    .limit(1)

  if (existing) {
    return existing
  }

  const [created] = await db
    .insert(client)
    .values({ name, phone })
    .onConflictDoNothing()
    .returning()

  if (created) {
    return created
  }

  const [raced] = await db
    .select()
    .from(client)
    .where(eq(client.phone, phone))
    .limit(1)

  if (!raced) {
    throw createError({ statusCode: 500, message: 'Não foi possível registrar a cliente' })
  }

  return raced
}
