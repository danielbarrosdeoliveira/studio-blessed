import { describe, expect, it } from 'vitest'
import { dayBounds, isValidDate, localDateOf, toMinuteInterval } from './time'

describe('time', () => {
  it('calcula os limites UTC do dia em America/Sao_Paulo', () => {
    const bounds = dayBounds('2026-10-27')

    expect(bounds.start.toISOString()).toBe('2026-10-27T03:00:00.000Z')
    expect(bounds.end.toISOString()).toBe('2026-10-28T03:00:00.000Z')
    expect(bounds.weekday).toBe(2)
  })

  it('resolve a data local de um instante perto da meia-noite', () => {
    expect(localDateOf(new Date('2026-10-27T02:59:00.000Z'))).toBe('2026-10-26')
    expect(localDateOf(new Date('2026-10-27T03:00:00.000Z'))).toBe('2026-10-27')
  })

  it('valida datas inexistentes', () => {
    expect(isValidDate('2026-10-27')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('27/10/2026')).toBe(false)
  })

  it('recorta intervalos para o dia consultado', () => {
    const bounds = dayBounds('2026-10-27')
    const interval = toMinuteInterval(
      new Date('2026-10-26T23:00:00.000Z'),
      new Date('2026-10-27T04:00:00.000Z'),
      bounds
    )

    expect(interval).toEqual({ start: 0, end: 60 })
  })

  it('ignora intervalos fora do dia', () => {
    const bounds = dayBounds('2026-10-27')

    expect(toMinuteInterval(
      new Date('2026-10-26T10:00:00.000Z'),
      new Date('2026-10-26T11:00:00.000Z'),
      bounds
    )).toBeNull()
  })
})
