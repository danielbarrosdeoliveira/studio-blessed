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

  const timeMin = getQuery(event).timeMin as string ?? new Date().toISOString()
  const timeMax = getQuery(event).timeMax as string ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`)
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '100')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${acct.accessToken}` }
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw createError({
        statusCode: 401,
        message: 'Token do Google expirado. Reconecte a agenda.'
      })
    }
    throw createError({
      statusCode: res.status,
      message: 'Erro ao buscar eventos do Google Calendar'
    })
  }

  const data = await res.json()

  const busy = (data.items ?? []).map((item: any) => ({
    id: item.id,
    summary: item.summary,
    startsAt: item.start?.dateTime ?? item.start?.date,
    endsAt: item.end?.dateTime ?? item.end?.date,
    busy: item.status !== 'cancelled'
  }))

  return { busy }
})
