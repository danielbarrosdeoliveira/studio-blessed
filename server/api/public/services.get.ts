import { asc, eq } from 'drizzle-orm'
import { db } from '../../database'
import { service, user } from '../../database/schema'

interface PublicGroup {
  name: string
  minPriceCents: number
  professionals: {
    id: string
    name: string
    durationMin: number
    bufferMin: number
    priceCents: number
  }[]
}

/**
 * Catálogo público (sem autenticação).
 * Agrega serviços ativos pelo nome: mesmo nome em profissionais diferentes
 * vira uma única entrada, com o preço de cada profissional.
 */
export default defineEventHandler(async () => {
  const rows = await db
    .select({
      name: service.name,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin,
      priceCents: service.priceCents,
      professionalId: service.professionalId,
      professionalName: user.name
    })
    .from(service)
    .innerJoin(user, eq(service.professionalId, user.id))
    .where(eq(service.active, true))
    .orderBy(asc(service.name), asc(user.name))

  const groups = new Map<string, PublicGroup>()

  for (const row of rows) {
    const key = row.name.trim().toLowerCase()
    const group = groups.get(key) ?? {
      name: row.name.trim(),
      minPriceCents: row.priceCents,
      professionals: []
    }

    group.minPriceCents = Math.min(group.minPriceCents, row.priceCents)
    group.professionals.push({
      id: row.professionalId,
      name: row.professionalName,
      durationMin: row.durationMin,
      bufferMin: row.bufferMin,
      priceCents: row.priceCents
    })

    groups.set(key, group)
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})
