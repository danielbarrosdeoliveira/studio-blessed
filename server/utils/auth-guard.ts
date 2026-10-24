import type { H3Event } from 'h3'
import { auth } from '../lib/auth'

type SessionUser = {
  id: string
  name: string
  email: string
  role?: string
  agendaProvider?: string
}

/** Exige sessão válida. Lança 401 se não autenticado. */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  return session.user as SessionUser
}

/** Exige `role = admin`. Lança 403 caso contrário. */
export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await requireUser(event)

  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acesso negado' })
  }

  return user
}
