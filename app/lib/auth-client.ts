import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient

// Social provider sign-in - redirect to metrics dashboard after login
export const signInGoogle = () =>
  authClient.signIn.social({
    provider: 'google',
    callbackURL: '/painel/metricas'
  })
