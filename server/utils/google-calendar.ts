import { db } from '../database'
import { account } from '../database/schema'
import { eq } from 'drizzle-orm'

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export interface GoogleEventPayload {
  summary: string
  startsAt: string
  endsAt: string
  appointmentId: string
  attendees?: string[]
}

export interface GoogleEventResponse {
  ok: true
  googleEventId: string
  htmlLink?: string
}

export interface GoogleCalendarError {
  ok: false
  statusCode: number
  message: string
}

/**
 * Gets the Google access token for the current user (dona do salão).
 * In single-owner model, there's only one user.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const [acct] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(eq(account.providerId, 'google'))
    .limit(1)

  return acct?.accessToken ?? null
}

/**
 * Creates a Google Calendar event for an appointment.
 */
export async function createGoogleCalendarEvent(
  payload: GoogleEventPayload
): Promise<GoogleEventResponse | GoogleCalendarError> {
  const accessToken = await getGoogleAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    }
  }

  const eventPayload = {
    summary: payload.summary,
    start: { dateTime: payload.startsAt, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: payload.endsAt, timeZone: 'America/Sao_Paulo' },
    extendedProperties: {
      private: { appointmentId: payload.appointmentId }
    },
    attendees: payload.attendees?.map((email) => ({ email }))
  }

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    })

    if (!res.ok) {
      if (res.status === 401) {
        return {
          ok: false,
          statusCode: 401,
          message: 'Token do Google expirado. Reconecte a agenda.'
        }
      }
      const text = await res.text()
      return {
        ok: false,
        statusCode: res.status,
        message: `Erro ao criar evento no Google Calendar: ${text}`
      }
    }

    const data = (await res.json()) as { id?: string; htmlLink?: string }

    return {
      ok: true,
      googleEventId: data.id!,
      htmlLink: data.htmlLink
    }
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: `Erro de rede ao criar evento: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }
}

/**
 * Updates a Google Calendar event for an appointment.
 */
export async function updateGoogleCalendarEvent(
  googleEventId: string,
  payload: Partial<GoogleEventPayload>
): Promise<GoogleEventResponse | GoogleCalendarError> {
  const accessToken = await getGoogleAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    }
  }

  const eventPayload: Record<string, unknown> = {}

  if (payload.summary) eventPayload.summary = payload.summary
  if (payload.startsAt)
    eventPayload.start = { dateTime: payload.startsAt, timeZone: 'America/Sao_Paulo' }
  if (payload.endsAt) eventPayload.end = { dateTime: payload.endsAt, timeZone: 'America/Sao_Paulo' }
  if (payload.appointmentId) {
    eventPayload.extendedProperties = { private: { appointmentId: payload.appointmentId } }
  }
  if (payload.attendees) eventPayload.attendees = payload.attendees.map((email) => ({ email }))

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    })

    if (!res.ok) {
      if (res.status === 401) {
        return {
          ok: false,
          statusCode: 401,
          message: 'Token do Google expirado. Reconecte a agenda.'
        }
      }
      if (res.status === 404) {
        // Event was deleted externally, treat as if it never existed
        return {
          ok: false,
          statusCode: 404,
          message: 'Evento não encontrado no Google Calendar'
        }
      }
      const text = await res.text()
      return {
        ok: false,
        statusCode: res.status,
        message: `Erro ao atualizar evento no Google Calendar: ${text}`
      }
    }

    const data = (await res.json()) as { id?: string; htmlLink?: string }

    return {
      ok: true,
      googleEventId: data.id!,
      htmlLink: data.htmlLink
    }
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: `Erro de rede ao atualizar evento: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }
}

/**
 * Deletes a Google Calendar event for an appointment.
 */
export async function deleteGoogleCalendarEvent(
  googleEventId: string
): Promise<{ ok: true } | GoogleCalendarError> {
  const accessToken = await getGoogleAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    }
  }

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!res.ok) {
      if (res.status === 401) {
        return {
          ok: false,
          statusCode: 401,
          message: 'Token do Google expirado. Reconecte a agenda.'
        }
      }
      if (res.status === 404) {
        // Already deleted, that's fine
        return { ok: true }
      }
      const text = await res.text()
      return {
        ok: false,
        statusCode: res.status,
        message: `Erro ao excluir evento no Google Calendar: ${text}`
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: `Erro de rede ao excluir evento: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }
}
