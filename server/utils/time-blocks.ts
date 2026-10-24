import { MINUTES_PER_DAY, localDateOf, localPartsOf } from './time'

export type TimeBlockRecurrence = 'weekly'

export interface TimeBlockRecord {
  id: string
  professionalId: string
  startsAt: Date
  endsAt: Date
  reason: string | null
  recurrence: string | null
  createdAt: Date
}

export interface BlockConflictCandidate {
  id: string
  startsAt: Date
  endsAt: Date
  clientName: string
  serviceName: string
}

export interface BlockConflict {
  id: string
  startsAt: string
  endsAt: string
  clientName: string
  serviceName: string
}

export interface BlockRange {
  startsAt: Date
  endsAt: Date
  recurrence: string | null
}

/** Objeto devolvido pela API de bloqueios. */
export function serializeTimeBlock(row: TimeBlockRecord) {
  return {
    id: row.id,
    professionalId: row.professionalId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    reason: row.reason,
    recurrence: row.recurrence === 'weekly' ? 'weekly' as const : null,
    createdAt: row.createdAt.toISOString()
  }
}

export function serializeBlockConflict(row: BlockConflictCandidate): BlockConflict {
  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    clientName: row.clientName,
    serviceName: row.serviceName
  }
}

/**
 * Um agendamento `scheduled` conflita com:
 * - bloqueio pontual: sobreposição absoluta;
 * - bloqueio semanal: mesma weekday a partir da data inicial e sobreposição
 *   dos minutos locais.
 */
export function appointmentOverlapsBlock(
  appointment: { startsAt: Date, endsAt: Date },
  block: BlockRange
): boolean {
  if (block.recurrence !== 'weekly') {
    return appointment.startsAt < block.endsAt && appointment.endsAt > block.startsAt
  }

  const blockStartDate = localDateOf(block.startsAt)
  const appointmentStartDate = localDateOf(appointment.startsAt)

  if (appointmentStartDate < blockStartDate) {
    return false
  }

  const blockStart = localPartsOf(block.startsAt)
  const blockEnd = localPartsOf(block.endsAt)

  if (localPartsOf(appointment.startsAt).weekday !== blockStart.weekday) {
    return false
  }

  const blockStartMinute = blockStart.hour * 60 + blockStart.minute
  const blockEndMinute = localDateOf(block.endsAt) === blockStartDate
    ? blockEnd.hour * 60 + blockEnd.minute
    : MINUTES_PER_DAY

  const appointmentStartMinute = localPartsOf(appointment.startsAt).hour * 60
    + localPartsOf(appointment.startsAt).minute
  const appointmentEndMinute = localDateOf(appointment.endsAt) === appointmentStartDate
    ? localPartsOf(appointment.endsAt).hour * 60 + localPartsOf(appointment.endsAt).minute
    : MINUTES_PER_DAY

  return appointmentStartMinute < blockEndMinute && appointmentEndMinute > blockStartMinute
}

export function findBlockConflicts(
  block: BlockRange,
  appointments: BlockConflictCandidate[]
): BlockConflict[] {
  return appointments
    .filter(appointment => appointmentOverlapsBlock(appointment, block))
    .map(serializeBlockConflict)
}
