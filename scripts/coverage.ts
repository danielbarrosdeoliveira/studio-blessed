import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Metas de cobertura do MVP.
 * A esteira de DevOps passa a bloquear o deploy quando ela existir;
 * localmente os mesmos comandos já falham se a meta não for atingida.
 */
const THRESHOLD = 75
const E2E_THRESHOLD = 50

/** Lógica pura coberta por testes unitários. */
const UNIT_INCLUDES = [
  'app/utils/appointment.ts',
  'app/utils/date.ts',
  'app/utils/error.ts',
  'app/utils/phone.ts',
  'server/utils/appointment-actions.ts',
  'server/utils/appointment-serialization.ts',
  'server/utils/availability-engine.ts',
  'server/utils/phone.ts',
  'server/utils/time.ts',
  'server/utils/time-blocks.ts'
]

/** Componentes com testes de integração de UI. */
const INTEGRATION_NUXT_INCLUDES = [
  'app/components/AvailabilityPicker.vue',
  'app/components/StaffAppointmentCard.vue'
]

const root = process.cwd()

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function vitestCoverage(project: string, includes: string[], reportsDirectory: string) {
  run('pnpm', [
    'exec',
    'vitest',
    'run',
    '--project',
    project,
    '--coverage',
    ...includes.map(file => `--coverage.include=${file}`),
    `--coverage.reportsDirectory=${reportsDirectory}`
  ])
}

function coverageUnit() {
  vitestCoverage('unit', UNIT_INCLUDES, 'coverage/unit')
}

function coverageIntegrationNuxt() {
  vitestCoverage('integration-nuxt', INTEGRATION_NUXT_INCLUDES, 'coverage/integration-nuxt')
}

function coverageE2E() {
  const tempDirectory = resolve(root, '.coverage/e2e/server')
  const reportsDirectory = resolve(root, 'coverage/e2e')

  rmSync(tempDirectory, { recursive: true, force: true })
  mkdirSync(tempDirectory, { recursive: true })

  run('pnpm', ['build'], { NUXT_E2E_COVERAGE: 'true' })
  run('pnpm', ['test:db:setup'])
  run('pnpm', ['exec', 'playwright', 'test'], { E2E_COVERAGE: 'true' })

  run('pnpm', [
    'exec',
    'c8',
    'report',
    `--temp-directory=${tempDirectory}`,
    `--reports-dir=${reportsDirectory}`,
    '--reporter=text',
    '--reporter=json',
    '--reporter=json-summary',
    '--exclude-after-remap',
    '--include=app/**',
    '--include=server/**',
    '--exclude=**/*.spec.ts',
    '--exclude=**/*.test.ts',
    '--check-coverage',
    // Cobertura de linhas/statements/funções pelos fluxos críticos.
    // Branches ficam visíveis no relatório, mas são aprofundadas em unit/integration.
    `--lines=${E2E_THRESHOLD}`,
    `--statements=${E2E_THRESHOLD}`,
    `--functions=${E2E_THRESHOLD}`
  ])
}

function coverageIntegrationApi() {
  const tempDirectory = resolve(root, '.coverage/integration-api/tmp')
  const reportsDirectory = resolve(root, 'coverage/integration-api')

  rmSync(tempDirectory, { recursive: true, force: true })
  mkdirSync(tempDirectory, { recursive: true })

  run('pnpm', ['test:db:setup'])
  run('pnpm', ['exec', 'vitest', 'run', '--project', 'integration-api'], {
    NODE_V8_COVERAGE: tempDirectory
  })

  run('pnpm', [
    'exec',
    'c8',
    'report',
    `--temp-directory=${tempDirectory}`,
    `--reports-dir=${reportsDirectory}`,
    '--reporter=text',
    '--reporter=json',
    '--reporter=json-summary',
    '--exclude-after-remap',
    '--include=server/**',
    '--exclude=**/*.spec.ts',
    '--check-coverage',
    `--lines=${THRESHOLD}`,
    `--statements=${THRESHOLD}`,
    `--functions=${THRESHOLD}`,
    `--branches=${THRESHOLD}`
  ])
}

const command = process.argv[2]

switch (command) {
  case 'unit':
    coverageUnit()
    break
  case 'integration-api':
    coverageIntegrationApi()
    break
  case 'integration-nuxt':
    coverageIntegrationNuxt()
    break
  case 'e2e':
    coverageE2E()
    break
  case 'integration':
    coverageIntegrationApi()
    coverageIntegrationNuxt()
    break
  case 'all':
    coverageUnit()
    coverageIntegrationApi()
    coverageIntegrationNuxt()
    coverageE2E()
    break
  default:
    console.error('Uso: tsx scripts/coverage.ts <unit|integration-api|integration-nuxt|e2e|integration|all>')
    process.exit(1)
}
