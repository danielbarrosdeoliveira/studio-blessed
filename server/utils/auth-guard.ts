import type { H3Event } from 'h3'
import { auth } from '../lib/auth'

type SessionUser = {
  id: string
  name: string
  email: string
}

/** Exige sessão válida. Lança 401 se não autenticado. */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  return session.user as SessionUser
}
