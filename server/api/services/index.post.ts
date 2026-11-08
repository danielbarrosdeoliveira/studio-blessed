import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { service } from '../../database/schema'
import { requireUser } from '../../utils/auth-guard'
import { isUniqueViolation, sameServiceName, serviceColumns } from '../../utils/services'
import { writeAuditLog } from '../../utils/audit-log'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo'),
  durationMin: z
    .number()
    .int()
    .min(5, 'Duração mínima de 5 min')
    .max(600, 'Duração máxima de 600 min'),
  bufferMin: z.number().int().min(0).max(240).default(0),
  priceCents: z.number().int().min(0, 'Preço inválido').max(10_000_000).default(0),
  active: z.boolean().default(true),
  hasMaintenance: z.boolean().default(false),
  maintenancePriceCents: z
    .number()
    .int()
    .min(0, 'Preço inválido')
    .max(10_000_000)
    .optional()
    .nullable(),
  maintenanceDurationMin: z
    .number()
    .int()
    .min(5, 'Duração mínima de 5 min')
    .max(600, 'Duração máxima de 600 min')
    .optional()
    .nullable()
})

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  if (parsed.data.active) {
    const [duplicate] = await db
      .select({ id: service.id })
      .from(service)
      .where(and(eq(service.active, true), sameServiceName(parsed.data.name)))
      .limit(1)

    if (duplicate) {
      throw createError({
        statusCode: 409,
        message: 'Já existe um serviço ativo com este nome no salão'
      })
    }
  }

  const rows = await db
    .insert(service)
    .values({
      name: parsed.data.name,
      durationMin: parsed.data.durationMin,
      bufferMin: parsed.data.bufferMin,
      priceCents: parsed.data.priceCents,
      active: parsed.data.active,
      hasMaintenance: parsed.data.hasMaintenance,
      maintenancePriceCents: parsed.data.hasMaintenance ? parsed.data.maintenancePriceCents : null,
      maintenanceDurationMin: parsed.data.hasMaintenance ? parsed.data.maintenanceDurationMin : null
    })
    // @ts-expect-error - Drizzle returning type issue
    .returning(serviceColumns)
    .catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw createError({
          statusCode: 409,
          message: 'Já existe um serviço ativo com este nome no salão'
        })
      }
      throw error
    })

  const [created] = rows

  if (!created) {
    throw createError({ statusCode: 500, message: 'Não foi possível criar o serviço' })
  }

  await writeAuditLog({
    action: 'service.create',
    entity: 'service',
    entityId: created.id,
    userId: current.id,
    userEmail: current.email,
    metadata: { name: parsed.data.name },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return created
})
