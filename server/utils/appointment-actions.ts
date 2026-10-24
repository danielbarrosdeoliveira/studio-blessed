import type { Appointment } from '../database/schema'

/** Status que o staff pode atribuir ao marcar o resultado do atendimento. */
export type StaffStatusTarget = Extract<Appointment['status'], 'completed' | 'no_show'>

export interface AppointmentActor {
  id: string
  role?: string
}

type ManageableAppointment = Pick<Appointment, 'professionalId' | 'status'>

/** Admin gerencia qualquer agendamento; `partner` apenas os próprios. */
export function canManageAppointment(
  actor: AppointmentActor,
  professionalId: string
): boolean {
  return actor.role === 'admin' || actor.id === professionalId
}

/** Só agendamentos ainda ativos podem ser cancelados pelo staff. */
export function canCancelAppointment(
  actor: AppointmentActor,
  appointment: ManageableAppointment
): boolean {
  return canManageAppointment(actor, appointment.professionalId)
    && appointment.status === 'scheduled'
}

/**
 * Marca concluído/no-show a partir de `scheduled`.
 * O admin também corrige um status já marcado (concluído ↔ no-show).
 */
export function canSetAppointmentStatus(
  actor: AppointmentActor,
  appointment: ManageableAppointment,
  target: StaffStatusTarget
): boolean {
  if (!canManageAppointment(actor, appointment.professionalId)) {
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
