import { db } from '../database'
import { account } from '../database/schema'
import { eq } from 'drizzle-orm'

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'

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

export type CalendarListResult = 
  | { ok: true; calendars: CalendarListEntry[] }
  | GoogleCalendarError

export type EventsFromCalendarsResult = 
  | { ok: true; calendars: Array<{ calendarId: string; events: GoogleCalendarEvent[] }> }
  | GoogleCalendarError

export interface CalendarListEntry {
  id: string
  summary: string
  primary?: boolean
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  backgroundColor?: string
  foregroundColor?: string
}

/**
 * Configuration for which calendars to check for availability and where to create events.
 * Can be overridden via environment variables.
 */
export interface GoogleCalendarConfig {
  /** Calendar IDs to check for conflicts (availability). Defaults to all calendars with writer/owner access. */
  availabilityCalendarIds: string[]
  /** Calendar ID where new events should be created. Defaults to 'primary'. */
  createEventCalendarId: string
}

/**
 * Gets the Google Calendar configuration from environment or defaults.
 */
export function getGoogleCalendarConfig(): GoogleCalendarConfig {
  // Parse comma-separated calendar IDs from env, or use defaults
  const availabilityIds = process.env.GOOGLE_CALENDAR_AVAILABILITY_IDS
    ? process.env.GOOGLE_CALENDAR_AVAILABILITY_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : ['primary']

  const createCalendarId = process.env.GOOGLE_CALENDAR_CREATE_ID || 'primary'

  return {
    availabilityCalendarIds: availabilityIds,
    createEventCalendarId: createCalendarId,
  }
}

/**
 * Gets the Google account record for the studio owner (single-owner model).
 * Returns the account with tokens needed for server-to-server calls.
 */
async function getOwnerGoogleAccount() {
  const [acct] = await db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      scope: account.scope,
    })
    .from(account)
    .where(eq(account.providerId, 'google'))
    .limit(1)

  return acct
}

/**
 * Refreshes the Google access token using the stored refresh token.
 * Updates the database with the new access token and expiry.
 */
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })

    const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Google Calendar] Token refresh failed:', res.status, errorText)
      return null
    }

    const data = (await res.json()) as {
      access_token: string
      expires_in: number
      refresh_token?: string
      scope?: string
      token_type: string
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000)

    // Update the database with the new access token
    await db
      .update(account)
      .set({
        accessToken: data.access_token,
        accessTokenExpiresAt: expiresAt,
        ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
        updatedAt: new Date(),
      })
      .where(eq(account.providerId, 'google'))

    return { accessToken: data.access_token, expiresAt }
  } catch (error) {
    console.error('[Google Calendar] Token refresh error:', error)
    return null
  }
}

/**
 * Gets a valid access token for the studio owner, refreshing if necessary.
 * This is the core of the server-to-server architecture: the backend uses the
 * owner's refresh token to maintain a valid access token for API calls.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const acct = await getOwnerGoogleAccount()

  if (!acct?.accessToken || !acct?.refreshToken) {
    console.warn('[Google Calendar] No Google account connected for the studio owner')
    return null
  }

  // Check if current access token is still valid (with 5-minute buffer)
  const expiresAt = acct.accessTokenExpiresAt ? new Date(acct.accessTokenExpiresAt).getTime() : 0
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (expiresAt > now + fiveMinutes) {
    return acct.accessToken
  }

  // Token expired or expiring soon, refresh it
  console.log('[Google Calendar] Access token expired, refreshing...')
  const refreshed = await refreshAccessToken(acct.refreshToken)

  if (!refreshed) {
    console.error('[Google Calendar] Failed to refresh access token')
    return null
  }

  return refreshed.accessToken
}

/**
 * Lists all calendars accessible by the studio owner.
 * Useful for discovering calendar IDs (e.g., 'Pessoal', 'Família', 'Studio Blessed').
 */
export async function listCalendars(): Promise<CalendarListResult> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.',
    }
  }

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      if (res.status === 401) {
        return {
          ok: false,
          statusCode: 401,
          message: 'Token do Google expirado. Reconecte a agenda.',
        }
      }
      const text = await res.text()
      return {
        ok: false,
        statusCode: res.status,
        message: `Erro ao listar calendários: ${text}`,
      }
    }

    const data = (await res.json()) as { items?: CalendarListEntry[] }
    return {
      ok: true,
      calendars: data.items ?? []
    }
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: `Erro de rede ao listar calendários: ${error instanceof Error ? error.message : 'unknown'}`,
    }
  }
}

/**
 * Fetches events from multiple calendars for a given time range.
 * This is used for availability checking - the "single source of truth".
 */
export async function getEventsFromCalendars(
  calendarIds: string[],
  timeMin: string,
  timeMax: string
): Promise<EventsFromCalendarsResult> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.',
    }
  }

  const results: Array<{ calendarId: string; events: GoogleCalendarEvent[] }> = []

  for (const calendarId of calendarIds) {
    try {
      const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`)
      url.searchParams.set('timeMin', timeMin)
      url.searchParams.set('timeMax', timeMax)
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')
      url.searchParams.set('maxResults', '250')
      url.searchParams.set('showDeleted', 'false')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          return {
            ok: false,
            statusCode: 401,
            message: 'Token do Google expirado. Reconecte a agenda.',
          }
        }
        if (res.status === 404) {
          console.warn(`[Google Calendar] Calendar not found: ${calendarId}`)
          continue // Skip calendars that don't exist or aren't accessible
        }
        const text = await res.text()
        console.error(`[Google Calendar] Error fetching events from ${calendarId}:`, res.status, text)
        continue
      }

      const data = (await res.json()) as { items?: GoogleCalendarEvent[] }
      results.push({ calendarId, events: data.items ?? [] })
    } catch (error) {
      console.error(`[Google Calendar] Network error fetching events from ${calendarId}:`, error)
      continue
    }
  }

  return {
    ok: true,
    calendars: results
  }
}

export interface GoogleCalendarEvent {
  id?: string
  summary?: string
  status?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  transparency?: string
}

/**
 * Creates a Google Calendar event for an appointment.
 * Uses the configured calendar for event creation (default: primary).
 */
export async function createGoogleCalendarEvent(
  payload: GoogleEventPayload
): Promise<GoogleEventResponse | GoogleCalendarError> {
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.',
    }
  }

  const config = getGoogleCalendarConfig()
  const calendarId = config.createEventCalendarId

  const eventPayload = {
    summary: payload.summary,
    start: { dateTime: payload.startsAt, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: payload.endsAt, timeZone: 'America/Sao_Paulo' },
    extendedProperties: {
      private: { appointmentId: payload.appointmentId }
    },
    attendees: payload.attendees?.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 dia antes (24h)
        { method: 'popup', minutes: 120 },  // 2 horas antes
        { method: 'popup', minutes: 60 }    // 1 hora antes
      ]
    }
  }

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
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
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    }
  }

  const config = getGoogleCalendarConfig()
  const calendarId = config.createEventCalendarId

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
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
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
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    }
  }

  const config = getGoogleCalendarConfig()
  const calendarId = config.createEventCalendarId

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
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