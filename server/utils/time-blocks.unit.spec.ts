import { describe, expect, it } from 'vitest'
import {
  appointmentOverlapsBlock,
  findBlockConflicts,
  serializeTimeBlock
} from './time-blocks'

function local(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`)
}

describe('bloqueios de horário', () => {
  it('detecta sobreposição absoluta em bloqueio pontual', () => {
    const block = {
      startsAt: local('2026-10-26', '13:00'),
      endsAt: local('2026-10-26', '14:00'),
      recurrence: null
    }

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-10-26', '13:30'),
      endsAt: local('2026-10-26', '14:30')
    }, block)).toBe(true)

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-10-26', '12:30'),
      endsAt: local('2026-10-26', '13:10')
    }, block)).toBe(true)

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-10-26', '14:00'),
      endsAt: local('2026-10-26', '14:30')
    }, block)).toBe(false)
  })

  it('aplica bloqueio semanal somente na weekday e a partir da data inicial', () => {
    const block = {
      startsAt: local('2026-10-26', '13:00'),
      endsAt: local('2026-10-26', '14:00'),
      recurrence: 'weekly'
    }

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-11-02', '13:30'),
      endsAt: local('2026-11-02', '14:30')
    }, block)).toBe(true)

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-11-02', '14:00'),
      endsAt: local('2026-11-02', '14:30')
    }, block)).toBe(false)

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-11-03', '13:30'),
      endsAt: local('2026-11-03', '14:30')
    }, block)).toBe(false)

    expect(appointmentOverlapsBlock({
      startsAt: local('2026-10-19', '13:30'),
      endsAt: local('2026-10-19', '14:30')
    }, block)).toBe(false)
  })

  it('serializa bloqueios e conflitos para a API', () => {
    const block = serializeTimeBlock({
      id: 'block-1',
      professionalId: 'maria',
      startsAt: local('2026-10-26', '13:00'),
      endsAt: local('2026-10-26', '14:00'),
      reason: 'Almoço',
      recurrence: 'weekly',
      createdAt: local('2026-10-24', '10:00')
    })

    expect(block).toEqual({
      id: 'block-1',
      professionalId: 'maria',
      startsAt: '2026-10-26T16:00:00.000Z',
      endsAt: '2026-10-26T17:00:00.000Z',
      reason: 'Almoço',
      recurrence: 'weekly',
      createdAt: '2026-10-24T13:00:00.000Z'
    })

    const conflicts = findBlockConflicts(
      {
        startsAt: local('2026-10-26', '13:00'),
        endsAt: local('2026-10-26', '14:00'),
        recurrence: null
      },
      [
        {
          id: 'appointment-1',
          startsAt: local('2026-10-26', '13:30'),
          endsAt: local('2026-10-26', '14:30'),
          clientName: 'Cliente',
          serviceName: 'Corte'
        },
        {
          id: 'appointment-2',
          startsAt: local('2026-10-26', '15:00'),
          endsAt: local('2026-10-26', '16:00'),
          clientName: 'Outra',
          serviceName: 'Escova'
        }
      ]
    )

    expect(conflicts).toEqual([
      {
        id: 'appointment-1',
        startsAt: '2026-10-26T16:30:00.000Z',
        endsAt: '2026-10-26T17:30:00.000Z',
        clientName: 'Cliente',
        serviceName: 'Corte'
      }
    ])
  })
})
