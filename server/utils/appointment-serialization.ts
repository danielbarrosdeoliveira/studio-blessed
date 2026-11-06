import type { Appointment } from '../database/schema'

export const CANCELLATION_HOURS = 24
export const CANCELLATION_FEE_PERCENTAGE = 50
const CANCELLATION_WINDOW_MS = CANCELLATION_HOURS * 60 * 60 * 1000

export const cancellationPolicy = {
  hours: CANCELLATION_HOURS,
  feePercentage: CANCELLATION_FEE_PERCENTAGE,
  message:
    'Cancelamento ou remarcação até 24h antes do horário. Após esse prazo, aplica-se a política de taxa de 50%.'
}

/** Só é possível alterar agendamentos futuros com pelo menos 24h de antecedência. */
export function canChangeAppointment(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() - now.getTime() >= CANCELLATION_WINDOW_MS
}

/** Detalhes do agendamento para o modelo single-owner (dona do salão). */
export interface AppointmentDetails {
  id: string
  createdAt: Date
  updatedAt: Date
  startsAt: Date
  endsAt: Date
  clientId: string
  serviceId: string
  status: Appointment['status']
  origin: Appointment['origin']
  serviceName: string
  durationMin: number
  priceCents: number
  clientName: string
  clientPhone: string
  notes: string | null
}

/** Objeto público: sem o telefone da cliente; datas em ISO e `canChange` calculado. */
export function serializeAppointment(row: AppointmentDetails, now = new Date()) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    origin: row.origin,
    serviceId: row.serviceId,
    clientId: row.clientId,
    serviceName: row.serviceName,
    durationMin: row.durationMin,
    priceCents: row.priceCents,
    clientName: row.clientName,
    canChange: row.status === 'scheduled' && canChangeAppointment(row.startsAt, now)
  }
}

/** Objeto interno: inclui telefone, observações e o status cru. */
export function serializeStaffAppointment(row: AppointmentDetails) {
  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    origin: row.origin,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    durationMin: row.durationMin,
    priceCents: row.priceCents,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    notes: row.notes
  }
}
