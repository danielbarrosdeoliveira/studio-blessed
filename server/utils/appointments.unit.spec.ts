import { describe, expect, it } from 'vitest'
import {
  CANCELLATION_HOURS,
  canChangeAppointment,
  serializeAppointment,
  serializeStaffAppointment,
  type AppointmentDetails
} from './appointment-serialization'

const NOW = new Date('2026-10-27T12:00:00.000Z')

const details: AppointmentDetails = {
  id: 'appointment-1',
  startsAt: new Date('2026-10-29T12:00:00.000Z'),
  endsAt: new Date('2026-10-29T12:40:00.000Z'),
  status: 'scheduled',
  origin: 'client',
  serviceId: 'service-1',
  professionalId: 'professional-1',
  serviceName: 'Corte feminino',
  professionalName: 'Maria',
  durationMin: 40,
  priceCents: 13000,
  clientName: 'Cliente Teste',
  clientPhone: '11999990000',
  notes: 'Primeira visita'
}

describe('canChangeAppointment', () => {
  it('exige a janela de 24h', () => {
    expect(CANCELLATION_HOURS).toBe(24)
    expect(canChangeAppointment(new Date('2026-10-28T11:59:00.000Z'), NOW)).toBe(false)
    expect(canChangeAppointment(new Date('2026-10-28T12:00:00.000Z'), NOW)).toBe(true)
  })
})

describe('serialização de agendamento', () => {
  it('não expõe telefone nem observações no objeto público', () => {
    const serialized = serializeAppointment(details, NOW)

    expect(serialized.canChange).toBe(true)
    expect(serialized).not.toHaveProperty('clientPhone')
    expect(serialized).not.toHaveProperty('notes')
  })

  it('bloqueia alteração pública quando faltam menos de 24h', () => {
    const serialized = serializeAppointment(details, new Date('2026-10-29T00:00:00.000Z'))

    expect(serialized.canChange).toBe(false)
  })

  it('mantém telefone e observações no objeto do staff', () => {
    const serialized = serializeStaffAppointment(details)

    expect(serialized.clientPhone).toBe('11999990000')
    expect(serialized.notes).toBe('Primeira visita')
    expect(serialized.startsAt).toBe('2026-10-29T12:00:00.000Z')
  })
})
