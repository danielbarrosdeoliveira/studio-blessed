import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import type {
  PublicAppointmentResponse,
  PublicAppointmentsResponse,
  PublicAvailability,
  Service,
  StaffAgendaResponse,
  StaffAppointmentResponse,
  TimeBlock,
  TimeBlockResponse,
  WorkingHour
} from '../../../app/types/domain'
import {
  INTEGRATION_BASE_URL,
  INTEGRATION_PORT,
  TEST_AUTH_SECRET,
  TEST_DATABASE_URL,
  TEST_USERS
} from '../../env'
import { authHeaders, errorStatus, signIn } from '../../helpers/api'
import { addDays, instantAt, todayIso } from '../../helpers/date'
import { readSeedState } from '../../helpers/seed'

await setup({
  server: true,
  build: true,
  port: INTEGRATION_PORT,
  setupTimeout: 240_000,
  nuxtConfig: {
    nitro: {
      // Necessário para o c8 mapear o bundle do servidor de volta para `server/**`.
      sourceMap: true
    }
  },
  env: {
    DATABASE_URL: TEST_DATABASE_URL,
    BETTER_AUTH_URL: INTEGRATION_BASE_URL,
    BETTER_AUTH_SECRET: TEST_AUTH_SECRET
  }
})

const seed = readSeedState()

const sessions = new Map<string, Awaited<ReturnType<typeof signIn>>>()

/** Reaproveita a sessão para não estourar o rate limit de login do Better Auth. */
async function getSession(email: string) {
  const cached = sessions.get(email)

  if (cached) {
    return cached
  }

  const session = await signIn(email)
  sessions.set(email, session)

  return session
}

function createStaffAppointment(cookie: string, body: {
  serviceId: string
  startsAt: string
  clientName: string
  clientPhone: string
  notes?: string
}) {
  return $fetch<StaffAppointmentResponse>('/api/appointments', {
    method: 'POST',
    headers: authHeaders(cookie),
    body
  })
}

describe('API pública de agendamento', () => {
  it('lista o catálogo ativo do salão', async () => {
    const services = await $fetch<Service[]>('/api/public/services')

    expect(services.map(service => service.name)).toEqual(
      expect.arrayContaining(['Corte feminino', 'Escova'])
    )
    expect(services.every(service => !('professionalId' in service))).toBe(true)
  })

  it('aplica a antecedência de 3 dias somente no fluxo da cliente', async () => {
    const available = await $fetch<PublicAvailability>('/api/public/availability', {
      query: { serviceId: seed.services.corte, date: addDays(todayIso(), 4) }
    })
    // O 3º dia é o limite: o primeiro horário do dia já está liberado.
    const boundary = await $fetch<PublicAvailability>('/api/public/availability', {
      query: { serviceId: seed.services.corte, date: addDays(todayIso(), 3) }
    })
    const tooSoon = await $fetch<PublicAvailability>('/api/public/availability', {
      query: { serviceId: seed.services.corte, date: addDays(todayIso(), 1) }
    })

    expect(available.slots.length).toBeGreaterThan(0)
    expect(boundary.slots.length).toBeGreaterThan(0)
    expect(boundary.slots.some(slot => slot.label === '09:00')).toBe(true)
    expect(tooSoon.slots).toHaveLength(0)
  })

  it('cria, consulta, bloqueia duplicata e cancela pelo WhatsApp', async () => {
    const date = addDays(todayIso(), 5)
    const startsAt = instantAt(date, '09:00')
    const phone = '11999990010'
    const body = {
      serviceId: seed.services.corte,
      startsAt,
      clientName: 'Cliente Integração',
      clientPhone: phone
    }

    const created = await $fetch<PublicAppointmentResponse>('/api/public/appointments', {
      method: 'POST',
      body
    })

    expect(created.appointment.status).toBe('scheduled')
    expect(created.appointment.origin).toBe('client')

    const duplicated = await $fetch('/api/public/appointments', {
      method: 'POST',
      body
    }).catch(error => error)

    expect(errorStatus(duplicated)).toBe(409)

    const history = await $fetch<PublicAppointmentsResponse>('/api/public/appointments', {
      query: { phone }
    })

    expect(history.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: created.appointment.id, serviceName: 'Corte feminino' })
    ]))

    const wrongPhone = await $fetch(`/api/public/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'cancel', phone: '11999990011' }
    }).catch(error => error)

    expect(errorStatus(wrongPhone)).toBe(403)

    const cancelled = await $fetch<PublicAppointmentResponse>(
      `/api/public/appointments/${created.appointment.id}`,
      { method: 'PATCH', body: { action: 'cancel', phone } }
    )

    expect(cancelled.appointment.status).toBe('cancelled')

    const cancelAgain = await $fetch(`/api/public/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'cancel', phone }
    }).catch(error => error)

    expect(errorStatus(cancelAgain)).toBe(409)

    const reopened = await $fetch<PublicAvailability>('/api/public/availability', {
      query: {
        serviceId: seed.services.corte,
        date
      }
    })

    expect(reopened.slots.some(slot => slot.startsAt === startsAt)).toBe(true)
  })
})

