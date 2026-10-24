import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import {
  E2E_BASE_URL,
  E2E_PORT,
  TEST_AUTH_SECRET,
  TEST_DATABASE_URL
} from './tests/env'

const coverageEnabled = process.env.E2E_COVERAGE === 'true'
const serverCommand = coverageEnabled
  ? 'exec node .output/server/index.mjs'
  : `pnpm exec nuxt dev --port ${E2E_PORT} --host 127.0.0.1`

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
    command: coverageEnabled ? serverCommand : `pnpm test:db:setup && ${serverCommand}`,
    url: E2E_BASE_URL,
    timeout: 240_000,
    reuseExistingServer: false,
    gracefulShutdown: coverageEnabled
      ? { signal: 'SIGTERM', timeout: 10_000 }
      : undefined,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_URL: E2E_BASE_URL,
      BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
      NUXT_TELEMETRY_DISABLED: '1',
      ...(coverageEnabled
        ? {
            PORT: String(E2E_PORT),
            HOST: '127.0.0.1',
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
