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
  hasMaintenance: boolean | null
  maintenancePriceCents: number | null
  maintenanceDurationMin: number | null
  createdAt: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentOrigin = 'client' | 'staff'
export type BookingType = 'application' | 'maintenance'

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
  bookingType: BookingType
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
  bookingType: BookingType
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

/** Agendamento criado recentemente por uma cliente — usado pelo polling do painel. */
export interface RecentClientAppointment {
  id: string
  createdAt: string
  startsAt: string
  endsAt: string
  serviceName: string
  clientName: string
  clientPhone: string
}

export interface RecentAppointmentsResponse {
  appointments: RecentClientAppointment[]
  /** Horário do servidor, usado como baseline quando ainda não há agendamentos. */
  serverTime: string
}
