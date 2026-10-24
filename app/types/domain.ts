export type Role = 'admin' | 'partner'
export type AgendaProvider = 'internal' | 'google'

export interface Professional {
  id: string
  name: string
  email: string
  role: Role
  agendaProvider: AgendaProvider
  createdAt: string
}

export interface WorkingHour {
  id: string
  professionalId: string
  weekday: number
  startMinute: number
  endMinute: number
  createdAt: string
}

export interface Service {
  id: string
  professionalId: string
  professionalName: string
  name: string
  durationMin: number
  bufferMin: number
  priceCents: number
  active: boolean
  createdAt: string
}

export interface PublicServiceProfessional {
  /** `user.id` da profissional. */
  id: string
  serviceId: string
  name: string
  durationMin: number
  bufferMin: number
  priceCents: number
}

export interface PublicServiceGroup {
  name: string
  minPriceCents: number
  professionals: PublicServiceProfessional[]
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentOrigin = 'client' | 'staff'

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
  professionalId: string
  serviceName: string
  professionalName: string
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
  professionalId: string
  serviceName: string
  professionalName: string
  durationMin: number
  priceCents: number
  clientName: string
  clientPhone: string
  notes: string | null
}

export interface StaffAgendaResponse {
  date: string
  timezone: string
  professionalId: string | null
  appointments: StaffAppointment[]
}

export interface StaffAppointmentResponse {
  appointment: StaffAppointment
}
