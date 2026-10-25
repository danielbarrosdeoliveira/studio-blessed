import { auth } from '../../lib/auth'
import { db } from '../../database'
import { account, user } from '../../database/schema'
import { eq } from 'drizzle-orm'

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export default defineEventHandler(async (event) => {
  const { data: session } = await auth.api.getSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody(event)
  const { appointmentId, summary, startsAt, endsAt, attendees } = body

  if (!appointmentId || !summary || !startsAt || !endsAt) {
    throw createError({
      statusCode: 400,
      message: 'appointmentId, summary, startsAt e endsAt são obrigatórios'
    })
  }

  const [userRow] = await db
    .select({ agendaProvider: user.agendaProvider })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (userRow?.agendaProvider !== 'google') {
    throw createError({
      statusCode: 400,
      message: 'Profissional não usa agenda Google'
    })
  }

  const [acct] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(1)

  if (!acct?.accessToken) {
    throw createError({
      statusCode: 400,
      message: 'Token do Google não encontrado. Reconecte a agenda.'
    })
  }

  const eventPayload: any = {
    summary,
    start: { dateTime: startsAt, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: endsAt, timeZone: 'America/Sao_Paulo' },
    extendedProperties: {
      private: { appointmentId }
    }
  }

  if (attendees && Array.isArray(attendees)) {
    eventPayload.attendees = attendees.map((email: string) => ({ email }))
  }

  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${acct.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventPayload)
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw createError({
        statusCode: 401,
        message: 'Token do Google expirado. Reconecte a agenda.'
      })
    }
    const text = await res.text()
    throw createError({
      statusCode: res.status,
      message: `Erro ao criar evento no Google Calendar: ${text}`
    })
  }

  const data = await res.json()

  return {
    ok: true,
    googleEventId: data.id,
    htmlLink: data.htmlLink
  }
})
