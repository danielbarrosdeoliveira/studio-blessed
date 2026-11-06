import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import {
  INTEGRATION_BASE_URL,
  TEST_AUTH_SECRET,
  TEST_DATABASE_URL,
  TEST_PASSWORD,
  TEST_USERS
} from '../tests/env'

process.env.DATABASE_URL = TEST_DATABASE_URL
process.env.BETTER_AUTH_SECRET = TEST_AUTH_SECRET
process.env.BETTER_AUTH_URL = INTEGRATION_BASE_URL

const databaseName = new URL(TEST_DATABASE_URL).pathname.slice(1)

if (!/^[a-z0-9_]+$/.test(databaseName)) {
  throw new Error(`Nome de banco de teste inválido: ${databaseName}`)
}

const adminUrl = new URL(TEST_DATABASE_URL)
adminUrl.pathname = '/postgres'

const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} })

try {
  const [existing] = await admin<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${databaseName}) AS exists
  `

  if (!existing?.exists) {
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`)
  }
} finally {
  await admin.end()
}

const reset = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })

try {
  await reset.unsafe('DROP SCHEMA IF EXISTS public CASCADE')
  await reset.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await reset.unsafe('CREATE SCHEMA public')
} finally {
  await reset.end()
}

const migrationSql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} })

try {
  await migrate(drizzle(migrationSql), {
    migrationsFolder: 'server/database/migrations'
  })
} finally {
  await migrationSql.end()
}

const { db } = await import('../server/database')
const { auth } = await import('../server/lib/auth')
const { service: serviceTable, workingHours: workingHoursTable } =
  await import('../server/database/schema')

async function createUser(input: { email: string; name: string }) {
  const result = await auth.api.signUpEmail({
    body: {
      email: input.email,
      name: input.name,
      password: TEST_PASSWORD
    }
  })

  if (!result.user) {
    throw new Error(`Não foi possível criar o usuário de teste ${input.email}`)
  }

  return { id: result.user.id, email: input.email, name: input.name }
}

try {
  const owner = await createUser(TEST_USERS.owner)

  const services = await db
    .insert(serviceTable)
    .values([
      {
        name: 'Corte feminino',
        durationMin: 40,
        bufferMin: 10,
        priceCents: 13000
      },
      {
        name: 'Escova',
        durationMin: 30,
        bufferMin: 0,
        priceCents: 8000
      }
    ])
    .returning({ id: serviceTable.id, name: serviceTable.name })

  const weekdays = [0, 1, 2, 3, 4, 5, 6]

  await db.insert(workingHoursTable).values(
    weekdays.map((weekday) => ({
      weekday,
      startMinute: 9 * 60,
      endMinute: 18 * 60
    }))
  )

  const serviceId = (name: string) => {
    const found = services.find((row) => row.name === name)

    if (!found) {
      throw new Error(`Serviço de teste não encontrado: ${name}`)
    }

    return found.id
  }

  await mkdir('.data', { recursive: true })
  await writeFile(
    '.data/test-seed.json',
    JSON.stringify(
      {
        users: { owner },
        services: {
          corte: serviceId('Corte feminino'),
          escova: serviceId('Escova')
        }
      },
      null,
      2
    )
  )

  console.log(`Banco de teste pronto: ${databaseName}`)
  console.log(`Usuário (dona): ${TEST_USERS.owner.email}`)
} finally {
  // Fecha o pool do driver `node-postgres` (em produção o driver é o Neon HTTP).
  const client = (db as unknown as { $client?: { end: () => Promise<void> } }).$client
  await client?.end()
}
