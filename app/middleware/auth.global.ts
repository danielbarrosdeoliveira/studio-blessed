import { authClient } from '~/lib/auth-client'

/** Rotas acessíveis sem autenticação. */
const PUBLIC_PATHS = ['/', '/login', '/agendamento', '/meus-agendamentos']

function isPublic(path: string) {
  return PUBLIC_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Permitir rotas públicas
  if (isPublic(to.path)) {
    return
  }

  // Proteger tudo que estiver em /painel/*
  if (to.path.startsWith('/painel')) {
    const { data: session } = await authClient.useSession(useFetch)

    if (!session.value) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    return
  }

  // Para outras rotas não públicas, também exige autenticação
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})