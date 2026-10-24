import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../database'
import { user } from '../../database/schema'
import { professionalColumns, requireProfessionalAccess } from '../../utils/professionals'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120, 'Nome muito longo')
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)

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
    .returning(professionalColumns)

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Profissional não encontrada' })
  }

  return updated
})
