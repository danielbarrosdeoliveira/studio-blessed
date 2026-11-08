import { requireUser } from '../../utils/auth-guard'
import { listCalendars } from '../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const result = await listCalendars()

  if (!result.ok) {
    throw createError({
      statusCode: result.statusCode,
      message: result.message
    })
  }

  return {
    calendars: result.calendars.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary ?? false,
      accessRole: cal.accessRole,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor
    }))
  }
})
