import { db } from '../../database'
import { appointment, service, user } from '../../database/schema'
import { eq, and, gte, lte, count, sum, desc } from 'drizzle-orm'
import { requireUser } from '../../utils/auth-guard'
import { writeAuditLog } from '../../utils/audit-log'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)

  const { period = 'month', from, to } = getQuery(event)

  const isAdmin = current.role === 'admin'

  const now = new Date()
  const dateFrom = from ? new Date(from as string) : new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const dateTo = to ? new Date(to as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const baseWhere = and(
    gte(appointment.startsAt, dateFrom),
    lte(appointment.startsAt, dateTo),
    isAdmin ? undefined : eq(appointment.professionalId, current.id)
  )

  const revenueResult = await db
    .select({
      total: sum(service.priceCents).mapWith(Number)
    })
    .from(appointment)
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(baseWhere, eq(appointment.status, 'completed')))

  const completedCountResult = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(baseWhere, eq(appointment.status, 'completed')))

  const noShowCountResult = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(baseWhere, eq(appointment.status, 'no_show')))

  const cancelledCountResult = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(baseWhere, eq(appointment.status, 'cancelled')))

  const serviceRanking = await db
    .select({
      serviceName: service.name,
      total: count().mapWith(Number),
      revenue: sum(service.priceCents).mapWith(Number)
    })
    .from(appointment)
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(baseWhere, eq(appointment.status, 'completed')))
    .groupBy(service.id, service.name)
    .orderBy(desc(count()))

  let revenueByProfessional: any[] = []
  if (isAdmin) {
    revenueByProfessional = await db
      .select({
        professionalId: user.id,
        professionalName: user.name,
        professionalEmail: user.email,
        total: sum(service.priceCents).mapWith(Number),
        count: count()
      })
      .from(appointment)
      .innerJoin(service, eq(appointment.serviceId, service.id))
      .innerJoin(user, eq(appointment.professionalId, user.id))
      .where(and(baseWhere, eq(appointment.status, 'completed')))
      .groupBy(user.id, user.name, user.email)
      .orderBy(desc(sum(service.priceCents)))
  }

  await writeAuditLog({
    action: 'appointment.complete',
    entity: 'metrics',
    userId: current.id,
    userEmail: current.email,
    metadata: { period, from: dateFrom.toISOString(), to: dateTo.toISOString() },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return {
    period,
    from: dateFrom.toISOString(),
    to: dateTo.toISOString(),
    revenue: revenueResult[0]?.total ?? 0,
    completedCount: completedCountResult[0]?.count ?? 0,
    noShowCount: noShowCountResult[0]?.count ?? 0,
    cancelledCount: cancelledCountResult[0]?.count ?? 0,
    serviceRanking,
    revenueByProfessional
  }
})
