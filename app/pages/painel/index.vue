<script setup lang="ts">
import type { Service, StaffAgendaResponse, StaffAppointmentResponse } from '~/types/domain'
import { CalendarDate } from '@internationalized/date'
import { formatIsoDateLong, isoDateOfInstant, todayInTimeZone } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { normalizePhoneDigits } from '~/utils/phone'

useHead({
  title: 'Agenda · Studio Blessed'
})

const toast = useToast()
const route = useRoute()
const router = useRouter()

const today = todayInTimeZone()

/** A data da agenda pode vir da URL (`/staff/painel?date=2026-11-26`) para ser compartilhável. */
function dateFromQuery(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return today
  }

  const [, month, day] = value.split('-').map(Number)

  if (month! < 1 || month! > 12 || day! < 1 || day! > 31) {
    return today
  }

  return value
}

const date = ref(dateFromQuery(route.query.date))

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

const query = computed(() => ({ date: date.value }))

const {
  data: agenda,
  status,
  refresh
} = await useFetch<StaffAgendaResponse>('/api/appointments', {
  query,
  default: () => ({
    date: date.value,
    timezone: 'America/Sao_Paulo',
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

function goToday() {
  date.value = todayInTimeZone()
}

watch(date, (value) => {
  if (!value) {
    date.value = todayInTimeZone()
    return
  }

  if (route.query.date !== value) {
    void router.replace({ query: { ...route.query, date: value } })
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
  serviceId: '',
  startsAt: null as string | null,
  name: '',
  phone: '',
  notes: ''
})

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const serviceItems = computed(() =>
  services.value.map((service) => ({
    label: `${service.name} · ${service.durationMin} min · ${brl.format(service.priceCents / 100)}`,
    value: service.id
  }))
)

const phoneValid = computed(() => normalizePhoneDigits(form.phone) !== null)

const canSubmit = computed(
  () => !!form.serviceId && !!form.startsAt && form.name.trim().length >= 2 && phoneValid.value
)

async function loadServices() {
  const current = ++servicesRequest
  form.serviceId = ''
  form.startsAt = null
  pickerKey.value += 1
  loadingServices.value = true

  try {
    const rows = await $fetch<Service[]>('/api/services', {
      query: { active: 'true' }
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

function openCreate() {
  form.serviceId = ''
  form.startsAt = null
  form.name = ''
  form.phone = ''
  form.notes = ''
  formError.value = ''
  pickerKey.value += 1

  void loadServices()

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
        serviceId: form.serviceId,
        startsAt: form.startsAt,
        clientName: form.name.trim(),
        clientPhone: form.phone,
        notes: form.notes.trim() || undefined
      }
    })

    createOpen.value = false

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
                color="neutral"
                variant="outline"
                icon="i-ri-calendar-line"
                class="group data-[state=open]:bg-elevated"
              >
                <span class="hidden truncate sm:inline">
                  {{ formatIsoDateLong(date) }}
                </span>
                <template #trailing>
                  <UIcon
                    name="i-ri-arrow-down-s-line"
                    class="size-5 shrink-0 text-dimmed transition-transform duration-200 group-data-[state=open]:rotate-180"
                  />
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
            <p class="font-medium text-highlighted">Nenhum agendamento neste dia</p>
            <p class="text-sm text-muted">Crie um agendamento para hoje, amanhã ou um encaixe.</p>
          </div>
          <UButton label="Novo agendamento" icon="i-ri-add-line" size="sm" @click="openCreate" />
        </div>
      </UCard>

      <div v-else class="mt-6 space-y-3">
        <StaffAppointmentCard
          v-for="item in appointments"
          :key="item.id"
          :appointment="item"
          @changed="refresh"
        />
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="createOpen"
    title="Novo agendamento"
    :ui="{ body: 'max-h-[75vh] overflow-y-auto' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Serviço" required>
          <USelect
            v-model="form.serviceId"
            :items="serviceItems"
            :loading="loadingServices"
            :disabled="!serviceItems.length"
            :placeholder="serviceItems.length ? 'Selecione' : 'Nenhum serviço ativo'"
            class="w-full"
          />
        </UFormField>

        <div v-if="form.serviceId" class="rounded-lg border border-default p-3">
          <AvailabilityPicker
            :key="pickerKey"
            v-model="form.startsAt"
            :service-id="form.serviceId"
            :min-date="date"
            endpoint="/api/availability"
            :client-lead="false"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nome da cliente" required>
            <UInput
              v-model="form.name"
              placeholder="Como devemos chamar?"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>

          <UFormField label="WhatsApp" required>
            <UInput
              v-model="form.phone"
              type="tel"
              placeholder="(11) 99999-9999"
              autocomplete="off"
              class="w-full"
            />
            <p v-if="form.phone && !phoneValid" class="mt-1 text-xs text-error">
              Informe um WhatsApp válido com DDD.
            </p>
          </UFormField>
        </div>

        <UFormField label="Observações">
          <UTextarea
            v-model="form.notes"
            :rows="2"
            placeholder="Preferências, encaixe, observações do atendimento..."
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="formError" color="error" variant="subtle" :description="formError" />

        <UButton
          type="submit"
          label="Confirmar agendamento"
          :loading="creating"
          :disabled="!canSubmit"
          block
        />
      </form>
    </template>
  </UModal>
</template>
