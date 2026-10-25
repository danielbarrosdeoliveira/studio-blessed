import { db } from '../../database'
import { appointment, service, user } from '../../database/schema'
import { eq, and, gte, lte, sql, count, sum, desc } from 'drizzle-orm'
import { writeAuditLog } from '../../utils/audit-log'

export default defineEventHandler(async (event) => {
  const { data: session } = await auth.api.getSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const { period = 'month', from, to } = getQuery(event)

  // Admin vê tudo, partner vê apenas o próprio
  const isAdmin = session.user.role === 'admin'
  const professionalFilter = isAdmin ? {} : { professionalId: session.user.id }

  // Período padrão: último mês
  const now = new Date()
  const dateFrom = from ? new Date(from as string) : new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const dateTo = to ? new Date(to as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const where = and(
    gte(appointment.startsAt, dateFrom),
    lte(appointment.startsAt, dateTo),
    isAdmin ? undefined : eq(appointment.professionalId, session.user.id)
  )

  // Faturamento (apenas completed)
  const revenueResult = await db
    .select({
      total: sum(appointment.priceCents).mapWith(Number),
      count: count()
    })
    .from(appointment)
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(where, eq(appointment.status, 'completed')))

  // Total atendimentos (completed)
  const completedCount = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(where, eq(appointment.status, 'completed')))

  // No-show
  const noShowCount = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(where, eq(appointment.status, 'no_show')))

  // Cancelados
  const cancelledCount = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(where, eq(appointment.status, 'cancelled')))

  // Ranking de serviços
  const serviceRanking = await db
    .select({
      serviceName: service.name,
      servicePrice: service.priceCents,
      total: count().mapWith(Number),
      revenue: sum(service.priceCents).mapWith(Number)
    })
    .from(appointment)
    .innerJoin(service, eq(appointment.serviceId, service.id))
    .where(and(where, eq(appointment.status, 'completed')))
    .groupBy(service.id, service.name, service.priceCents)
    .orderBy(desc(count()))

  // Faturamento por profissional (apenas admin)
  let revenueByProfessional: any[] = []
  if (isAdmin) {
    revenueByProfessional = await db
      .select({
        professionalId: user.id,
        professionalName: user.name,
        professionalEmail: user.email,
        total: sum(appointment.priceCents).mapWith(Number),
        count: count()
      })
      .from(appointment)
      .innerJoin(service, eq(appointment.serviceId, service.id))
      .innerJoin(user, eq(appointment.professionalId, user.id))
      .where(and(where, eq(appointment.status, 'completed')))
      .groupBy(user.id, user.name, user.email)
      .orderBy(desc(sum(appointment.priceCents)))
  }

  // Registra auditoria
  await writeAuditLog({
    action: 'appointment.complete',
    entity: 'metrics',
    userId: session.user.id,
    userEmail: session.user.email,
    metadata: { period, from: dateFrom.toISOString(), to: dateTo.toISOString() },
    ipAddress: event.node.req.socket?.remoteAddress,
    userAgent: event.node.req.headers['user-agent']
  })

  return {
    period,
    from: dateFrom.toISOString(),
    to: dateTo.toISOString(),
    revenue: revenueResult[0]?.total ?? 0,
    completedCount: completedCount[0]?.count ?? 0,
    noShowCount: noShowCount[0]?.count ?? 0,
    cancelledCount: cancelledCount[0]?.count ?? 0,
    serviceRanking,
    revenueByProfessional
  }
})
