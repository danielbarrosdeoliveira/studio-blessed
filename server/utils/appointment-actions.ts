import type { Appointment } from '../database/schema'

/** Status que o admin pode atribuir ao marcar o resultado do atendimento. */
export type StaffStatusTarget = Extract<Appointment['status'], 'completed' | 'no_show'>

export interface AppointmentActor {
  id: string
  role?: string
}

/** Admin (dona) gerencia qualquer agendamento. */
export function canManageAppointment(
  actor: AppointmentActor
): boolean {
  return actor.role === 'admin'
}

/** Apenas agendamentos ainda ativos podem ser cancelados pelo admin. */
export function canCancelAppointment(
  actor: AppointmentActor,
  appointment: Appointment
): boolean {
  return canManageAppointment(actor)
    && appointment.status === 'scheduled'
}

/**
 * Marca concluído/no-show a partir de `scheduled`.
 * O admin também corrige um status já marcado (concluído ↔ no-show).
 */
export function canSetAppointmentStatus(
  actor: AppointmentActor,
  appointment: Appointment,
  target: StaffStatusTarget
): boolean {
  if (!canManageAppointment(actor)) {
    return false
  }

  if (target !== 'completed' && target !== 'no_show') {
    return false
  }

  if (appointment.status === 'scheduled') {
    return true
  }

  return actor.role === 'admin'
    && (appointment.status === 'completed' || appointment.status === 'no_show')
}