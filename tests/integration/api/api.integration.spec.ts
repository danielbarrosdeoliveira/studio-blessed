import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import type {
  Professional,
  PublicAppointmentResponse,
  PublicAppointmentsResponse,
  PublicAvailability,
  PublicServiceGroup,
  Service,
  StaffAgendaResponse,
  StaffAppointmentResponse,
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
  professionalId?: string
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
  it('lista o catálogo ativo agrupado por serviço', async () => {
    const groups = await $fetch<PublicServiceGroup[]>('/api/public/services')
    const corte = groups.find(group => group.name === 'Corte feminino')

    expect(corte).toBeDefined()
    expect(corte?.professionals).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: seed.users.maria.id, name: 'Maria' }),
      expect.objectContaining({ id: seed.users.ana.id, name: 'Ana' })
    ]))
  })

  it('aplica a antecedência de 3 dias somente no fluxo da cliente', async () => {
    const query = {
      professionalId: seed.users.maria.id,
      serviceId: seed.services.mariaCorte
    }

    const available = await $fetch<PublicAvailability>('/api/public/availability', {
      query: { ...query, date: addDays(todayIso(), 4) }
    })
    const tooSoon = await $fetch<PublicAvailability>('/api/public/availability', {
      query: { ...query, date: addDays(todayIso(), 1) }
    })

    expect(available.slots.length).toBeGreaterThan(0)
    expect(tooSoon.slots).toHaveLength(0)
  })

  it('cria, consulta, bloqueia duplicata e cancela pelo WhatsApp', async () => {
    const date = addDays(todayIso(), 5)
    const startsAt = instantAt(date, '09:00')
    const phone = '11999990010'
    const body = {
      professionalId: seed.users.maria.id,
      serviceId: seed.services.mariaCorte,
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
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
        date
      }
    })

    expect(reopened.slots.some(slot => slot.startsAt === startsAt)).toBe(true)
  })
})

