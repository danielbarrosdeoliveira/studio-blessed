/**
 * Configuração compartilhada entre scripts, Vitest e Playwright.
 * O banco de teste é separado do banco de desenvolvimento.
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  ?? 'postgres://studio:studio@localhost:5432/studio_blessed_test'

export const TEST_AUTH_SECRET = 'studio-blessed-test-secret-nao-use-em-producao'

export const TEST_PASSWORD = 'senha123456'

/**
 * Modelo single-owner: existe apenas a dona do salão.
 * Qualquer usuário autenticado gerencia a agenda, os serviços e a jornada.
 */
export const TEST_USERS = {
  owner: { email: 'owner@studioblessed.test', name: 'Dona Studio' }
}

export const INTEGRATION_PORT = 3101
export const E2E_PORT = 3100

export const INTEGRATION_BASE_URL = `http://127.0.0.1:${INTEGRATION_PORT}`
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`

/** Credenciais repassadas ao subprocesso do Nuxt nos testes. */
export const TEST_SERVER_ENV = {
  DATABASE_URL: TEST_DATABASE_URL,
  BETTER_AUTH_SECRET: TEST_AUTH_SECRET
}
