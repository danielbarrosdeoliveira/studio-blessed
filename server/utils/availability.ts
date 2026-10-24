import { and, asc, eq, gt, inArray, lt, or } from 'drizzle-orm'
import { db } from '../database'
import { appointment, service, timeBlock, workingHours } from '../database/schema'
import { computeAvailability } from './availability-engine'
import type { AvailabilitySlot } from './availability-engine'
import type { MinuteInterval } from './time'
import {
  MINUTES_PER_DAY,
  TIME_ZONE,
  dayBounds,
  localDateOf,
  localPartsOf,
  toMinuteInterval
} from './time'

/** Maior buffer aceito no cadastro de serviço (`server/api/services/index.post.ts`). */
const MAX_BUFFER_MIN = 240

/** Antecedência mínima da cliente (ver `docs/discovery.md` §6). */
const CLIENT_LEAD_MS = 3 * 24 * 60 * 60 * 1000

export type AvailabilityOrigin = 'client' | 'staff'

export interface AvailabilityParams {
  professionalId: string
  serviceId: string
  /** Data local `YYYY-MM-DD`. */
  date: string
  origin: AvailabilityOrigin
  /** Injetável para testes; padrão: agora. */
  now?: Date
}

export interface DayAvailability {
  date: string
  timezone: string
  origin: AvailabilityOrigin
  slots: AvailabilitySlot[]
}

/**
 * Disponibilidade de um serviço em um dia:
 * jornada − agendamentos ativos (com buffer) − bloqueios.
 */
export async function getAvailabilityForDay(params: AvailabilityParams): Promise<DayAvailability> {
  const [found] = await db
    .select({
      durationMin: service.durationMin,
      bufferMin: service.bufferMin
    })
    .from(service)
    .where(and(
      eq(service.id, params.serviceId),
      eq(service.professionalId, params.professionalId),
      eq(service.active, true)
    ))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  const bounds = dayBounds(params.date)

  const [hours, appointments, blocks] = await Promise.all([
    db
      .select({
        start: workingHours.startMinute,
        end: workingHours.endMinute
      })
      .from(workingHours)
      .where(and(
        eq(workingHours.professionalId, params.professionalId),
        eq(workingHours.weekday, bounds.weekday)
      ))
      .orderBy(asc(workingHours.startMinute)),

    db
      .select({
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        bufferMin: service.bufferMin
      })
      .from(appointment)
      .innerJoin(service, eq(appointment.serviceId, service.id))
      .where(and(
        eq(appointment.professionalId, params.professionalId),
        inArray(appointment.status, ['scheduled', 'completed']),
        lt(appointment.startsAt, bounds.end),
        gt(appointment.endsAt, new Date(bounds.start.getTime() - MAX_BUFFER_MIN * 60_000))
      )),

    db
      .select({
        startsAt: timeBlock.startsAt,
        endsAt: timeBlock.endsAt,
        recurrence: timeBlock.recurrence
      })
      .from(timeBlock)
      .where(and(
        eq(timeBlock.professionalId, params.professionalId),
        or(
          and(
            lt(timeBlock.startsAt, bounds.end),
            gt(timeBlock.endsAt, bounds.start)
          ),
          eq(timeBlock.recurrence, 'weekly')
        )
      ))
  ])

  const busyIntervals: MinuteInterval[] = []

  for (const item of appointments) {
    // O buffer do agendamento existente também fica ocupado.
    const interval = toMinuteInterval(
      item.startsAt,
      new Date(item.endsAt.getTime() + item.bufferMin * 60_000),
      bounds
    )

    if (interval) {
      busyIntervals.push(interval)
    }
  }

  for (const block of blocks) {
    if (block.recurrence === 'weekly') {
      const start = localPartsOf(block.startsAt)

      if (start.weekday !== bounds.weekday) {
        continue
      }

      const startMinute = start.hour * 60 + start.minute
      const sameDay = localDateOf(block.endsAt) === localDateOf(block.startsAt)
      const endMinute = sameDay
        ? localPartsOf(block.endsAt).hour * 60 + localPartsOf(block.endsAt).minute
        : MINUTES_PER_DAY

      if (endMinute > startMinute) {
        busyIntervals.push({ start: startMinute, end: endMinute })
      }
    } else {
      const interval = toMinuteInterval(block.startsAt, block.endsAt, bounds)

      if (interval) {
        busyIntervals.push(interval)
      }
    }
  }

  const workingIntervals: MinuteInterval[] = hours
    .map(interval => ({ start: interval.start, end: interval.end }))
    .filter(interval => interval.end > interval.start)

  const now = params.now ?? new Date()
  const earliestStart = new Date(
    now.getTime() + (params.origin === 'client' ? CLIENT_LEAD_MS : 0)
  )

  const slots = computeAvailability({
    workingIntervals,
    busyIntervals,
    durationMin: found.durationMin,
    bufferMin: found.bufferMin,
    earliestStart,
    toInstant: minute => new Date(bounds.start.getTime() + minute * 60_000)
  })

  return {
    date: params.date,
    timezone: TIME_ZONE,
    origin: params.origin,
    slots
  }
}

/**
 * Revalidação imediatamente antes de gravar (US6.3): o início precisa estar
 * exatamente na grade de 15 minutos e ainda constar na disponibilidade do dia.
 */
export async function isSlotAvailable(params: {
  professionalId: string
  serviceId: string
  startsAt: Date
  origin: AvailabilityOrigin
  now?: Date
}): Promise<boolean> {
  if (
    Number.isNaN(params.startsAt.getTime())
    || params.startsAt.getSeconds() !== 0
    || params.startsAt.getMilliseconds() !== 0
  ) {
    return false
  }

  const availability = await getAvailabilityForDay({
    professionalId: params.professionalId,
    serviceId: params.serviceId,
    date: localDateOf(params.startsAt),
    origin: params.origin,
    now: params.now
  })

  const target = params.startsAt.getTime()

  return availability.slots.some(slot => Date.parse(slot.startsAt) === target)
}
