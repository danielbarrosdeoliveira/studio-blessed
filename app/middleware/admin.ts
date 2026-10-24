/**
 * Restringe a página a usuários com `role = admin`.
 * Uso: `definePageMeta({ middleware: ['auth', 'admin'] })`
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAdmin } = await useUserSession()

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
