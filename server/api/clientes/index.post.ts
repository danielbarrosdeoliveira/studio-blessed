import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { client } from '../../database/schema'
import { normalizePhone } from '../../utils/phone'
import { requireUser } from '../../utils/auth-guard'
import { writeAuditLog } from '../../utils/audit-log'

const clientColumns = {
  id: client.id,
  name: client.name,
  phone: client.phone,
  createdAt: client.createdAt
}

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo'),
  phone: z.string().trim().min(10, 'Informe o WhatsApp').max(20)
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

  const phone = normalizePhone(parsed.data.phone)

  if (!phone) {
    throw createError({ statusCode: 400, message: 'WhatsApp inválido' })
  }

  const [existing] = await db
    .select({ id: client.id })
    .from(client)
    .where(eq(client.phone, phone))
    .limit(1)

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Já existe uma cliente cadastrada com este WhatsApp'
    })
  }

  const rows = await db
    .insert(client)
    .values({
      name: parsed.data.name,
      phone
    })
    // @ts-expect-error - Drizzle returning type issue
    .returning(clientColumns)
    .catch((error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === '23505'
      ) {
        throw createError({
          statusCode: 409,
          message: 'Já existe uma cliente cadastrada com este WhatsApp'
        })
      }
      throw error
    })

  const [created] = rows

  if (!created) {
    throw createError({ statusCode: 500, message: 'Não foi possível cadastrar a cliente' })
  }

  await writeAuditLog({
    action: 'client.create',
    entity: 'client',
    entityId: created.id,
    userId: current.id,
    userEmail: current.email,
    metadata: { name: parsed.data.name, phone },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return created
})
