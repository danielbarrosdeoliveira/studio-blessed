import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { auth } from '../../lib/auth'
import { db } from '../../database'
import { user } from '../../database/schema'
import { professionalColumns } from '../../utils/professionals'
import { writeAuditLog } from '../../utils/audit-log'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(128)
})

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, parsed.data.email))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, message: 'Já existe uma conta com este e-mail' })
  }

  // Cria a conta via Better Auth para manter o hash de senha no formato correto.
  const created = await auth.api.signUpEmail({ body: parsed.data })

  const [professional] = await db
    .select(professionalColumns)
    .from(user)
    .where(eq(user.id, created.user.id))
    .limit(1)

  if (!professional) {
    throw createError({ statusCode: 500, message: 'Não foi possível criar a profissional' })
  }

  await writeAuditLog({
    action: 'user.invite',
    entity: 'user',
    entityId: created.user.id,
    userId: current.id,
    userEmail: current.email,
    metadata: { invitedEmail: parsed.data.email, role: professional.role },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return professional
})
