import { eq } from 'drizzle-orm'
import { db } from '../database'
import { appointment, client, service } from '../database/schema'
import type { AppointmentDetails } from './appointment-serialization'

export const appointmentColumns = {
  id: appointment.id,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
  status: appointment.status,
  origin: appointment.origin,
  serviceId: appointment.serviceId,
  serviceName: service.name,
  durationMin: service.durationMin,
  priceCents: service.priceCents,
  clientName: client.name,
  clientPhone: client.phone,
  clientId: appointment.clientId,
  notes: appointment.notes,
  googleEventId: appointment.googleEventId
}

export async function getAppointmentById(id: string): Promise<AppointmentDetails | null> {
  const [row] = await db
    .select(appointmentColumns)
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(eq(appointment.id, id))
    .limit(1)

  return row ?? null
}

/** Reaproveita a cliente pelo telefone; cria se ainda não existir. */
export async function findOrCreateClient(name: string, phone: string) {
  const [existing] = await db.select().from(client).where(eq(client.phone, phone)).limit(1)

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

  const [raced] = await db.select().from(client).where(eq(client.phone, phone)).limit(1)

  if (!raced) {
    throw createError({ statusCode: 500, message: 'Não foi possível registrar a cliente' })
  }

  return raced
}
