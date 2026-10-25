import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { user } from '../../database/schema'
import { professionalColumns, requireProfessionalAccess } from '../../utils/professionals'
import { requireUser } from '../../utils/auth-guard'
import { writeAuditLog } from '../../utils/audit-log'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo')
})

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)

  const [existing] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Profissional não encontrada' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const [updated] = await db
    .update(user)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(user.id, id))
    // @ts-ignore - Drizzle returning type issue
    .returning(professionalColumns)

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Profissional não encontrada' })
  }

  await writeAuditLog({
    action: 'user.role_change',
    entity: 'user',
    entityId: id,
    userId: current.id,
    userEmail: current.email,
    metadata: { targetEmail: existing.email, changes: { name: parsed.data.name } },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return updated
})
