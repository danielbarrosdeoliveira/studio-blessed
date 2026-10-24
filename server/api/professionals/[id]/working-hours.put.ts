import { asc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '../../../database'
import { workingHours } from '../../../database/schema'
import { getProfessionalOr404, requireProfessionalAccess } from '../../../utils/professionals'

const hourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440)
})

const bodySchema = z.object({
  hours: z.array(hourSchema).max(70)
}).superRefine((value, ctx) => {
  const byWeekday = new Map<number, typeof value.hours>()

  for (const hour of value.hours) {
    const hours = byWeekday.get(hour.weekday) ?? []
    hours.push(hour)
    byWeekday.set(hour.weekday, hours)
  }

  for (const [weekday, hours] of byWeekday) {
    const sorted = [...hours].sort((a, b) => a.startMinute - b.startMinute)

    for (let index = 0; index < sorted.length; index++) {
      const current = sorted[index]!
      const previous = sorted[index - 1]

      if (current.endMinute <= current.startMinute) {
        ctx.addIssue({
          code: 'custom',
          message: `Intervalo inválido no dia ${weekday}: o fim deve ser depois do início`,
          path: ['hours']
        })
      }

      if (previous && current.startMinute < previous.endMinute) {
        ctx.addIssue({
          code: 'custom',
          message: `Intervalos sobrepostos no dia ${weekday}`,
          path: ['hours']
        })
      }
    }
  }
})

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
      message: parsed.error.issues[0]?.message ?? 'Jornada inválida',
      data: z.treeifyError(parsed.error)
    })
  }

  await db.transaction(async (tx) => {
    await tx.delete(workingHours).where(eq(workingHours.professionalId, id))

    if (parsed.data.hours.length) {
      await tx.insert(workingHours).values(
        parsed.data.hours.map(hour => ({
          professionalId: id,
          weekday: hour.weekday,
          startMinute: hour.startMinute,
          endMinute: hour.endMinute
        }))
      )
    }
  })

  return db
    .select()
    .from(workingHours)
    .where(eq(workingHours.professionalId, id))
    .orderBy(asc(workingHours.weekday), asc(workingHours.startMinute))
})
