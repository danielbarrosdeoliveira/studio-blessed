import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'
import {
  INTEGRATION_BASE_URL,
  TEST_AUTH_SECRET,
  TEST_DATABASE_URL
} from './tests/env.ts'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/node_modules/**',
        '**/.nuxt/**',
        '**/.output/**'
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 75
      }
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.unit.spec.ts'],
          exclude: ['node_modules/**', '.nuxt/**', '.output/**', 'tests/e2e/**']
        }
      },
      {
        test: {
          name: 'integration-api',
          environment: 'node',
          include: ['tests/integration/api/**/*.integration.spec.ts'],
          testTimeout: 180_000,
          hookTimeout: 180_000,
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
            BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
            BETTER_AUTH_URL: INTEGRATION_BASE_URL
          }
        }
      },
      await defineVitestProject({
        test: {
          name: 'integration-nuxt',
          include: ['tests/integration/components/**/*.integration.spec.ts'],
          testTimeout: 30_000,
          hookTimeout: 30_000
        }
      })
    ]
  }
})