describe('API da agenda do staff', () => {
  it('protege a agenda e aplica o escopo de cada papel', async () => {
    const date = addDays(todayIso(), 6)
    const admin = await getSession(TEST_USERS.admin.email)

    const unauthenticated = await $fetch('/api/appointments', {
      query: { date }
    }).catch(error => error)

    expect(errorStatus(unauthenticated)).toBe(401)

    const professionals = await $fetch<Professional[]>('/api/professionals', {
      headers: authHeaders(admin.cookie)
    })
    const maria = professionals.find(item => item.id === seed.users.maria.id)!
    const services = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(admin.cookie),
      query: { professionalId: maria.id, active: 'true' }
    })
    const corte = services.find(item => item.name === 'Corte feminino')!

    const appointment = await createStaffAppointment(admin.cookie, {
      professionalId: maria.id,
      serviceId: corte.id,
      startsAt: instantAt(date, '10:00'),
      clientName: 'Cliente Staff',
      clientPhone: '11999990020',
      notes: 'Teste de integração'
    })

    expect(appointment.appointment.origin).toBe('staff')
    expect(appointment.appointment.notes).toBe('Teste de integração')

    const agenda = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(admin.cookie),
      query: { date, professionalId: maria.id }
    })

    expect(agenda.appointments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: appointment.appointment.id, professionalName: 'Maria' })
    ]))

    const duplicated = await createStaffAppointment(admin.cookie, {
      professionalId: maria.id,
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
        headers: authHeaders(admin.cookie),
        body: { action: 'status', status: 'completed' }
      }
    )

    expect(completed.appointment.status).toBe('completed')

    const corrected = await $fetch<StaffAppointmentResponse>(
      `/api/appointments/${appointment.appointment.id}`,
      {
        method: 'PATCH',
        headers: authHeaders(admin.cookie),
        body: { action: 'status', status: 'no_show' }
      }
    )

    expect(corrected.appointment.status).toBe('no_show')

    const cancelFinished = await $fetch(`/api/appointments/${appointment.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { action: 'cancel' }
    }).catch(error => error)

    expect(errorStatus(cancelFinished)).toBe(409)

    const ana = professionals.find(item => item.id === seed.users.ana.id)!
    const anaAppointment = await createStaffAppointment(admin.cookie, {
      professionalId: ana.id,
      serviceId: seed.services.anaCorte,
      startsAt: instantAt(date, '11:00'),
      clientName: 'Cliente da Ana',
      clientPhone: '11999990021'
    })

    const partner = await getSession(TEST_USERS.maria.email)

    const crossProfessionalRead = await $fetch('/api/appointments', {
      headers: authHeaders(partner.cookie),
      query: { date, professionalId: ana.id }
    }).catch(error => error)

    expect(errorStatus(crossProfessionalRead)).toBe(403)

    const crossProfessionalWrite = await $fetch(`/api/appointments/${anaAppointment.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(partner.cookie),
      body: { action: 'cancel' }
    }).catch(error => error)

    expect(errorStatus(crossProfessionalWrite)).toBe(403)

    const partnerCorrection = await $fetch(`/api/appointments/${appointment.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(partner.cookie),
      body: { action: 'status', status: 'completed' }
    }).catch(error => error)

    expect(errorStatus(partnerCorrection)).toBe(409)

    const ownAgenda = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(partner.cookie),
      query: { date }
    })

    expect(ownAgenda.professionalId).toBe(maria.id)
    expect(ownAgenda.appointments.every(item => item.professionalId === maria.id)).toBe(true)
    expect(ownAgenda.appointments.some(item => item.id === anaAppointment.appointment.id)).toBe(false)
  })
})

describe('validações da API', () => {
  it('valida os parâmetros da disponibilidade pública', async () => {
    const missing = await $fetch('/api/public/availability').catch(error => error)
    const missingService = await $fetch('/api/public/availability', {
      query: { professionalId: seed.users.maria.id }
    }).catch(error => error)
    const invalidDate = await $fetch('/api/public/availability', {
      query: {
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
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
      professionalId: seed.users.maria.id,
      serviceId: seed.services.mariaCorte,
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
      body: { ...base, serviceId: seed.services.anaCorte }
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
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
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
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
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
    const admin = await getSession(TEST_USERS.admin.email)
    const phone = '11999990034'
    const appointment = await createStaffAppointment(admin.cookie, {
      professionalId: seed.users.maria.id,
      serviceId: seed.services.mariaCorte,
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
    const admin = await getSession(TEST_USERS.admin.email)
    const date = addDays(todayIso(), 10)
    const base = {
      serviceId: seed.services.mariaCorte,
      startsAt: instantAt(date, '09:00'),
      clientName: 'Cliente Staff Inválida',
      clientPhone: '11999990035'
    }

    const missingProfessional = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: base
    }).catch(error => error)
    const unknownProfessional = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: { ...base, professionalId: '00000000-0000-0000-0000-000000000000' }
    }).catch(error => error)
    const invalidPhone = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: { ...base, professionalId: seed.users.maria.id, clientPhone: '123' }
    }).catch(error => error)
    const wrongService = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: {
        ...base,
        professionalId: seed.users.maria.id,
        serviceId: seed.services.anaCorte
      }
    }).catch(error => error)

    expect(errorStatus(missingProfessional)).toBe(400)
    expect(errorStatus(unknownProfessional)).toBe(404)
    expect(errorStatus(invalidPhone)).toBe(400)
    expect(errorStatus(wrongService)).toBe(404)

    const created = await createStaffAppointment(admin.cookie, {
      ...base,
      professionalId: seed.users.maria.id,
      startsAt: instantAt(date, '10:00')
    })

    const invalidBody = await $fetch(`/api/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { action: 'status', status: 'invalid' }
    }).catch(error => error)
    const notFound = await $fetch('/api/appointments/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { action: 'cancel' }
    }).catch(error => error)
    const sameStatus = await $fetch(`/api/appointments/${created.appointment.id}`, {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { action: 'status', status: 'scheduled' }
    }).catch(error => error)

    expect(errorStatus(invalidBody)).toBe(400)
    expect(errorStatus(notFound)).toBe(404)
    expect(errorStatus(sameStatus)).toBe(400)
  })

  it('impede a profissional de criar para outra e valida filtros da agenda', async () => {
    const partner = await getSession(TEST_USERS.maria.email)
    const date = addDays(todayIso(), 11)

    const crossProfessional = await $fetch('/api/appointments', {
      method: 'POST',
      headers: authHeaders(partner.cookie),
      body: {
        professionalId: seed.users.ana.id,
        serviceId: seed.services.anaCorte,
        startsAt: instantAt(date, '09:00'),
        clientName: 'Cliente Bloqueada',
        clientPhone: '11999990036'
      }
    }).catch(error => error)
    const invalidDate = await $fetch('/api/appointments', {
      headers: authHeaders(partner.cookie),
      query: { date: '2026-02-30' }
    }).catch(error => error)
    const ownFilter = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(partner.cookie),
      query: { date, professionalId: seed.users.maria.id }
    })
    const admin = await getSession(TEST_USERS.admin.email)
    const adminAll = await $fetch<StaffAgendaResponse>('/api/appointments', {
      headers: authHeaders(admin.cookie),
      query: { date }
    })

    expect(errorStatus(crossProfessional)).toBe(403)
    expect(errorStatus(invalidDate)).toBe(400)
    expect(ownFilter.professionalId).toBe(seed.users.maria.id)
    expect(adminAll.professionalId).toBeNull()
  })
})

