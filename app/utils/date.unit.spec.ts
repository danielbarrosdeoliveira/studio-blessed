import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  addDaysToIsoDate,
  formatInstantLong,
  formatInstantTime,
  formatIsoDateLong,
  instantOfLocalDateTime,
  isoDateOfInstant,
  todayInTimeZone,
  weekdayOfIsoDate
} from './date'

afterEach(() => {
  vi.useRealTimers()
})

describe('datas do app', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(addDaysToIsoDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToIsoDate('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('formata a data longa em pt-BR', () => {
    expect(formatIsoDateLong('2026-10-31')).toBe('Sábado, 31 de outubro')
  })

  it('converte data e hora locais para ISO UTC', () => {
    expect(instantOfLocalDateTime('2026-10-31', '09:00')).toBe('2026-10-31T12:00:00.000Z')
    expect(instantOfLocalDateTime('2026-10-31', '13:30')).toBe('2026-10-31T16:30:00.000Z')
  })

  it('retorna o dia da semana em pt-BR', () => {
    expect(weekdayOfIsoDate('2026-10-31')).toBe('sábado')
    expect(weekdayOfIsoDate('2026-11-02')).toBe('segunda-feira')
  })

  it('resolve a data local de um instante no fuso de São Paulo', () => {
    expect(isoDateOfInstant('2026-10-27T02:59:00.000Z')).toBe('2026-10-26')
    expect(isoDateOfInstant('2026-10-27T03:00:00.000Z')).toBe('2026-10-27')
  })

  it('formata horário e data longa no fuso de São Paulo', () => {
    expect(formatInstantTime('2026-10-27T12:00:00.000Z')).toBe('09:00')
    expect(formatInstantLong('2026-10-31T12:00:00.000Z')).toBe('Sábado, 31 de outubro às 09:00')
  })

  it('calcula o dia atual no fuso do produto', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T02:59:00.000Z'))

    expect(todayInTimeZone()).toBe('2026-10-26')
  })
})
