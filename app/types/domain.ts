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
