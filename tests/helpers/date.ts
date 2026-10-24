const TIME_ZONE = 'America/Sao_Paulo'

/** Data local `YYYY-MM-DD` no fuso do produto. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

/** Soma dias sem envolver fuso horário. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year!, month! - 1, day! + days))

  return result.toISOString().slice(0, 10)
}

/** Instante ISO de um horário local de São Paulo (UTC-3). */
export function instantAt(date: string, time: string): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString()
}
