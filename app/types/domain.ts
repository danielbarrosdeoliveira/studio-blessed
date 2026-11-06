export interface WorkingHour {
  id: string
  weekday: number
  startMinute: number
  endMinute: number
  createdAt: string
}

export interface Service {
  id: string
  name: string
  durationMin: number
  bufferMin: number
  priceCents: number
  active: boolean
  createdAt: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentOrigin = 'client' | 'staff'
export type TimeBlockRecurrence = 'weekly'

export interface TimeBlock {
  id: string
  startsAt: string
  endsAt: string
  reason: string | null
  recurrence: TimeBlockRecurrence | null
  createdAt: string
}

export interface TimeBlockConflict {
  id: string
  startsAt: string
  endsAt: string
  clientName: string
  serviceName: string
}

export interface TimeBlockResponse {
  block: TimeBlock
  conflicts: TimeBlockConflict[]
}

export interface PublicAvailabilitySlot {
  startsAt: string
  endsAt: string
  /** Horário local `HH:mm`. */
  label: string
}

export interface PublicAvailability {
  date: string
  timezone: string
  origin: AppointmentOrigin
  slots: PublicAvailabilitySlot[]
}

export interface PublicCancellationPolicy {
  hours: number
  feePercentage: number
  message: string
}

export interface PublicAppointment {
  id: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  origin: AppointmentOrigin
  serviceId: string
  serviceName: string
  durationMin: number
  priceCents: number
  clientName: string
  canChange: boolean
}

export interface PublicAppointmentResponse {
  appointment: PublicAppointment
  cancellation: PublicCancellationPolicy
}

export interface PublicAppointmentsResponse {
  phone: string
  cancellation: PublicCancellationPolicy
  appointments: PublicAppointment[]
}

export interface StaffAppointment {
  id: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  origin: AppointmentOrigin
  serviceId: string
  serviceName: string
  durationMin: number
  priceCents: number
  clientName: string
  clientPhone: string
  notes: string | null
}

export interface StaffAgendaResponse {
  date: string
  timezone: string
  appointments: StaffAppointment[]
}

export interface StaffAppointmentResponse {
  appointment: StaffAppointment
}
