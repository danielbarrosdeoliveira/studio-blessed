import { CalendarDateTime, fromDate, parseDate, toZoned } from '@internationalized/date'

/** Fuso único do produto (ver `docs/spec.md`). */
export const TIME_ZONE = 'America/Sao_Paulo'

export const MINUTES_PER_DAY = 24 * 60

export interface DayBounds {
  /** Data local no formato `YYYY-MM-DD`. */
  date: string
  /** 0 = domingo … 6 = sábado. */
  weekday: number
  /** Instante UTC da meia-noite local. */
  start: Date
  /** Instante UTC da meia-noite local do dia seguinte. */
  end: Date
}

export interface MinuteInterval {
  /** Minutos desde a meia-noite local (inclusivo). */
  start: number
  /** Minutos desde a meia-noite local (exclusivo). */
  end: number
}

/** Valida uma data `YYYY-MM-DD` (inclusive datas inexistentes, como 30/02). */
export function isValidDate(date: string): boolean {
  try {
    parseDate(date)
    return true
  } catch {
    return false
  }
}

/** Limites UTC de um dia no fuso do produto. */
export function dayBounds(date: string): DayBounds {
  const parsed = parseDate(date)
  const next = parsed.add({ days: 1 })

  return {
    date,
    weekday: parsed.toDate('UTC').getUTCDay(),
    start: toZoned(
      new CalendarDateTime(parsed.year, parsed.month, parsed.day, 0, 0),
      TIME_ZONE
    ).toDate(),
    end: toZoned(
      new CalendarDateTime(next.year, next.month, next.day, 0, 0),
      TIME_ZONE
    ).toDate()
  }
}

/** Data local (`YYYY-MM-DD`) de um instante. */
export function localDateOf(instant: Date): string {
  const zoned = fromDate(instant, TIME_ZONE)
  const month = String(zoned.month).padStart(2, '0')
  const day = String(zoned.day).padStart(2, '0')

  return `${zoned.year}-${month}-${day}`
}

/** Componentes de relógio local de um instante. */
export function localPartsOf(instant: Date) {
  const zoned = fromDate(instant, TIME_ZONE)

  return {
    weekday: new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day)).getUTCDay(),
    hour: zoned.hour,
    minute: zoned.minute
  }
}

/**
 * Converte um intervalo absoluto em minutos desde a meia-noite local,
 * recortando o que estiver fora do dia consultado.
 */
export function toMinuteInterval(
  start: Date,
  end: Date,
  bounds: DayBounds
): MinuteInterval | null {
  const clippedStart = Math.max(start.getTime(), bounds.start.getTime())
  const clippedEnd = Math.min(end.getTime(), bounds.end.getTime())

  if (clippedEnd <= clippedStart) {
    return null
  }

  return {
    start: Math.round((clippedStart - bounds.start.getTime()) / 60_000),
    end: Math.round((clippedEnd - bounds.start.getTime()) / 60_000)
  }
}
