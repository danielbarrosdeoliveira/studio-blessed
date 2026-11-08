import { auth } from '~~/server/lib/auth'

/** Prefixos de API que não exigem autenticação. */
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/public', '/api/health']

export default defineEventHandler(async (event) => {
  const path = event.path ?? ''

  // Rotas públicas da API: auth (login/callback), públicos e health check.
  if (PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return
  }

  // Qualquer outro endpoint da API exige sessão válida (401 caso contrário).
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }
})
