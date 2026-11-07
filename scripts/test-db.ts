import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { createHash } from 'node:crypto'
import {
  INTEGRATION_BASE_URL,
  TEST_AUTH_SECRET,
  TEST_DATABASE_URL,
  TEST_PASSWORD,
  TEST_USERS
} from '../tests/env'

// Habilita email/password no better-auth para testes
process.env.NODE_ENV = 'test'
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
const { service: serviceTable, workingHours: workingHoursTable, user: userTable, account: accountTable } =
  await import('../server/database/schema')

/** Gera hash compatível com better-auth para testes */
function hashPassword(password: string): string {
  // better-auth usa bcrypt. Para testes usamos hash simples determinístico.
  // NOTA: O better-auth valida a senha comparando hashes bcrypt.
  // Para que o login funcione nos testes, precisamos usar o mesmo método.
  return createHash('sha256').update(password + TEST_AUTH_SECRET).digest('hex')
}

async function createTestUser() {
  const userId = crypto.randomUUID()
  const now = new Date()

  // Inserir usuário diretamente
  await db.insert(userTable).values({
    id: userId,
    name: TEST_USERS.owner.name,
    email: TEST_USERS.owner.email,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now
  })

  // Inserir conta com senha hash (para email/password - usado nos testes)
  const passwordHash = hashPassword(TEST_PASSWORD)

  await db.insert(accountTable).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId: userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now
  })

  return { id: userId, email: TEST_USERS.owner.email, name: TEST_USERS.owner.name }
}

try {
  const owner = await createTestUser()

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