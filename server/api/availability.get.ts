import * as z from 'zod'
import { getAvailabilityForDay } from '../utils/availability'
import { requireUser } from '../utils/auth-guard'
import { isValidDate } from '../utils/time'

const querySchema = z.object({
  serviceId: z.string().min(1, 'Serviço não informado'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(isValidDate, 'Data inválida'),
  bookingType: z.enum(['application', 'maintenance']).optional()
})

/** Disponibilidade para o staff: hoje/amanhã e encaixes, sem os 3 dias da cliente. */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return getAvailabilityForDay({
    serviceId: parsed.data.serviceId,
    date: parsed.data.date,
    origin: 'staff',
    bookingType: parsed.data.bookingType
  })
})
