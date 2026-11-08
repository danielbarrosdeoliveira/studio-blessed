import { auth } from '~~/server/lib/auth'

/**
 * Retorna a sessão atual do Better Auth (ou null se não autenticado).
 * Usado pelo layout do painel para validar a sessão no servidor/SSR.
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  return {
    user: session?.user ?? null,
  }
})
