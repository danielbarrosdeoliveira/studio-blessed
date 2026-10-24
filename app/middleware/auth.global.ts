import { authClient } from '~/lib/auth-client'

/** Rotas acessíveis sem autenticação. */
const PUBLIC_PATHS = ['/login']

function isPublic(path: string) {
  return PUBLIC_PATHS.some(publicPath =>
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublic(to.path)) {
    return
  }

  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
