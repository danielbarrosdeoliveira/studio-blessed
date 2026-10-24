import { describe, expect, it } from 'vitest'
import {
  canCancelAppointment,
  canManageAppointment,
  canSetAppointmentStatus
} from './appointment-actions'

const admin = { id: 'admin-1', role: 'admin' }
const maria = { id: 'maria-1', role: 'partner' }
const ana = { id: 'ana-1', role: 'partner' }

function appointment(
  professionalId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
) {
  return { professionalId, status }
}

describe('canManageAppointment', () => {
  it('libera o admin para qualquer profissional', () => {
    expect(canManageAppointment(admin, 'maria-1')).toBe(true)
    expect(canManageAppointment(admin, 'ana-1')).toBe(true)
  })

  it('limita a partner aos próprios agendamentos', () => {
    expect(canManageAppointment(maria, 'maria-1')).toBe(true)
    expect(canManageAppointment(ana, 'ana-1')).toBe(true)
    expect(canManageAppointment(maria, 'ana-1')).toBe(false)
  })
})

describe('canCancelAppointment', () => {
  it('permite cancelar apenas agendamentos ativos', () => {
    expect(canCancelAppointment(admin, appointment('maria-1', 'scheduled'))).toBe(true)
    expect(canCancelAppointment(admin, appointment('maria-1', 'completed'))).toBe(false)
    expect(canCancelAppointment(admin, appointment('maria-1', 'cancelled'))).toBe(false)
    expect(canCancelAppointment(admin, appointment('maria-1', 'no_show'))).toBe(false)
  })

  it('impede a partner de cancelar agendamento de outra profissional', () => {
    expect(canCancelAppointment(maria, appointment('maria-1', 'scheduled'))).toBe(true)
    expect(canCancelAppointment(maria, appointment('ana-1', 'scheduled'))).toBe(false)
  })
})

describe('canSetAppointmentStatus', () => {
  it('marca concluído/no-show a partir de agendado', () => {
    expect(canSetAppointmentStatus(maria, appointment('maria-1', 'scheduled'), 'completed')).toBe(true)
    expect(canSetAppointmentStatus(maria, appointment('maria-1', 'scheduled'), 'no_show')).toBe(true)
  })

  it('permite ao admin corrigir um status já marcado', () => {
    expect(canSetAppointmentStatus(admin, appointment('ana-1', 'completed'), 'no_show')).toBe(true)
    expect(canSetAppointmentStatus(admin, appointment('ana-1', 'no_show'), 'completed')).toBe(true)
  })

  it('não permite à partner corrigir um status já marcado', () => {
    expect(canSetAppointmentStatus(maria, appointment('maria-1', 'completed'), 'no_show')).toBe(false)
    expect(canSetAppointmentStatus(maria, appointment('maria-1', 'no_show'), 'completed')).toBe(false)
  })

  it('não altera agendamento cancelado', () => {
    expect(canSetAppointmentStatus(admin, appointment('maria-1', 'cancelled'), 'completed')).toBe(false)
  })

  it('não permite status fora de concluído/no-show', () => {
    expect(canSetAppointmentStatus(admin, appointment('maria-1', 'scheduled'), 'scheduled' as never)).toBe(false)
    expect(canSetAppointmentStatus(admin, appointment('maria-1', 'scheduled'), 'cancelled' as never)).toBe(false)
  })
})
