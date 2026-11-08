import { and, asc, eq, gt, inArray, lt } from 'drizzle-orm'
import { db } from '../database'
import { appointment, service, workingHours } from '../database/schema'
import { computeAvailability } from './availability-engine'
import type { AvailabilitySlot } from './availability-engine'
import type { MinuteInterval } from './time'
import { TIME_ZONE, addDaysToIsoDate, dayBounds, localDateOf, toMinuteInterval } from './time'
import {
  getEventsFromCalendars,
  getGoogleCalendarConfig,
  type GoogleCalendarEvent
} from './google-calendar'

/** Maior buffer aceito no cadastro de serviço (`server/api/services/index.post.ts`). */
const MAX_BUFFER_MIN = 240

/**
 * Antecedência mínima da cliente (ver `docs/discovery.md` §6).
 *
 * A regra é por **data local**, não por instante: a cliente pode agendar
 * qualquer horário a partir do 3º dia — inclusive o primeiro slot (09:00)
 * do dia limite.
 */
const CLIENT_LEAD_DAYS = 3

export type AvailabilityOrigin = 'client' | 'staff'

export interface AvailabilityParams {
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
 * Disponibilidade do serviço da dona do salão:
 * jornada − agendamentos ativos (com buffer) − bloqueios − eventos do Google Calendar.
 *
 * O Google Calendar é a **única fonte da verdade** para horários ocupados.
 * Buscamos eventos em TODOS os calendários configurados (primary, Pessoal, Família, Studio Blessed, etc.)
 * Se houver evento em QUALQUER um deles, o horário fica indisponível.
 */
export async function getAvailabilityForDay(params: AvailabilityParams): Promise<DayAvailability> {
  const [found] = await db
    .select({
      durationMin: service.durationMin,
      bufferMin: service.bufferMin
    })
    .from(service)
    .where(and(eq(service.id, params.serviceId), eq(service.active, true)))
    .limit(1)

  if (!found) {
    throw createError({ statusCode: 404, message: 'Serviço não encontrado' })
  }

  const bounds = dayBounds(params.date)

  // Fetch local data and Google Calendar events in parallel
  const [hours, appointments, googleCalendarEvents] = await Promise.all([
    db
      .select({
        start: workingHours.startMinute,
        end: workingHours.endMinute
      })
      .from(workingHours)
      .where(eq(workingHours.weekday, bounds.weekday))
      .orderBy(asc(workingHours.startMinute)),

    db
      .select({
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        bufferMin: service.bufferMin
      })
      .from(appointment)
      .innerJoin(service, eq(appointment.serviceId, service.id))
      .where(
        and(
          inArray(appointment.status, ['scheduled', 'completed']),
          lt(appointment.startsAt, bounds.end),
          gt(appointment.endsAt, new Date(bounds.start.getTime() - MAX_BUFFER_MIN * 60_000))
        )
      ),

    // Fetch events from Google Calendar (single source of truth)
    fetchGoogleCalendarEvents(params.date, bounds)
  ])

  const busyIntervals: MinuteInterval[] = []

  // 1. Local appointments (with their buffers)
  for (const item of appointments) {
    const interval = toMinuteInterval(
      item.startsAt,
      new Date(item.endsAt.getTime() + item.bufferMin * 60_000),
      bounds
    )

    if (interval) {
      busyIntervals.push(interval)
    }
  }

  // 2. Google Calendar events (THE single source of truth for external conflicts)
  // These events come from all configured calendars (primary, Pessoal, Família, etc.)
  for (const { events } of googleCalendarEvents) {
    for (const event of events) {
      // Skip cancelled events and transparent (free) events
      if (event.status === 'cancelled' || event.transparency === 'transparent') {
        continue
      }

      const startStr = event.start?.dateTime ?? event.start?.date
      const endStr = event.end?.dateTime ?? event.end?.date

      if (!startStr || !endStr) {
        continue
      }

      const eventStart = new Date(startStr)
      const eventEnd = new Date(endStr)

      // Check if event overlaps with the day bounds
      if (eventEnd <= bounds.start || eventStart >= bounds.end) {
        continue
      }

      const interval = toMinuteInterval(eventStart, eventEnd, bounds)
      if (interval) {
        busyIntervals.push(interval)
      }
    }
  }

  const workingIntervals: MinuteInterval[] = hours
    .map((interval) => ({ start: interval.start, end: interval.end }))
    .filter((interval) => interval.end > interval.start)

  const now = params.now ?? new Date()

  /**
   * Para a cliente, o primeiro horário permitido é a meia-noite local do
   * 3º dia — assim o primeiro slot do dia limite já fica disponível.
   * Para a dona, vale o instante atual (encaixes e hoje/amanhã).
   */
  const earliestStart =
    params.origin === 'client'
      ? dayBounds(addDaysToIsoDate(localDateOf(now), CLIENT_LEAD_DAYS)).start
      : now

  const slots = computeAvailability({
    workingIntervals,
    busyIntervals,
    durationMin: found.durationMin,
    bufferMin: found.bufferMin,
    earliestStart,
    toInstant: (minute) => new Date(bounds.start.getTime() + minute * 60_000)
  })

  return {
    date: params.date,
    timezone: TIME_ZONE,
    origin: params.origin,
    slots
  }
}

/**
 * Fetches Google Calendar events for all configured calendars for a given day.
 * Returns events from all calendars that the studio owner has access to.
 */
async function fetchGoogleCalendarEvents(
  date: string,
  bounds: { start: Date; end: Date; weekday: number }
): Promise<Array<{ calendarId: string; events: GoogleCalendarEvent[] }>> {
  const config = getGoogleCalendarConfig()
  const calendarIds = config.availabilityCalendarIds

  if (calendarIds.length === 0) {
    return []
  }

  // Format timeMin/timeMax for Google Calendar API (RFC3339)
  const timeMin = bounds.start.toISOString()
  const timeMax = bounds.end.toISOString()

  const result = await getEventsFromCalendars(calendarIds, timeMin, timeMax)

  if (!result.ok) {
    // Log error but don't fail - fall back to local data only
    console.error('[Availability] Failed to fetch Google Calendar events:', result.message)
    return []
  }

  return result.calendars
}

/**
 * Revalidação imediatamente antes de gravar (US6.3): o início precisa estar
 * exatamente na grade de 15 minutos e ainda constar na disponibilidade do dia.
 */
export async function isSlotAvailable(params: {
  serviceId: string
  startsAt: Date
  origin: AvailabilityOrigin
  now?: Date
}): Promise<boolean> {
  if (
    Number.isNaN(params.startsAt.getTime()) ||
    params.startsAt.getSeconds() !== 0 ||
    params.startsAt.getMilliseconds() !== 0
  ) {
    return false
  }

  const availability = await getAvailabilityForDay({
    serviceId: params.serviceId,
    date: localDateOf(params.startsAt),
    origin: params.origin,
    now: params.now
  })

  const target = params.startsAt.getTime()

  return availability.slots.some((slot) => Date.parse(slot.startsAt) === target)
}
