<script setup lang="ts">
import type {
  Professional,
  TimeBlock,
  TimeBlockConflict,
  TimeBlockResponse,
  WorkingHour
} from '~/types/domain'
import { CalendarDate } from '@internationalized/date'
import {
  formatInstantLong,
  formatInstantTime,
  formatIsoDateLong,
  instantOfLocalDateTime,
  isoDateOfInstant,
  todayInTimeZone,
  weekdayOfIsoDate
} from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'

const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id))
const today = todayInTimeZone()

const { isAdmin } = await useUserSession()

const { data: professional, error: professionalError } = await useFetch<Professional>(
  () => `/api/professionals/${id.value}`
)

const { data: workingHours, error: workingHoursError, refresh } = await useFetch<WorkingHour[]>(
  () => `/api/professionals/${id.value}/working-hours`
)

const {
  data: blocks,
  error: blocksError,
  refresh: refreshBlocks
} = await useFetch<TimeBlock[]>(
  () => `/api/professionals/${id.value}/blocks`
)

const weekdays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

interface Interval {
  start: string
  end: string
}

interface Day {
  weekday: number
  enabled: boolean
  intervals: Interval[]
}

function toTime(minute: number) {
  const hours = Math.floor(minute / 60)
  const minutes = minute % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function toMinute(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

const days = ref<Day[]>([])

watch(workingHours, (rows) => {
  days.value = weekdays.map((_, weekday) => {
    const dayRows = (rows ?? [])
      .filter(row => row.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)

    return {
      weekday,
      enabled: dayRows.length > 0,
      intervals: dayRows.length
        ? dayRows.map(row => ({ start: toTime(row.startMinute), end: toTime(row.endMinute) }))
        : [{ start: '09:00', end: '18:00' }]
    }
  })
}, { immediate: true })

const saving = ref(false)

async function save() {
  const hours: { weekday: number, startMinute: number, endMinute: number }[] = []

  for (const day of days.value) {
    if (!day.enabled) {
      continue
    }

    const intervals = day.intervals
      .map(interval => ({
        startMinute: toMinute(interval.start),
        endMinute: toMinute(interval.end)
      }))
      .sort((a, b) => a.startMinute - b.startMinute)

    let previousEnd = -1

    for (const interval of intervals) {
      if (interval.endMinute <= interval.startMinute) {
        toast.add({
          title: 'Horário inválido',
          description: `Em ${weekdays[day.weekday]}, o fim deve ser depois do início.`,
          icon: 'i-ri-error-warning-line',
          color: 'error'
        })
        return
      }

      if (interval.startMinute < previousEnd) {
        toast.add({
          title: 'Intervalos sobrepostos',
          description: `Ajuste os intervalos de ${weekdays[day.weekday]}.`,
          icon: 'i-ri-error-warning-line',
          color: 'error'
        })
        return
      }

      previousEnd = interval.endMinute
      hours.push({
        weekday: day.weekday,
        startMinute: interval.startMinute,
        endMinute: interval.endMinute
      })
    }
  }

  saving.value = true

  try {
    await $fetch(`/api/professionals/${id.value}/working-hours`, {
      method: 'PUT',
      body: { hours }
    })

    toast.add({
      title: 'Jornada salva',
      icon: 'i-ri-check-line',
      color: 'success'
    })

    await refresh()
  } catch (error) {
    toast.add({
      title: 'Não foi possível salvar a jornada',
      description: (error as { data?: { message?: string } })?.data?.message ?? 'Tente novamente.',
      icon: 'i-ri-error-warning-line',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

/* -------------------------------- Bloqueios ------------------------------- */

const blockOpen = ref(false)
const conflictOpen = ref(false)
const savingBlock = ref(false)
const blockError = ref('')
const blockConflicts = ref<TimeBlockConflict[]>([])

const blockForm = reactive({
  date: today,
  start: '12:00',
  end: '13:00',
  reason: '',
  weekly: false
})

const todayCalendarDate = computed(() => {
  const parts = today.split('-')
  return new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]))
})

const blockCalendarDate = computed<CalendarDate | undefined>({
  get: () => {
    const parts = blockForm.date.split('-')
    return new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]))
  },
  set: (value: CalendarDate | undefined) => {
    blockForm.date = value
      ? `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
      : today
  }
})

const blockList = computed(() => [...(blocks.value ?? [])].sort(
  (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
))

function formatBlockRange(block: TimeBlock) {
  const date = isoDateOfInstant(block.startsAt)
  const range = `${formatInstantTime(block.startsAt)}–${formatInstantTime(block.endsAt)}`

  if (block.recurrence === 'weekly') {
    return `Semanal · ${weekdayOfIsoDate(date)}, ${range}`
  }

  return `${formatIsoDateLong(date)} · ${range}`
}

function openBlock() {
  Object.assign(blockForm, {
    date: today,
    start: '12:00',
    end: '13:00',
    reason: '',
    weekly: false
  })
  blockError.value = ''
  blockConflicts.value = []
  blockOpen.value = true
}

function closeBlock() {
  blockOpen.value = false
  conflictOpen.value = false
  blockError.value = ''
  blockConflicts.value = []
}

async function saveBlock(confirmConflict = false) {
  blockError.value = ''

  if (!blockForm.date || !blockForm.start || !blockForm.end) {
    blockError.value = 'Preencha a data e os horários do bloqueio.'
    return
  }

  const startsAt = instantOfLocalDateTime(blockForm.date, blockForm.start)
  const endsAt = instantOfLocalDateTime(blockForm.date, blockForm.end)

  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    blockError.value = 'O fim deve ser depois do início.'
    return
  }

  savingBlock.value = true

  try {
    const response = await $fetch<TimeBlockResponse>(
      `/api/professionals/${id.value}/blocks`,
      {
        method: 'POST',
        body: {
          startsAt,
          endsAt,
          reason: blockForm.reason.trim() || undefined,
          recurrence: blockForm.weekly ? 'weekly' : null,
          confirmConflict
        }
      }
    )

    closeBlock()
    await refreshBlocks()

    toast.add({
      title: 'Bloqueio salvo',
      description: formatBlockRange(response.block),
      icon: 'i-ri-check-line',
      color: 'success'
    })

    if (response.conflicts.length) {
      toast.add({
        title: 'Agendamentos mantidos',
        description: `${response.conflicts.length} agendamento(s) existente(s) não foram cancelados.`,
        icon: 'i-ri-information-line',
        color: 'warning'
      })
    }
  } catch (error) {
    const payload = (error as {
      data?: {
        conflicts?: TimeBlockConflict[]
        data?: { conflicts?: TimeBlockConflict[] }
      }
    })?.data
    const conflicts = payload?.data?.conflicts ?? payload?.conflicts

    if (conflicts?.length) {
      blockConflicts.value = conflicts
      conflictOpen.value = true
      return
    }

    conflictOpen.value = false
    blockError.value = getApiErrorMessage(error, 'Não foi possível salvar o bloqueio.')
  } finally {
    savingBlock.value = false
  }
}

async function removeBlock(block: TimeBlock) {
  try {
    await $fetch(`/api/professionals/${id.value}/blocks/${block.id}`, {
      method: 'DELETE'
    })
    await refreshBlocks()

    toast.add({
      title: 'Bloqueio removido',
      icon: 'i-ri-check-line',
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Não foi possível remover o bloqueio',
      description: getApiErrorMessage(error, 'Tente novamente.'),
      icon: 'i-ri-error-warning-line',
      color: 'error'
    })
  }
}

const backTo = computed(() => isAdmin.value ? '/profissionais' : '/')
</script>

<template>
  <UDashboardPanel id="professional-hours">
    <template #header>
      <UDashboardNavbar :title="professional?.name ?? 'Jornada'">
        <template #leading>
          <UButton
            icon="i-ri-arrow-left-line"
            color="neutral"
            variant="ghost"
            :to="backTo"
            aria-label="Voltar"
          />
        </template>

        <template #right>
          <UButton
            v-if="professional"
            label="Salvar jornada"
            icon="i-ri-check-line"
            :loading="saving"
            @click="save"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-2xl mx-auto space-y-4">
        <UAlert
          v-if="professionalError || workingHoursError"
          color="error"
          variant="subtle"
          icon="i-ri-error-warning-line"
          title="Não foi possível carregar a jornada"
          description="Você não tem acesso a esta profissional ou ela não existe."
        />

        <template v-else-if="professional">
          <UCard>
            <div class="flex items-center gap-3">
              <UAvatar
                :alt="professional.name"
                size="lg"
              />
              <div>
                <p class="font-medium text-highlighted">
                  {{ professional.name }}
                </p>
                <p class="text-sm text-muted">
                  {{ professional.email }}
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-medium text-highlighted">
                  Bloqueios
                </h2>
                <p class="text-sm text-muted">
                  Folgas, almoços e compromissos fora do horário de atendimento.
                </p>
              </div>

              <UButton
                label="Novo bloqueio"
                icon="i-ri-add-line"
                size="sm"
                @click="openBlock"
              />
            </div>

            <UAlert
              v-if="blocksError"
              color="error"
              variant="subtle"
              icon="i-ri-error-warning-line"
              title="Não foi possível carregar os bloqueios"
              class="mt-4"
            />

            <p
              v-else-if="!blockList.length"
              class="mt-4 text-sm text-muted"
            >
              Nenhum bloqueio cadastrado.
            </p>

            <ul
              v-else
              class="mt-4 divide-y divide-default"
            >
              <li
                v-for="block in blockList"
                :key="block.id"
                data-testid="time-block"
                class="flex items-start justify-between gap-4 py-3"
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium text-highlighted">
                      {{ formatBlockRange(block) }}
                    </p>
                    <UBadge
                      v-if="block.recurrence === 'weekly'"
                      color="primary"
                      variant="subtle"
                      label="Semanal"
                    />
                  </div>
                  <p class="text-sm text-muted">
                    {{ block.reason || 'Sem motivo informado' }}
                  </p>
                </div>

                <UButton
                  icon="i-ri-delete-bin-line"
                  color="error"
                  variant="ghost"
                  size="xs"
                  aria-label="Remover bloqueio"
                  @click="removeBlock(block)"
                />
              </li>
            </ul>
          </UCard>

          <UCard
            v-for="day in days"
            :key="day.weekday"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <USwitch v-model="day.enabled" />
                <span class="font-medium text-highlighted">
                  {{ weekdays[day.weekday] }}
                </span>
              </div>

              <UButton
                v-if="day.enabled"
                label="Intervalo"
                icon="i-ri-add-line"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="day.intervals.push({ start: '09:00', end: '18:00' })"
              />
            </div>

            <div
              v-if="day.enabled"
              class="mt-4 space-y-2"
            >
              <div
                v-for="(interval, index) in day.intervals"
                :key="index"
                class="flex flex-wrap items-center gap-2"
              >
                <UInput
                  v-model="interval.start"
                  type="time"
                  step="900"
                  class="w-32"
                />
                <span class="text-sm text-muted">até</span>
                <UInput
                  v-model="interval.end"
                  type="time"
                  step="900"
                  class="w-32"
                />
                <UButton
                  v-if="day.intervals.length > 1"
                  icon="i-ri-delete-bin-line"
                  color="error"
                  variant="ghost"
                  size="xs"
                  aria-label="Remover intervalo"
                  @click="day.intervals.splice(index, 1)"
                />
              </div>
            </div>

            <p
              v-else
              class="text-sm text-muted mt-2"
            >
              Sem atendimento neste dia.
            </p>
          </UCard>

          <p class="text-xs text-muted">
            Os intervalos definem quando a profissional atende. Para pausas pontuais
            ou recorrentes (almoço, folga), use os bloqueios acima.
          </p>
        </template>
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="blockOpen"
    title="Novo bloqueio"
    description="O período fica indisponível para novos agendamentos."
    :ui="{ body: 'max-h-[75vh] overflow-y-auto' }"
  >
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="saveBlock(false)"
      >
        <UFormField
          label="Data do bloqueio"
          :help="blockForm.weekly
            ? 'O bloqueio se repete toda semana a partir desta data.'
            : 'Data única do bloqueio.'"
          required
        >
          <UCalendar
            v-model="blockCalendarDate"
            :min-value="todayCalendarDate"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Início"
            required
          >
            <UInput
              v-model="blockForm.start"
              type="time"
              step="900"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Fim"
            required
          >
            <UInput
              v-model="blockForm.end"
              type="time"
              step="900"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Motivo">
          <UInput
            v-model="blockForm.reason"
            placeholder="Almoço, folga, compromisso..."
            maxlength="200"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="blockForm.weekly"
          label="Repetir toda semana"
        />

        <UAlert
          v-if="blockError"
          color="error"
          variant="subtle"
          :description="blockError"
        />

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="closeBlock"
          />
          <UButton
            type="submit"
            label="Salvar bloqueio"
            :loading="savingBlock"
          />
        </div>
      </form>
    </template>
  </UModal>

  <UModal
    v-model:open="conflictOpen"
    title="Conflito com agendamento"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-ri-error-warning-line"
          title="Existe agendamento neste período"
          description="O bloqueio pode ser salvo, mas os agendamentos abaixo não serão cancelados."
        />

        <ul class="space-y-2">
          <li
            v-for="conflict in blockConflicts"
            :key="conflict.id"
            class="rounded-lg border border-default p-3"
          >
            <p class="font-medium text-highlighted">
              {{ conflict.clientName }}
            </p>
            <p class="text-sm text-muted">
              {{ conflict.serviceName }} · {{ formatInstantLong(conflict.startsAt) }}
            </p>
          </li>
        </ul>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="conflictOpen = false"
          />
          <UButton
            label="Salvar mesmo assim"
            color="warning"
            :loading="savingBlock"
            @click="saveBlock(true)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
