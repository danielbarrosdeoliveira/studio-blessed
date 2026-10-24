import * as z from 'zod'
import { getAvailabilityForDay } from '../utils/availability'
import { requireProfessionalAccess } from '../utils/professionals'
import { isValidDate } from '../utils/time'

const querySchema = z.object({
  professionalId: z.string().min(1, 'Profissional não informada'),
  serviceId: z.string().min(1, 'Serviço não informado'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(isValidDate, 'Data inválida')
})

/** Disponibilidade para o staff: hoje/amanhã e encaixes, sem os 3 dias da cliente. */
export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  await requireProfessionalAccess(event, parsed.data.professionalId)

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return getAvailabilityForDay({
    ...parsed.data,
    origin: 'staff'
  })
})
