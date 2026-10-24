import { authClient } from '~/lib/auth-client'

type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string
  agendaProvider?: string
}

/**
 * Sessão compartilhada do Better Auth.
 * Usa `useFetch` para funcionar no SSR e hidratar sem refetch no cliente.
 */
export async function useUserSession() {
  const { data, isPending, error } = await authClient.useSession(useFetch)

  const user = computed(() => (data.value?.user ?? null) as SessionUser | null)
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  return { data, user, isAuthenticated, isAdmin, isPending, error }
}
