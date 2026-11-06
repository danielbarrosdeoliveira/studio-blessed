import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db } from '../database'
import { user } from '../database/schema'
import { requireUser } from './auth-guard'

/** Campos públicos de uma profissional (nunca inclui credenciais). */
export const professionalColumns = {
  id: user.id,
  name: user.name,
  email: user.email
}

/**
 * Acesso ao recurso único (só há uma dona do salão).
 * Lança 404 se não existir.
 */
export async function requireProfessionalAccess(event: H3Event, professionalId: string) {
  const current = await requireUser(event)

  if (current.id !== professionalId) {
    throw createError({ statusCode: 403, message: 'Acesso negado' })
  }

  return current
}

/** Garante que o id pertence a um usuário existente. */
export async function getProfessionalOr404(professionalId: string) {
  const [professional] = await db
    .select(professionalColumns)
    .from(user)
    .where(eq(user.id, professionalId))
    .limit(1)

  if (!professional) {
    throw createError({ statusCode: 404, message: 'Profissional não encontrada' })
  }

  return professional
}
