import { fetch as testFetch } from '@nuxt/test-utils/e2e'
import { TEST_PASSWORD } from '../env'

export interface SignedInUser {
  cookie: string
  userId: string
}

/** Faz login no Better Auth e monta o header `cookie` para as rotas protegidas. */
export async function signIn(email: string): Promise<SignedInUser> {
  const response = await testFetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: TEST_PASSWORD })
  })

  if (!response.ok) {
    throw new Error(`Login falhou para ${email}: ${response.status}`)
  }

  const data = await response.json() as { user: { id: string } }
  const cookies = response.headers.getSetCookie()

  if (!cookies.length) {
    throw new Error(`Login sem cookie de sessão para ${email}`)
  }

  return {
    cookie: cookies.map(value => value.split(';')[0]).join('; '),
    userId: data.user.id
  }
}

export function authHeaders(cookie: string) {
  return { cookie }
}

/** Extrai o status HTTP de erros do ofetch/Nuxt sem depender do nome do campo. */
export function errorStatus(error: unknown): number | undefined {
  const value = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
  }

  return value.statusCode ?? value.status ?? value.response?.status
}
