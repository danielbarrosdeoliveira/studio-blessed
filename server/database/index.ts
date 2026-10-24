import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL não definida. Copie .env.example para .env.')
}

/**
 * Em dev o Nitro recarrega os módulos; reutilizamos a conexão no globalThis
 * para não abrir um pool novo a cada HMR.
 */
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>
}

const sql = globalForDb.__sql ?? postgres(connectionString, { max: 10 })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__sql = sql
}

export const db = drizzle(sql, { schema })
export { sql }
