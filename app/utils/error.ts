/** Extrai a mensagem de erro devolvida pelas rotas do Nuxt. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: { message?: string } } | null)?.data

  return data?.message ?? fallback
}
