import { readFileSync } from 'node:fs'

export interface SeedUser {
  id: string
  email: string
  name: string
}

export interface SeedState {
  users: {
    owner: SeedUser
  }
  services: {
    corte: string
    escova: string
  }
}

/** Lido após `pnpm test:db:setup`. */
export function readSeedState(): SeedState {
  return JSON.parse(
    readFileSync(new URL('../../.data/test-seed.json', import.meta.url), 'utf8')
  ) as SeedState
}
