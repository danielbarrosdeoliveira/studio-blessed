import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  // Global error handler for auth operations
  onError: (error) => {
    console.error('[Auth Client Error]:', error)
    // Could show toast notification here if needed
  }
})

export const { signIn, signUp, signOut, useSession } = authClient

// Social provider sign-in - redirect to dashboard after login
export const signInGoogle = () => authClient.signIn.social({
  provider: 'google',
  callbackURL: '/painel'
})