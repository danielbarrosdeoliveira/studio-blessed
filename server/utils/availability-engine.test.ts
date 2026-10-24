import { describe, expect, it } from 'vitest'
import { computeAvailability } from './availability-engine'

const DAY_START = Date.UTC(2026, 0, 5)
const EPOCH = new Date(0)

const toInstant = (minute: number) => new Date(DAY_START + minute * 60_000)

const base = {
  workingIntervals: [{ start: 9 * 60, end: 18 * 60 }],
  busyIntervals: [],
  durationMin: 40,
  bufferMin: 0,
  earliestStart: EPOCH,
  toInstant
}

describe('computeAvailability', () => {
  it('gera inícios a cada 15 minutos dentro da jornada', () => {
    const slots = computeAvailability(base)

    expect(slots[0]?.label).toBe('09:00')
    expect(slots.at(-1)?.label).toBe('17:15')
    expect(slots).toHaveLength(34)
    expect(slots.every((slot, index) => {
      if (index === 0) {
        return true
      }

      return Date.parse(slot.startsAt) - Date.parse(slots[index - 1]!.startsAt) === 15 * 60_000
    })).toBe(true)
  })

  it('não oferece início quando o serviço não cabe antes do fim da jornada', () => {
    const slots = computeAvailability({
      ...base,
      durationMin: 90
    })

    expect(slots.at(-1)?.label).toBe('16:30')
  })

  it('exige que o buffer caiba junto do serviço', () => {
    const slots = computeAvailability({
      ...base,
      workingIntervals: [{ start: 9 * 60, end: 10 * 60 }],
      durationMin: 50,
      bufferMin: 10
    })

    expect(slots.map(slot => slot.label)).toEqual(['09:00'])
  })

  it('respeita intervalos múltiplos de jornada (almoço)', () => {
    const slots = computeAvailability({
      ...base,
      workingIntervals: [
        { start: 9 * 60, end: 12 * 60 },
        { start: 13 * 60, end: 18 * 60 }
      ]
    })

    expect(slots.filter(slot => slot.label < '12:00').at(-1)?.label).toBe('11:15')
    expect(slots.some(slot => slot.label >= '12:00' && slot.label < '13:00')).toBe(false)
    expect(slots.find(slot => slot.label >= '13:00')?.label).toBe('13:00')
  })

  it('alinha o primeiro início à grade de 15 minutos', () => {
    const slots = computeAvailability({
      ...base,
      workingIntervals: [{ start: 9 * 60 + 7, end: 10 * 60 }]
    })

    expect(slots[0]?.label).toBe('09:15')
  })

  it('aplica a antecedência mínima', () => {
    const slots = computeAvailability({
      ...base,
      earliestStart: toInstant(10 * 60)
    })

    expect(slots[0]?.label).toBe('10:00')
  })

  it('ocupa o buffer de um agendamento existente', () => {
    const slots = computeAvailability({
      ...base,
      // Agendamento 09:00–09:40 + buffer de 10 min.
      busyIntervals: [{ start: 9 * 60, end: 9 * 60 + 50 }]
    })

    expect(slots[0]?.label).toBe('10:00')
  })

  it('permite encaixe imediatamente após o buffer', () => {
    const slots = computeAvailability({
      ...base,
      durationMin: 30,
      busyIntervals: [{ start: 9 * 60, end: 9 * 60 + 30 }]
    })

    expect(slots[0]?.label).toBe('09:30')
  })

  it('não repete inícios em janelas sobrepostas', () => {
    const slots = computeAvailability({
      ...base,
      workingIntervals: [
        { start: 9 * 60, end: 10 * 60 },
        { start: 9 * 60, end: 10 * 60 }
      ]
    })

    expect(slots.map(slot => slot.label)).toEqual(['09:00', '09:15'])
  })

  it('devolve fim do serviço sem somar o buffer', () => {
    const slots = computeAvailability({
      ...base,
      durationMin: 40,
      bufferMin: 10
    })

    const first = slots[0]!

    expect(Date.parse(first.endsAt) - Date.parse(first.startsAt)).toBe(40 * 60_000)
  })
})
