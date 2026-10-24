import * as z from 'zod'
import { getAvailabilityForDay } from '../../utils/availability'
import { isValidDate } from '../../utils/time'

const querySchema = z.object({
  professionalId: z.string().min(1, 'Profissional não informada'),
  serviceId: z.string().min(1, 'Serviço não informado'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(isValidDate, 'Data inválida')
})

/** Disponibilidade pública (cliente): aplica a antecedência mínima de 3 dias. */
export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  return getAvailabilityForDay({
    ...parsed.data,
    origin: 'client'
  })
})
