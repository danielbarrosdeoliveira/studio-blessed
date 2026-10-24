import { readFileSync } from 'node:fs'

export interface SeedUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'partner'
}

export interface SeedState {
  users: {
    admin: SeedUser
    maria: SeedUser
    ana: SeedUser
  }
  services: {
    mariaCorte: string
    mariaEscova: string
    anaCorte: string
    anaEscova: string
  }
}

/** Lido após `pnpm test:db:setup`. */
export function readSeedState(): SeedState {
  return JSON.parse(
    readFileSync(new URL('../../.data/test-seed.json', import.meta.url), 'utf8')
  ) as SeedState
}
