import type { MinuteInterval } from './time'

export interface AvailabilitySlot {
  /** Início do serviço em ISO 8601 (UTC). */
  startsAt: string
  /** Fim do serviço (sem o buffer) em ISO 8601 (UTC). */
  endsAt: string
  /** Horário local no formato `HH:mm`. */
  label: string
}

export interface AvailabilityEngineInput {
  /** Janelas de jornada em minutos locais. */
  workingIntervals: MinuteInterval[]
  /** Períodos ocupados (agendamentos + bloqueios) em minutos locais. */
  busyIntervals: MinuteInterval[]
  durationMin: number
  bufferMin: number
  /** Primeiro instante permitido (antecedência mínima). */
  earliestStart: Date
  /** Converte minutos locais em instante UTC. */
  toInstant: (minute: number) => Date
  /** Granularidade dos inícios. Padrão: 15 minutos. */
  stepMin?: number
}

export function formatMinute(minute: number): string {
  const hours = Math.floor(minute / 60)
  const minutes = minute % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Calcula os inícios possíveis de um serviço em um dia.
 *
 * Regras (ver `docs/discovery.md` §6):
 * - inícios a cada `stepMin` minutos, alinhados à meia-noite local;
 * - o serviço + buffer precisa caber inteiro em uma janela de jornada;
 * - nenhum início pode colidir com agendamento/bloqueio;
 * - só entram horários a partir de `earliestStart`.
 */
export function computeAvailability(input: AvailabilityEngineInput): AvailabilitySlot[] {
  const {
    workingIntervals,
    busyIntervals,
    durationMin,
    bufferMin,
    earliestStart,
    toInstant,
    stepMin = 15
  } = input

  const occupiedMinutes = durationMin + bufferMin
  const earliest = earliestStart.getTime()
  const seen = new Set<number>()
  const minutes: number[] = []

  for (const interval of workingIntervals) {
    if (interval.end <= interval.start) {
      continue
    }

    const first = Math.ceil(interval.start / stepMin) * stepMin

    for (let start = first; start + occupiedMinutes <= interval.end; start += stepMin) {
      if (seen.has(start)) {
        continue
      }

      if (toInstant(start).getTime() < earliest) {
        continue
      }

      const busyEnd = start + occupiedMinutes
      const conflict = busyIntervals.some(interval => start < interval.end && busyEnd > interval.start)

      if (conflict) {
        continue
      }

      seen.add(start)
      minutes.push(start)
    }
  }

  minutes.sort((a, b) => a - b)

  return minutes.map(minute => ({
    startsAt: toInstant(minute).toISOString(),
    endsAt: toInstant(minute + durationMin).toISOString(),
    label: formatMinute(minute)
  }))
}
