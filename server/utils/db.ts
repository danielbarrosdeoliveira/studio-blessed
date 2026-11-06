import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../database/schema'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL não definida. Copie .env.example para .env.')
}

/**
 * Driver híbrido para Drizzle ORM.
 *
 * A escolha é feita pelo **esquema da URL**, nunca por `NODE_ENV`:
 * um build de produção apontado para um PostgreSQL local (builds de teste,
 * self-hosting) precisa continuar usando o driver TCP.
 *
 * - `postgres://` / `postgresql://`: `drizzle-orm/node-postgres` com `pg` (Pool).
 * - `https://`: `drizzle-orm/neon-http` com o driver HTTP/serverless do Neon.
 *
 * `DB_DRIVER=neon|pg` força o driver explicitamente.
 */

type DatabaseDriver = 'neon' | 'pg'

const forcedDriver = process.env.DB_DRIVER?.toLowerCase()
const driver: DatabaseDriver =
  forcedDriver === 'neon' || forcedDriver === 'pg'
    ? forcedDriver
    : connectionString.startsWith('https://')
      ? 'neon'
      : 'pg'

const db: NodePgDatabase<typeof schema> | ReturnType<typeof drizzleNeon> =
  driver === 'neon'
    ? drizzleNeon(neon(connectionString), { schema })
    : drizzlePg(new Pool({ connectionString, max: 10 }), { schema })

export { db }
