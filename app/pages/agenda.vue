<script setup lang="ts">
import type {
  Professional,
  Service,
  StaffAgendaResponse,
  StaffAppointmentResponse
} from '~/types/domain'
import { CalendarDate } from '@internationalized/date'
import {
  formatIsoDateLong,
  isoDateOfInstant,
  todayInTimeZone
} from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { normalizePhoneDigits } from '~/utils/phone'

useHead({
  title: 'Agenda · Studio Blessed'
})

const { user, isAdmin } = await useUserSession()
const toast = useToast()

const today = todayInTimeZone()
const date = ref(today)

const calendarDate = computed<CalendarDate | undefined>({
  get: () => {
    const parts = date.value.split('-')
    return new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]))
  },
  set: (value: CalendarDate | undefined) => {
    date.value = value
      ? `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
      : todayInTimeZone()
  }
})

const professionalFilter = ref('all')

const { data: professionals } = await useFetch<Professional[]>('/api/professionals', {
  immediate: isAdmin.value,
  default: () => []
})

const query = computed(() => {
  const params: Record<string, string> = { date: date.value }

  if (isAdmin.value && professionalFilter.value !== 'all') {
    params.professionalId = professionalFilter.value
  }

  return params
})

const { data: agenda, status, refresh } = await useFetch<StaffAgendaResponse>('/api/appointments', {
  query,
  default: () => ({
    date: date.value,
    timezone: 'America/Sao_Paulo',
    professionalId: null,
    appointments: []
  })
})

const appointments = computed(() => agenda.value?.appointments ?? [])

const summary = computed(() => {
  const result = { total: appointments.value.length, completed: 0, noShow: 0, scheduled: 0 }

  for (const item of appointments.value) {
    if (item.status === 'completed') {
      result.completed += 1
    } else if (item.status === 'no_show') {
      result.noShow += 1
    } else if (item.status === 'scheduled') {
      result.scheduled += 1
    }
  }

  return result
})

const professionalItems = computed(() => [
  { label: 'Todas as profissionais', value: 'all' },
  ...(professionals.value ?? []).map(professional => ({
    label: professional.name,
    value: professional.id
  }))
])

function goToday() {
  date.value = todayInTimeZone()
}

watch(date, (value) => {
  if (!value) {
    date.value = todayInTimeZone()
  }
})

/* --------------------------- Novo agendamento --------------------------- */

const createOpen = ref(false)
const creating = ref(false)
const formError = ref('')
const services = ref<Service[]>([])
const loadingServices = ref(false)
const pickerKey = ref(0)
let servicesRequest = 0

const form = reactive({
  professionalId: '',
  serviceId: '',
  startsAt: null as string | null,
  name: '',
  phone: '',
  notes: ''
})

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const serviceItems = computed(() => services.value.map(service => ({
  label: `${service.name} · ${service.durationMin} min · ${brl.format(service.priceCents / 100)}`,
  value: service.id
})))

const phoneValid = computed(() => normalizePhoneDigits(form.phone) !== null)

const canSubmit = computed(() => (
  !!form.professionalId
  && !!form.serviceId
  && !!form.startsAt
  && form.name.trim().length >= 2
  && phoneValid.value
))

async function loadServices() {
  const current = ++servicesRequest
  form.serviceId = ''
  form.startsAt = null
  pickerKey.value += 1

  if (!form.professionalId) {
    services.value = []
    return
  }

  loadingServices.value = true

  try {
    const rows = await $fetch<Service[]>('/api/services', {
      query: { professionalId: form.professionalId, active: 'true' }
    })

    if (current === servicesRequest) {
      services.value = rows
    }
  } catch (error) {
    if (current === servicesRequest) {
      services.value = []
      formError.value = getApiErrorMessage(error, 'Não foi possível carregar os serviços.')
    }
  } finally {
    if (current === servicesRequest) {
      loadingServices.value = false
    }
  }
}

watch(() => form.professionalId, () => {
  void loadServices()
})

function openCreate() {
  form.professionalId = isAdmin.value
    ? (professionalFilter.value !== 'all' ? professionalFilter.value : '')
    : (user.value?.id ?? '')
  form.serviceId = ''
  form.startsAt = null
  form.name = ''
  form.phone = ''
  form.notes = ''
  formError.value = ''
  pickerKey.value += 1

  if (form.professionalId) {
    void loadServices()
  } else {
    services.value = []
  }

  createOpen.value = true
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  creating.value = true
  formError.value = ''

  try {
    const response = await $fetch<StaffAppointmentResponse>('/api/appointments', {
      method: 'POST',
      body: {
        professionalId: form.professionalId,
        serviceId: form.serviceId,
        startsAt: form.startsAt,
        clientName: form.name.trim(),
        clientPhone: form.phone,
        notes: form.notes.trim() || undefined
      }
    })

    createOpen.value = false

    if (isAdmin.value) {
      professionalFilter.value = response.appointment.professionalId
    }

    date.value = isoDateOfInstant(response.appointment.startsAt)

    toast.add({
      title: 'Agendamento criado',
      description: `${response.appointment.clientName} · ${response.appointment.serviceName}`,
      icon: 'i-ri-check-line',
      color: 'success'
    })

    await refresh()
  } catch (error) {
    formError.value = getApiErrorMessage(error, 'Não foi possível criar o agendamento.')
    form.startsAt = null
    pickerKey.value += 1
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="agenda">
    <template #header>
      <UDashboardNavbar title="Agenda">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <UBadge color="neutral" variant="outline">
            {{ summary.total }} agendamento{{ summary.total === 1 ? '' : 's' }}
          </UBadge>
          <UBadge v-if="summary.scheduled" color="primary" variant="subtle">
            {{ summary.scheduled }} agendado{{ summary.scheduled === 1 ? '' : 's' }}
          </UBadge>
          <UBadge v-if="summary.completed" color="success" variant="subtle">
            {{ summary.completed }} concluído{{ summary.completed === 1 ? '' : 's' }}
          </UBadge>
          <UBadge v-if="summary.noShow" color="warning" variant="subtle">
            {{ summary.noShow }} no-show
          </UBadge>
        </div>

        <template #right>
          <UButton label="Novo agendamento" icon="i-ri-add-line" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <UPopover :modal="false">
            <template #default>
              <UButton
color="neutral" variant="outline" icon="i-ri-calendar-line"
                class="data-[state=open]:bg-elevated group">
                <span class="hidden sm:inline truncate">
                  {{ formatIsoDateLong(date) }}
                </span>
                <template #trailing>
                  <UIcon
name="i-ri-arrow-down-s-line"
                    class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
                </template>
              </UButton>
            </template>
            <template #content>
              <div class="p-2">
                <UCalendar v-model="calendarDate" />
              </div>
            </template>
          </UPopover>
          <UButton label="Hoje" color="neutral" variant="ghost" @click="goToday" />
        </div>

        <USelect
v-if="isAdmin" v-model="professionalFilter" :items="professionalItems" icon="i-ri-user-line"
          class="w-full lg:w-64" />
      </div>

      <div v-if="status === 'pending'" class="mt-6 space-y-3">
        <USkeleton v-for="index in 3" :key="index" class="h-32 w-full" />
      </div>

      <UCard v-else-if="!appointments.length" class="mt-6">
        <div class="flex flex-col items-center gap-3 py-8 text-center">
          <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
            <UIcon name="i-ri-calendar-line" class="size-6 text-muted" />
          </div>
          <div>
            <p class="font-medium text-highlighted">
              Nenhum agendamento neste dia
            </p>
            <p class="text-sm text-muted">
              Crie um agendamento para hoje, amanhã ou um encaixe.
            </p>
          </div>
          <UButton label="Novo agendamento" icon="i-ri-add-line" size="sm" @click="openCreate" />
        </div>
      </UCard>

      <div v-else class="mt-6 space-y-3">
        <StaffAppointmentCard
v-for="item in appointments" :key="item.id" :appointment="item" :is-admin="isAdmin"
          :current-user-id="user?.id" @changed="refresh" />
      </div>
    </template>
  </UDashboardPanel>

  <UModal
v-model:open="createOpen" title="Novo agendamento"
    description="Hoje, amanhã ou encaixe. A antecedência de 3 dias vale apenas para a cliente."
    :ui="{ body: 'max-h-[75vh] overflow-y-auto' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField v-if="isAdmin" label="Profissional" required>
          <USelect
v-model="form.professionalId"
            :items="(professionals ?? []).map(p => ({ label: p.name, value: p.id }))" placeholder="Selecione"
            class="w-full" />
        </UFormField>

        <p v-else class="text-sm text-muted">
          Profissional: <strong class="text-highlighted">{{ user?.name }}</strong>
        </p>

        <UFormField label="Serviço" required>
          <USelect
v-model="form.serviceId" :items="serviceItems" :loading="loadingServices"
            :disabled="!form.professionalId || !serviceItems.length" :placeholder="form.professionalId
              ? (serviceItems.length ? 'Selecione' : 'Nenhum serviço ativo')
              : 'Selecione a profissional primeiro'" class="w-full" />
        </UFormField>

        <div v-if="form.professionalId && form.serviceId" class="rounded-lg border border-default p-3">
          <AvailabilityPicker
:key="pickerKey" v-model="form.startsAt" :professional-id="form.professionalId"
            :service-id="form.serviceId" :min-date="today" endpoint="/api/availability" :client-lead="false" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nome da cliente" required>
            <UInput v-model="form.name" placeholder="Como devemos chamar?" autocomplete="off" class="w-full" />
          </UFormField>

          <UFormField label="WhatsApp" required>
            <UInput v-model="form.phone" type="tel" placeholder="(11) 99999-9999" autocomplete="off" class="w-full" />
            <p v-if="form.phone && !phoneValid" class="mt-1 text-xs text-error">
              Informe um WhatsApp válido com DDD.
            </p>
          </UFormField>
        </div>

        <UFormField label="Observações">
          <UTextarea
v-model="form.notes" :rows="2" placeholder="Preferências, encaixe, observações do atendimento..."
            class="w-full" />
        </UFormField>

        <UAlert v-if="formError" color="error" variant="subtle" :description="formError" />

        <UButton type="submit" label="Confirmar agendamento" :loading="creating" :disabled="!canSubmit" block />
      </form>
    </template>
  </UModal>
</template>
