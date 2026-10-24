import { and, asc, eq, gt, lt } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../../database'
import { appointment, client, service, timeBlock } from '../../../../database/schema'
import { getProfessionalOr404, requireProfessionalAccess } from '../../../../utils/professionals'
import { localDateOf } from '../../../../utils/time'
import { findBlockConflicts, serializeTimeBlock } from '../../../../utils/time-blocks'

function isMinutePrecision(value: Date) {
  return value.getSeconds() === 0 && value.getMilliseconds() === 0
}

const bodySchema = z.object({
  startsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Início inválido'),
  endsAt: z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Fim inválido'),
  reason: z.string().trim().max(200, 'Motivo muito longo').optional(),
  recurrence: z.literal('weekly').nullable().optional(),
  confirmConflict: z.boolean().default(false)
}).superRefine((value, ctx) => {
  const startsAt = new Date(value.startsAt)
  const endsAt = new Date(value.endsAt)

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return
  }

  if (!isMinutePrecision(startsAt) || !isMinutePrecision(endsAt)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Use horários com precisão de minutos',
      path: ['startsAt']
    })
  }

  if (endsAt <= startsAt) {
    ctx.addIssue({
      code: 'custom',
      message: 'O fim deve ser depois do início',
      path: ['endsAt']
    })
  }

  if (value.recurrence === 'weekly' && localDateOf(startsAt) !== localDateOf(endsAt)) {
    ctx.addIssue({
      code: 'custom',
      message: 'O bloqueio semanal deve começar e terminar no mesmo dia',
      path: ['endsAt']
    })
  }
})

/** Cria um bloqueio pontual ou semanal para a profissional. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Profissional não informada' })
  }

  await requireProfessionalAccess(event, id)
  await getProfessionalOr404(id)

  const parsed = bodySchema.safeParse(await readBody(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
      data: z.treeifyError(parsed.error)
    })
  }

  const startsAt = new Date(parsed.data.startsAt)
  const endsAt = new Date(parsed.data.endsAt)
  const recurrence = parsed.data.recurrence ?? null

  const conditions = [
    eq(appointment.professionalId, id),
    eq(appointment.status, 'scheduled'),
    gt(appointment.endsAt, startsAt)
  ]

  if (recurrence !== 'weekly') {
    conditions.push(lt(appointment.startsAt, endsAt))
  }

  const appointments = await db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      clientName: client.name,
      serviceName: service.name
    })
    .from(appointment)
    .innerJoin(client, eq(appointment.clientId, client.id))
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(...conditions))
    .orderBy(asc(appointment.startsAt))

  const conflicts = findBlockConflicts(
    { startsAt, endsAt, recurrence },
    appointments
  )

  if (conflicts.length && !parsed.data.confirmConflict) {
    throw createError({
      statusCode: 409,
      message: 'Existe agendamento neste período. Confirme para salvar o bloqueio sem cancelar o agendamento.',
      data: { conflicts }
    })
  }

  const [created] = await db
    .insert(timeBlock)
    .values({
      professionalId: id,
      startsAt,
      endsAt,
      reason: parsed.data.reason || null,
      recurrence
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, message: 'Não foi possível salvar o bloqueio' })
  }

  setResponseStatus(event, 201)

  return {
    block: serializeTimeBlock(created),
    conflicts
  }
})