describe('API da agenda do staff', () => {
  it('protege a agenda e gerencia todos os agendamentos da dona', async () => {
    const date = addDays(todayIso(), 6)
    const owner = await getSession(TEST_USERS.owner.email)

    const unauthenticated = await $fetch('/api/appointments', {
      query: { date }
    }).catch(error => error)

    expect(errorStatus(unauthenticated)).toBe(401)

    const services = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(owner.cookie),
      query: { active: 'true' }
    })
    const corte = services.find(item => item.name === 'Corte feminino')!

    const appointment = await createStaffAppointment(owner.cookie, {
      serviceId: corte.id,
      startsAt: instantAt(date, '10:00'),
      clientName: 'Cliente Staff',
      clientPhone: '11999990020',
      notes: 'Teste de integração'
    })

    expect(appointment.appointment.origin).toBe('staff')
    expect(appointment.appointment.notes).toBe('Teste de integração')
    expect(appointment.appointment.clientPhone).toBe('11999990020')

    const agenda = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(owner.cookie),
      query: { date }
    })

    expect(agenda.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: appointment.appointment.id, serviceName: 'Corte feminino' })
    ]))

    const duplicated = await createStaffAppointment(owner.cookie, {
      serviceId: corte.id,
      startsAt: instantAt(date, '10:00'),
      clientName: 'Outra Cliente',
      clientPhone: '11999990022'
    }).catch(error => error)

    expect(errorStatus(duplicated)).toBe(409)

    const completed = await $fetch<StaffAppointmentResponse>(
      `/api/appointments/${appointment.appointment.id}`,
      {
        method: 'PATCH',
        headers: authHeaders(owner.cookie),
        body: { action: 'status', status: 'completed' }
      }
    )

    expect(completed.appointment.status).toBe('completed')

    const corrected = await $fetch<StaffAppointmentResponse>(
      `/api/appointments/${appointment.appointment.id}`,
      {
        method: 'PATCH',
        headers: authHeaders(owner.cookie),
        body: { action: 'status', status: 'no_show' }
      }
    )

    expect(corrected.appointment.status).toBe('no_show')

    const cancelFinished = await $fetch(`/api/appointments/${appointment.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { action: 'cancel' }
    }).catch(error => error)

    expect(errorStatus(cancelFinished)).toBe(409)

    const second = await createStaffAppointment(owner.cookie, {
      serviceId: seed.services.escova,
      startsAt: instantAt(date, '11:00'),
      clientName: 'Cliente da Casa',
      clientPhone: '11999990021'
    })

    const agendaAfter = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(owner.cookie),
      query: { date }
    })

    expect(agendaAfter.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: second.appointment.id })
    ]))
  })
})

describe('validações da API', () => {
  it('valida os parâmetros da disponibilidade pública', async () => {
    const missing = await $fetch('/api/public/availability').catch(error => error)
    const missingService = await $fetch('/api/public/availability', {
      query: { date: todayIso() }
    }).catch(error => error)
    const invalidDate = await $fetch('/api/public/availability', {
      query: {
        serviceId: seed.services.corte,
        date: '2026-02-30'
      }
    }).catch(error => error)

    expect(errorStatus(missing)).toBe(400)
    expect(errorStatus(missingService)).toBe(400)
    expect(errorStatus(invalidDate)).toBe(400)
  })

  it('valida o WhatsApp do histórico público', async () => {
    const missing = await $fetch('/api/public/appointments').catch(error => error)
    const invalid = await $fetch('/api/public/appointments', {
      query: { phone: '123' }
    }).catch(error => error)

    expect(errorStatus(missing)).toBe(400)
    expect(errorStatus(invalid)).toBe(400)
  })

  it('rejeita criação pública inválida, serviço divergente e antecedência curta', async () => {
    const base = {
      serviceId: seed.services.corte,
      startsAt: instantAt(addDays(todayIso(), 9), '09:00'),
      clientName: 'Cliente Inválida',
      clientPhone: '11999990030'
    }

    const invalidBody = await $fetch('/api/public/appointments', {
      method: 'POST',
      body: {}
    }).catch(error => error)
    const invalidPhone = await $fetch('/api/public/appointments', {
      method: 'POST',
      body: { ...base, clientPhone: '123' }
    }).catch(error => error)
    const wrongService = await $fetch('/api/public/appointments', {
      method: 'POST',
      body: { ...base, serviceId: '00000000-0000-0000-0000-000000000000' }
    }).catch(error => error)
    const tooSoon = await $fetch('/api/public/appointments', {
      method: 'POST',
      body: {
        ...base,
        startsAt: instantAt(addDays(todayIso(), 1), '09:00'),
        clientPhone: '11999990031'
      }
    }).catch(error => error)

    expect(errorStatus(invalidBody)).toBe(400)
    expect(errorStatus(invalidPhone)).toBe(400)
    expect(errorStatus(wrongService)).toBe(404)
    expect(errorStatus(tooSoon)).toBe(409)
  })

  it('remarca pelo WhatsApp e bloqueia conflito de horário', async () => {
    const date = addDays(todayIso(), 8)
    const phone = '11999990032'
    const created = await $fetch<PublicAppointmentResponse>('/api/public/appointments', {
      method: 'POST',
      body: {
        serviceId: seed.services.corte,
        startsAt: instantAt(date, '09:00'),
        clientName: 'Cliente Remarcação',
        clientPhone: phone
      }
    })

    const newStartsAt = instantAt(date, '10:00')
    const rescheduled = await $fetch<PublicAppointmentResponse>(
      `/api/public/appointments/${created.appointment.id}`,
      {
        method: 'PATCH',
        body: { action: 'reschedule', phone, startsAt: newStartsAt }
      }
    )

    expect(rescheduled.appointment.startsAt).toBe(newStartsAt)

    await $fetch('/api/public/appointments', {
      method: 'POST',
      body: {
        serviceId: seed.services.corte,
        startsAt: instantAt(date, '11:00'),
        clientName: 'Cliente Conflito',
        clientPhone: '11999990033'
      }
    })

    const conflict = await $fetch(`/api/public/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'reschedule', phone, startsAt: instantAt(date, '11:00') }
    }).catch(error => error)

    expect(errorStatus(conflict)).toBe(409)
  })

  it('bloqueia alteração pública dentro das 24h', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const phone = '11999990034'
    const appointment = await createStaffAppointment(owner.cookie, {
      serviceId: seed.services.corte,
      startsAt: instantAt(addDays(todayIso(), 1), '09:00'),
      clientName: 'Cliente 24h',
      clientPhone: phone
    })

    const tooLate = await $fetch(`/api/public/appointments/${appointment.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'cancel', phone }
    }).catch(error => error)

    expect(errorStatus(tooLate)).toBe(409)
  })

  it('valida criação e atualização pelo staff', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const date = addDays(todayIso(), 10)
    const base = {
      serviceId: seed.services.corte,
      startsAt: instantAt(date, '09:00'),
      clientName: 'Cliente Staff Inválida',
      clientPhone: '11999990035'
    }

    const invalidBody = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {}
    }).catch(error => error)
    const invalidPhone = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { ...base, clientPhone: '123' }
    }).catch(error => error)
    const wrongService = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { ...base, serviceId: '00000000-0000-0000-0000-000000000000' }
    }).catch(error => error)

    expect(errorStatus(invalidBody)).toBe(400)
    expect(errorStatus(invalidPhone)).toBe(400)
    expect(errorStatus(wrongService)).toBe(404)

    const created = await createStaffAppointment(owner.cookie, {
      ...base,
      startsAt: instantAt(date, '10:00')
    })

    const invalidBodyPatch = await $fetch(`/api/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { action: 'status', status: 'invalid' }
    }).catch(error => error)
    const notFound = await $fetch('/api/appointments/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { action: 'cancel' }
    }).catch(error => error)
    const sameStatus = await $fetch(`/api/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { action: 'status', status: 'scheduled' }
    }).catch(error => error)

    expect(errorStatus(invalidBodyPatch)).toBe(400)
    expect(errorStatus(notFound)).toBe(404)
    expect(errorStatus(sameStatus)).toBe(400)
  })

  it('valida o filtro de data da agenda', async () => {
    const owner = await getSession(TEST_USERS.owner.email)

    const invalidDate = await $fetch('/api/appointments', {
      headers: authHeaders(owner.cookie),
      query: { date: '2026-02-30' }
    }).catch(error => error)

    expect(errorStatus(invalidDate)).toBe(400)
  })
})

describe('gestão de serviços', () => {
  it('cria e atualiza serviços do salão', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const base = {
      name: 'Serviço Integração',
      durationMin: 30,
      bufferMin: 0,
      priceCents: 1000,
      active: true
    }

    const created = await $fetch<Service>('/api/services', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: base
    })
    const duplicate = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: base
    }).catch(error => error)
    const duplicateCase = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { ...base, name: 'serviço integração' }
    }).catch(error => error)
    const inactiveDuplicate = await $fetch<Service>('/api/services', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { ...base, name: 'Serviço Integração', active: false }
    })
    const invalidDuration = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { ...base, durationMin: 1 }
    }).catch(error => error)
    const unauthenticated = await $fetch('/api/services', {
      method: 'POST',
      body: base
    }).catch(error => error)

    expect(created.bufferMin).toBe(0)
    expect(errorStatus(duplicate)).toBe(409)
    expect(errorStatus(duplicateCase)).toBe(409)
    expect(inactiveDuplicate.active).toBe(false)
    expect(errorStatus(invalidDuration)).toBe(400)
    expect(errorStatus(unauthenticated)).toBe(401)

    const patched = await $fetch<Service>(`/api/services/${created.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { priceCents: 2000 }
    })
    const duplicateName = await $fetch(`/api/services/${created.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { name: 'corte feminino' }
    }).catch(error => error)
    const reactivateDuplicate = await $fetch(`/api/services/${inactiveDuplicate.id}`, {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { active: true }
    }).catch(error => error)
    const notFound = await $fetch('/api/services/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: authHeaders(owner.cookie),
      body: { active: false }
    }).catch(error => error)
    const list = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(owner.cookie)
    })
    const activeList = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(owner.cookie),
      query: { active: 'true' }
    })

    expect(patched.priceCents).toBe(2000)
    expect(errorStatus(duplicateName)).toBe(409)
    expect(errorStatus(reactivateDuplicate)).toBe(409)
    expect(errorStatus(notFound)).toBe(404)
    expect(list.length).toBeGreaterThan(activeList.length)
    expect(activeList.every(service => service.active)).toBe(true)
  })
})

describe('bloqueios de horário', () => {
  it('cria bloqueio pontual, lista e devolve o horário ao remover', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const date = addDays(todayIso(), 20)
    const query = {
      serviceId: seed.services.escova,
      date
    }
    const startsAt = instantAt(date, '12:00')
    const endsAt = instantAt(date, '13:00')

    const before = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query
    })

    const created = await $fetch<TimeBlockResponse>('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { startsAt, endsAt, reason: 'Almoço' }
    })

    expect(created.block.recurrence).toBeNull()
    expect(created.conflicts).toEqual([])

    const after = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query
    })

    expect(before.slots.some(slot => slot.startsAt === startsAt)).toBe(true)
    expect(after.slots.some(slot => slot.startsAt === startsAt)).toBe(false)
    expect(after.slots.some(slot => slot.startsAt === instantAt(date, '11:00'))).toBe(true)

    const list = await $fetch<TimeBlock[]>('/api/time-blocks', {
      headers: authHeaders(owner.cookie)
    })

    expect(list).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: created.block.id, reason: 'Almoço' })
    ]))

    const removed = await $fetch<{ id: string }>(`/api/time-blocks/${created.block.id}`, {
      method: 'DELETE',
      headers: authHeaders(owner.cookie)
    })
    const reopened = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query
    })

    expect(removed.id).toBe(created.block.id)
    expect(reopened.slots.some(slot => slot.startsAt === startsAt)).toBe(true)
  })

  it('aplica bloqueio semanal em todas as ocorrências e valida recorrência', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const date = addDays(todayIso(), 30)
    const nextWeek = addDays(date, 7)
    const previousWeek = addDays(date, -7)
    const otherDay = addDays(date, 1)
    const startsAt = instantAt(date, '12:00')
    const endsAt = instantAt(date, '13:00')

    const created = await $fetch<TimeBlockResponse>('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: { startsAt, endsAt, reason: 'Almoço semanal', recurrence: 'weekly' }
    })

    expect(created.block.recurrence).toBe('weekly')

    const sameWeek = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query: { serviceId: seed.services.escova, date }
    })
    const followingWeek = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query: { serviceId: seed.services.escova, date: nextWeek }
    })
    const otherWeekday = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query: { serviceId: seed.services.escova, date: otherDay }
    })
    const beforeStart = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(owner.cookie),
      query: { serviceId: seed.services.escova, date: previousWeek }
    })

    expect(sameWeek.slots.some(slot => slot.startsAt === startsAt)).toBe(false)
    expect(followingWeek.slots.some(slot => slot.startsAt === instantAt(nextWeek, '12:00'))).toBe(false)
    expect(otherWeekday.slots.some(slot => slot.startsAt === instantAt(otherDay, '12:00'))).toBe(true)
    expect(beforeStart.slots.some(slot => slot.startsAt === instantAt(previousWeek, '12:00'))).toBe(true)

    const crossDay = await $fetch('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(date, '23:00'),
        endsAt: instantAt(addDays(date, 1), '01:00'),
        recurrence: 'weekly'
      }
    }).catch(error => error)
    const invalidRecurrence = await $fetch('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(addDays(date, 2), '12:00'),
        endsAt: instantAt(addDays(date, 2), '13:00'),
        recurrence: 'daily'
      }
    }).catch(error => error)
    const inverted = await $fetch('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(addDays(date, 3), '13:00'),
        endsAt: instantAt(addDays(date, 3), '12:00')
      }
    }).catch(error => error)

    expect(errorStatus(crossDay)).toBe(400)
    expect(errorStatus(invalidRecurrence)).toBe(400)
    expect(errorStatus(inverted)).toBe(400)
  })

  it('avisa sobre agendamento existente sem cancelá-lo', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const date = addDays(todayIso(), 40)
    const appointment = await createStaffAppointment(owner.cookie, {
      serviceId: seed.services.escova,
      startsAt: instantAt(date, '10:00'),
      clientName: 'Cliente Bloqueio',
      clientPhone: '11999990040'
    })

    const conflict = await $fetch('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(date, '09:45'),
        endsAt: instantAt(date, '10:15'),
        reason: 'Compromisso'
      }
    }).catch(error => error)

    expect(errorStatus(conflict)).toBe(409)

    const payload = (conflict as {
      data?: {
        conflicts?: Array<{ id: string, clientName: string }>
        data?: { conflicts?: Array<{ id: string, clientName: string }> }
      }
    }).data
    const conflicts = payload?.data?.conflicts ?? payload?.conflicts

    expect(conflicts).toEqual([
      expect.objectContaining({
        id: appointment.appointment.id,
        clientName: 'Cliente Bloqueio'
      })
    ])

    const beforeConfirmation = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(owner.cookie),
      query: { date }
    })

    expect(beforeConfirmation.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: appointment.appointment.id,
        status: 'scheduled'
      })
    ]))

    const confirmed = await $fetch<TimeBlockResponse>('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(date, '09:45'),
        endsAt: instantAt(date, '10:15'),
        reason: 'Compromisso',
        confirmConflict: true
      }
    })

    const afterConfirmation = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(owner.cookie),
      query: { date }
    })

    expect(confirmed.conflicts).toHaveLength(1)
    expect(afterConfirmation.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: appointment.appointment.id,
        status: 'scheduled'
      })
    ]))
  })

  it('exige autenticação e valida a remoção do bloqueio', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const date = addDays(todayIso(), 50)

    const unauthenticated = await $fetch('/api/time-blocks').catch(error => error)
    const unauthenticatedCreate = await $fetch('/api/time-blocks', {
      method: 'POST',
      body: {
        startsAt: instantAt(date, '15:00'),
        endsAt: instantAt(date, '16:00')
      }
    }).catch(error => error)

    expect(errorStatus(unauthenticated)).toBe(401)
    expect(errorStatus(unauthenticatedCreate)).toBe(401)

    const block = await $fetch<TimeBlockResponse>('/api/time-blocks', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: {
        startsAt: instantAt(date, '15:00'),
        endsAt: instantAt(date, '16:00')
      }
    })

    const notFound = await $fetch('/api/time-blocks/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
      headers: authHeaders(owner.cookie)
    }).catch(error => error)

    expect(errorStatus(notFound)).toBe(404)

    const removed = await $fetch<{ id: string }>(`/api/time-blocks/${block.block.id}`, {
      method: 'DELETE',
      headers: authHeaders(owner.cookie)
    })

    expect(removed.id).toBe(block.block.id)
  })
})

describe('jornada de trabalho', () => {
  it('valida e salva a jornada da dona do salão', async () => {
    const owner = await getSession(TEST_USERS.owner.email)
    const route = '/api/working-hours'

    const unauthenticated = await $fetch(route).catch(error => error)
    const overlapping = await $fetch(route, {
      method: 'PUT',
      headers: authHeaders(owner.cookie),
      body: {
        hours: [
          { weekday: 1, startMinute: 540, endMinute: 600 },
          { weekday: 1, startMinute: 570, endMinute: 660 }
        ]
      }
    }).catch(error => error)
    const inverted = await $fetch(route, {
      method: 'PUT',
      headers: authHeaders(owner.cookie),
      body: { hours: [{ weekday: 1, startMinute: 600, endMinute: 540 }] }
    }).catch(error => error)

    expect(errorStatus(unauthenticated)).toBe(401)
    expect(errorStatus(overlapping)).toBe(400)
    expect(errorStatus(inverted)).toBe(400)

    const saved = await $fetch<WorkingHour[]>(route, {
      method: 'PUT',
      headers: authHeaders(owner.cookie),
      body: { hours: [{ weekday: 0, startMinute: 540, endMinute: 600 }] }
    })
    const read = await $fetch<WorkingHour[]>(route, {
      headers: authHeaders(owner.cookie)
    })

    expect(saved).toHaveLength(1)
    expect(read).toHaveLength(1)

    // Restaura a jornada padrão usada pelos demais testes.
    await $fetch<WorkingHour[]>(route, {
      method: 'PUT',
      headers: authHeaders(owner.cookie),
      body: {
        hours: [0, 1, 2, 3, 4, 5, 6].map(weekday => ({
          weekday,
          startMinute: 540,
          endMinute: 1080
        }))
      }
    })
  })
})
