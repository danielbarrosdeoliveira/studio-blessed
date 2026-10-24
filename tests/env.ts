/**
 * Configuração compartilhada entre scripts, Vitest e Playwright.
 * O banco de teste é separado do banco de desenvolvimento.
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  ?? 'postgres://studio:studio@localhost:5432/studio_blessed_test'

export const TEST_AUTH_SECRET = 'studio-blessed-test-secret-nao-use-em-producao'

export const TEST_PASSWORD = 'senha123456'

export const TEST_USERS = {
  admin: { email: 'admin@studioblessed.test', name: 'Admin Studio', role: 'admin' as const },
  maria: { email: 'maria@studioblessed.test', name: 'Maria', role: 'partner' as const },
  ana: { email: 'ana@studioblessed.test', name: 'Ana', role: 'partner' as const }
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
