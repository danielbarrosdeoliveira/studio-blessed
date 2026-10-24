<script setup lang="ts">
import type { Professional, WorkingHour } from '~/types/domain'

const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id))

const { isAdmin } = await useUserSession()

const { data: professional, error: professionalError } = await useFetch<Professional>(
  () => `/api/professionals/${id.value}`
)

const { data: workingHours, error: workingHoursError, refresh } = await useFetch<WorkingHour[]>(
  () => `/api/professionals/${id.value}/working-hours`
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
            Os intervalos definem quando a profissional atende. Pausas (ex.: almoço)
            devem ser criadas como intervalos separados no mesmo dia.
          </p>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
