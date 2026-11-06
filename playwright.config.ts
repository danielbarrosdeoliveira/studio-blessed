import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { E2E_BASE_URL, E2E_PORT, TEST_AUTH_SECRET, TEST_DATABASE_URL } from './tests/env'

const coverageEnabled = process.env.E2E_COVERAGE === 'true'

/**
 * O E2E roda sempre contra o **build de produção** (`.output/server`).
 *
 * No `nuxt dev`, o otimizador de dependências do Vite re-otimiza pacotes
 * durante a navegação e dispara um *full reload* no meio do teste, o que
 * desmonta dropdowns abertos e deixa o E2E instável. O build de produção
 * elimina HMR e mede o que realmente é publicado.
 */
const serverCommand = 'exec node .output/server/index.mjs'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  outputDir: 'test-results',
  reporter: [['list']],
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `pnpm test:db:setup && ${serverCommand}`,
    url: E2E_BASE_URL,
    timeout: 240_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_URL: E2E_BASE_URL,
      BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
      NUXT_TELEMETRY_DISABLED: '1',
      PORT: String(E2E_PORT),
      HOST: '127.0.0.1',
      ...(coverageEnabled
        ? {
            NODE_V8_COVERAGE: resolve(process.cwd(), '.coverage/e2e/server')
          }
        : {})
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
