import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
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

const { db, sql } = await import('../server/database')
const { auth } = await import('../server/lib/auth')
const {
  user: userTable,
  service: serviceTable,
  workingHours: workingHoursTable
} = await import('../server/database/schema')

async function createUser(input: { email: string, name: string, role: 'admin' | 'partner' }) {
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

  if (input.role !== 'partner') {
    await db
      .update(userTable)
      .set({ role: input.role })
      .where(eq(userTable.id, result.user.id))
  }

  return { id: result.user.id, email: input.email, name: input.name, role: input.role }
}

try {
  const adminUser = await createUser(TEST_USERS.admin)
  const maria = await createUser(TEST_USERS.maria)
  const ana = await createUser(TEST_USERS.ana)

  const services = await db
    .insert(serviceTable)
    .values([
      {
        professionalId: maria.id,
        name: 'Corte feminino',
        durationMin: 40,
        bufferMin: 10,
        priceCents: 13000
      },
      {
        professionalId: maria.id,
        name: 'Escova',
        durationMin: 30,
        bufferMin: 0,
        priceCents: 8000
      },
      {
        professionalId: ana.id,
        name: 'Corte feminino',
        durationMin: 45,
        bufferMin: 0,
        priceCents: 15000
      },
      {
        professionalId: ana.id,
        name: 'Escova',
        durationMin: 30,
        bufferMin: 0,
        priceCents: 9000
      }
    ])
    .returning({ id: serviceTable.id, name: serviceTable.name, professionalId: serviceTable.professionalId })

  const weekdays = [0, 1, 2, 3, 4, 5, 6]

  await db
    .insert(workingHoursTable)
    .values([maria, ana].flatMap(professional => weekdays.map(weekday => ({
      professionalId: professional.id,
      weekday,
      startMinute: 9 * 60,
      endMinute: 18 * 60
    }))))

  const serviceId = (professionalId: string, name: string) => {
    const found = services.find(row => row.professionalId === professionalId && row.name === name)

    if (!found) {
      throw new Error(`Serviço de teste não encontrado: ${name}`)
    }

    return found.id
  }

  await mkdir('.data', { recursive: true })
  await writeFile('.data/test-seed.json', JSON.stringify({
    users: { admin: adminUser, maria, ana },
    services: {
      mariaCorte: serviceId(maria.id, 'Corte feminino'),
      mariaEscova: serviceId(maria.id, 'Escova'),
      anaCorte: serviceId(ana.id, 'Corte feminino'),
      anaEscova: serviceId(ana.id, 'Escova')
    }
  }, null, 2))

  console.log(`Banco de teste pronto: ${databaseName}`)
  console.log(`Usuários: ${TEST_USERS.admin.email}, ${TEST_USERS.maria.email}, ${TEST_USERS.ana.email}`)
} finally {
  await sql.end()
}
