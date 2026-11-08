import { useRequestHeaders, useFetch, navigateTo } from '#app'

/** Rotas acessíveis sem autenticação. */
const PUBLIC_PATHS = ['/', '/login', '/agendamento', '/meus-agendamentos']

function isPublic(path: string) {
  return PUBLIC_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))
}

/** Verifica sessão no servidor via Better Auth (com cookies da requisição).
 * Retorna um redirect se não autenticado, ou undefined se autenticado. */
async function requireSession(to: string) {
  const headers = useRequestHeaders(['cookie'])
  const { data: session } = await useFetch<{ user: unknown | null }>('/api/auth/session', {
    headers
  })

  if (!session.value?.user) {
    return navigateTo({
      path: '/login',
      query: { redirect: to }
    })
  }
  // Sessão válida: não retornar nada (permite a navegação)
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Permitir rotas públicas
  if (isPublic(to.path)) {
    return
  }

  // Proteger tudo que estiver em /painel/*
  if (to.path.startsWith('/painel')) {
    return await requireSession(to.fullPath)
  }

  // Para outras rotas não públicas, também exige autenticação
  return await requireSession(to.fullPath)
})
