import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { client } from '../../../database/schema'
import { writeAuditLog } from '../../../utils/audit-log'
import { requireUser } from '../../../utils/auth-guard'

const clientColumns = {
  id: client.id,
  name: client.name,
  phone: client.phone,
  blocked: client.blocked,
  createdAt: client.createdAt
}

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('block') }),
  z.object({ action: z.literal('unblock') })
])

/** Bloqueia ou desbloqueia uma cliente. Bloqueio não apaga o histórico. */
export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Cliente não informada' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const [existing] = await db.select(clientColumns).from(client).where(eq(client.id, id)).limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Cliente não encontrada' })
  }

  const blocked = parsed.data.action === 'block'

  const [updated] = await db
    .update(client)
    .set({ blocked, updatedAt: new Date() })
    .where(eq(client.id, id))
    // @ts-expect-error - Drizzle returning type issue
    .returning(clientColumns)

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Não foi possível atualizar a cliente' })
  }

  await writeAuditLog({
    action: blocked ? 'client.block' : 'client.unblock',
    entity: 'client',
    entityId: id,
    userId: current.id,
    userEmail: current.email,
    metadata: { name: existing.name, phone: existing.phone },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return updated
})
