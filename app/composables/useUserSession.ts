import { authClient } from '~/lib/auth-client'

type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
}

/**
 * Sessão compartilhada do Better Auth.
 * Usa `useFetch` para funcionar no SSR e hidratar sem refetch no cliente.
 */
export async function useUserSession() {
  const { data, isPending, error } = await authClient.useSession(useFetch)

  const user = computed(() => (data.value?.user ?? null) as SessionUser | null)
  const isAuthenticated = computed(() => !!user.value)

  return { data, user, isAuthenticated, isPending, error }
}