describe('gestão de profissionais e serviços', () => {
  it('lê e atualiza a profissional e consulta a agenda interna', async () => {
    const admin = await getSession(TEST_USERS.admin.email)
    const maria = await getSession(TEST_USERS.maria.email)
    const professional = await $fetch<Professional>(
      `/api/professionals/${seed.users.maria.id}`,
      { headers: authHeaders(admin.cookie) }
    )
    const ownProfessional = await $fetch<Professional>(
      `/api/professionals/${seed.users.maria.id}`,
      { headers: authHeaders(maria.cookie) }
    )
    const otherProfessional = await $fetch(
      `/api/professionals/${seed.users.ana.id}`,
      { headers: authHeaders(maria.cookie) }
    ).catch(error => error)
    const hours = await $fetch<WorkingHour[]>(
      `/api/professionals/${seed.users.maria.id}/working-hours`,
      { headers: authHeaders(admin.cookie) }
    )
    const availability = await $fetch<PublicAvailability>('/api/availability', {
      headers: authHeaders(admin.cookie),
      query: {
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
        date: todayIso()
      }
    })
    const unauthenticated = await $fetch('/api/availability', {
      query: {
        professionalId: seed.users.maria.id,
        serviceId: seed.services.mariaCorte,
        date: todayIso()
      }
    }).catch(error => error)

    expect(professional.name).toBe('Maria')
    expect(ownProfessional.id).toBe(seed.users.maria.id)
    expect(errorStatus(otherProfessional)).toBe(403)
    expect(hours).toHaveLength(7)
    expect(availability.origin).toBe('staff')
    expect(errorStatus(unauthenticated)).toBe(401)

    const renamed = await $fetch<Professional>(
      `/api/professionals/${seed.users.maria.id}`,
      {
        method: 'PATCH',
        headers: authHeaders(admin.cookie),
        body: { name: 'Maria Integração' }
      }
    )
    const invalidName = await $fetch(`/api/professionals/${seed.users.maria.id}`, {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { name: 'A' }
    }).catch(error => error)
    const crossRename = await $fetch(`/api/professionals/${seed.users.ana.id}`, {
      method: 'PATCH',
      headers: authHeaders(maria.cookie),
      body: { name: 'Ana Bloqueada' }
    }).catch(error => error)

    expect(renamed.name).toBe('Maria Integração')
    expect(errorStatus(invalidName)).toBe(400)
    expect(errorStatus(crossRename)).toBe(403)
  })

  it('cria e atualiza serviços com escopo de acesso', async () => {
    const admin = await getSession(TEST_USERS.admin.email)
    const maria = await getSession(TEST_USERS.maria.email)
    const base = {
      name: 'Serviço Integração',
      durationMin: 30,
      bufferMin: 0,
      priceCents: 1000,
      active: true
    }

    const created = await $fetch<Service>('/api/services', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: { ...base, professionalId: seed.users.maria.id }
    })
    const duplicate = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: { ...base, professionalId: seed.users.maria.id }
    }).catch(error => error)
    const missingProfessional = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: base
    }).catch(error => error)
    const invalidDuration = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(admin.cookie),
      body: { ...base, professionalId: seed.users.maria.id, durationMin: 1 }
    }).catch(error => error)
    const partnerCreated = await $fetch<Service>('/api/services', {
      method: 'POST',
      headers: authHeaders(maria.cookie),
      body: { ...base, name: 'Serviço da Maria' }
    })
    const partnerCross = await $fetch('/api/services', {
      method: 'POST',
      headers: authHeaders(maria.cookie),
      body: { ...base, name: 'Serviço da Ana', professionalId: seed.users.ana.id }
    }).catch(error => error)

    expect(created.professionalId).toBe(seed.users.maria.id)
    expect(created.bufferMin).toBe(0)
    expect(errorStatus(duplicate)).toBe(409)
    expect(errorStatus(missingProfessional)).toBe(400)
    expect(errorStatus(invalidDuration)).toBe(400)
    expect(partnerCreated.professionalId).toBe(seed.users.maria.id)
    expect(errorStatus(partnerCross)).toBe(403)

    const patched = await $fetch<Service>(`/api/services/${created.id}`, {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { priceCents: 2000 }
    })
    const duplicateName = await $fetch(`/api/services/${partnerCreated.id}`, {
      method: 'PATCH',
      headers: authHeaders(maria.cookie),
      body: { name: 'Serviço Integração' }
    }).catch(error => error)
    const partnerOther = await $fetch(`/api/services/${seed.services.anaCorte}`, {
      method: 'PATCH',
      headers: authHeaders(maria.cookie),
      body: { active: false }
    }).catch(error => error)
    const notFound = await $fetch('/api/services/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: authHeaders(admin.cookie),
      body: { active: false }
    }).catch(error => error)
    const partnerList = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(maria.cookie)
    })
    const adminList = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(admin.cookie)
    })
    const activeList = await $fetch<Service[]>('/api/services', {
      headers: authHeaders(admin.cookie),
      query: { active: 'true' }
    })

    expect(patched.priceCents).toBe(2000)
    expect(errorStatus(duplicateName)).toBe(409)
    expect(errorStatus(partnerOther)).toBe(403)
    expect(errorStatus(notFound)).toBe(404)
    expect(partnerList.every(service => service.professionalId === seed.users.maria.id)).toBe(true)
    expect(adminList.length).toBeGreaterThan(partnerList.length)
    expect(activeList.every(service => service.active)).toBe(true)
  })

  it('valida e salva a jornada de trabalho', async () => {
    const admin = await getSession(TEST_USERS.admin.email)
    const maria = await getSession(TEST_USERS.maria.email)
    const route = `/api/professionals/${seed.users.maria.id}/working-hours`

    const overlapping = await $fetch(route, {
      method: 'PUT',
      headers: authHeaders(admin.cookie),
      body: {
        hours: [
          { weekday: 1, startMinute: 540, endMinute: 600 },
          { weekday: 1, startMinute: 570, endMinute: 660 }
        ]
      }
    }).catch(error => error)
    const inverted = await $fetch(route, {
      method: 'PUT',
      headers: authHeaders(admin.cookie),
      body: { hours: [{ weekday: 1, startMinute: 600, endMinute: 540 }] }
    }).catch(error => error)
    const crossSave = await $fetch(`/api/professionals/${seed.users.ana.id}/working-hours`, {
      method: 'PUT',
      headers: authHeaders(maria.cookie),
      body: { hours: [] }
    }).catch(error => error)
    const saved = await $fetch<WorkingHour[]>(route, {
      method: 'PUT',
      headers: authHeaders(admin.cookie),
      body: { hours: [{ weekday: 0, startMinute: 540, endMinute: 600 }] }
    })
    const read = await $fetch<WorkingHour[]>(route, {
      headers: authHeaders(admin.cookie)
    })

    expect(errorStatus(overlapping)).toBe(400)
    expect(errorStatus(inverted)).toBe(400)
    expect(errorStatus(crossSave)).toBe(403)
    expect(saved).toHaveLength(1)
    expect(read).toHaveLength(1)
  })
})
