import type { AppointmentStatus } from '~/types/domain'

type BadgeColor = 'primary' | 'success' | 'neutral' | 'warning'

export const appointmentStatusMeta: Record<AppointmentStatus, { label: string, color: BadgeColor }> = {
  scheduled: { label: 'Agendado', color: 'primary' },
  completed: { label: 'Concluído', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'neutral' },
  no_show: { label: 'Não compareceu', color: 'warning' }
}
