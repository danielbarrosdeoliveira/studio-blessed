import { and, eq, ne } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { service } from '../../database/schema'
import { isUniqueViolation, requireServiceAccess, sameServiceName, serviceColumns } from '../../utils/services'
import { writeAuditLog } from '../../utils/audit-log'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo').optional(),
  durationMin: z.number().int().min(5, 'Duração mínima de 5 min').max(600, 'Duração máxima de 600 min').optional(),
  bufferMin: z.number().int().min(0).max(240).optional(),
  priceCents: z.number().int().min(0, 'Preço inválido').max(10_000_000).optional(),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Serviço não informado' })
  }

  const { current, existing } = await requireServiceAccess(event, id)

  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const nextName = parsed.data.name ?? existing.name
  const nextActive = parsed.data.active ?? existing.active

  if (nextActive) {
    const [duplicate] = await db
      .select({ id: service.id })
      .from(service)
      .where(and(
        eq(service.active, true),
        sameServiceName(nextName),
        ne(service.id, id)
      ))
      .limit(1)

    if (duplicate) {
      throw createError({ statusCode: 409, message: 'Já existe um serviço ativo com este nome no salão' })
    }
  }

  const rows = await db
    .update(service)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(service.id, id))
    // @ts-ignore - Drizzle returning type issue
    .returning(serviceColumns)
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw createError({ statusCode: 409, message: 'Já existe um serviço ativo com este nome no salão' })
      }
      throw error
    })

  const [updated] = rows

  await writeAuditLog({
    action: 'service.update',
    entity: 'service',
    entityId: id,
    userId: current.id,
    userEmail: current.email,
    metadata: { changes: parsed.data },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return updated
})
