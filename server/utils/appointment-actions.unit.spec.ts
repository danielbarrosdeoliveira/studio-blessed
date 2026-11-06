import { describe, expect, it } from 'vitest'
import {
  canCancelAppointment,
  canSetAppointmentStatus
} from './appointment-actions'

function appointment(
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
) {
  return { status } as Parameters<typeof canCancelAppointment>[0]
}

describe('canCancelAppointment', () => {
  it('permite cancelar apenas agendamentos ativos', () => {
    expect(canCancelAppointment(appointment('scheduled'))).toBe(true)
    expect(canCancelAppointment(appointment('completed'))).toBe(false)
    expect(canCancelAppointment(appointment('cancelled'))).toBe(false)
    expect(canCancelAppointment(appointment('no_show'))).toBe(false)
  })
})

describe('canSetAppointmentStatus', () => {
  it('marca concluído/no-show a partir de agendado', () => {
    expect(canSetAppointmentStatus(appointment('scheduled'), 'completed')).toBe(true)
    expect(canSetAppointmentStatus(appointment('scheduled'), 'no_show')).toBe(true)
  })

  it('permite corrigir um status já marcado', () => {
    expect(canSetAppointmentStatus(appointment('completed'), 'no_show')).toBe(true)
    expect(canSetAppointmentStatus(appointment('no_show'), 'completed')).toBe(true)
  })

  it('não altera agendamento cancelado', () => {
    expect(canSetAppointmentStatus(appointment('cancelled'), 'completed')).toBe(false)
  })

  it('não permite status fora de concluído/no-show', () => {
    expect(canSetAppointmentStatus(appointment('scheduled'), 'scheduled' as never)).toBe(false)
    expect(canSetAppointmentStatus(appointment('scheduled'), 'cancelled' as never)).toBe(false)
  })
})
