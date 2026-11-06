import type { Appointment } from '../database/schema'

/** Status que a dona do salão pode atribuir ao marcar o resultado do atendimento. */
export type StaffStatusTarget = Extract<Appointment['status'], 'completed' | 'no_show'>

/** Apenas agendamentos ainda ativos podem ser cancelados. */
export function canCancelAppointment(appointment: Appointment): boolean {
  return appointment.status === 'scheduled'
}

/**
 * Marca concluído/no-show a partir de `scheduled`.
 * A dona também corrige um status já marcado (concluído ↔ no-show).
 */
export function canSetAppointmentStatus(
  appointment: Appointment,
  target: StaffStatusTarget
): boolean {
  if (target !== 'completed' && target !== 'no_show') {
    return false
  }

  return (
    appointment.status === 'scheduled' ||
    appointment.status === 'completed' ||
    appointment.status === 'no_show'
  )
}
