import { drizzle } from 'drizzle-orm'
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
 * - Desenvolvimento (localhost / Docker): usa `drizzle-orm/node-postgres`
 *   com o driver tradicional `pg` (Pool).
 * - Produção (Neon): usa `drizzle-orm/neon-http` com o driver HTTP/serverless
 *   do `@neondatabase/serverless`.
 *
 * A variável DATABASE_URL é a referência única para ambos os ambientes.
 */

let db: NodePgDatabase<typeof schema> | ReturnType<typeof drizzleNeon>

if (process.env.NODE_ENV === 'production' || connectionString.includes('neon.tech')) {
  // Produção: Neon serverless via HTTP
  const sql = neon(connectionString)
  db = drizzleNeon(sql, { schema })
} else {
  // Desenvolvimento: PostgreSQL local via Docker com node-postgres
  const pool = new Pool({ connectionString, max: 10 })
  db = drizzlePg(pool, { schema })
}

export { db }
