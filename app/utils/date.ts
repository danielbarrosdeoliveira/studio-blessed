/** Fuso único do produto. */
export const APP_TIME_ZONE = 'America/Sao_Paulo'

/** Data local (`YYYY-MM-DD`) no fuso do produto. */
export function todayInTimeZone(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

/** Soma dias a uma data `YYYY-MM-DD` sem envolver fuso horário. */
export function addDaysToIsoDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year!, month! - 1, day! + days))

  return result.toISOString().slice(0, 10)
}

/** Ex.: `Sábado, 31 de outubro`. */
export function formatIsoDateLong(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year!, month! - 1, day!, 12))

  return capitalize(new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(parsed))
}

/** Ex.: `Sábado, 31 de outubro às 09:00`. */
export function formatInstantLong(iso: string): string {
  return capitalize(new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso)))
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
