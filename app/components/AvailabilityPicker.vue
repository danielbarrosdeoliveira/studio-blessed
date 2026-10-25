<script setup lang="ts">
import type { PublicAvailability } from '~/types/domain'
import { CalendarDate } from '@internationalized/date'
import { addDaysToIsoDate, formatIsoDateLong, todayInTimeZone } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'

const props = withDefaults(defineProps<{
  professionalId: string
  serviceId: string
  /** Primeira data permitida (`YYYY-MM-DD`). */
  minDate: string
  label?: string
  /** Rota de disponibilidade (pública ou do staff). */
  endpoint?: string
  /** Aplica a antecedência mínima de 3 dias da cliente. */
  clientLead?: boolean
}>(), {
  label: undefined,
  endpoint: '/api/public/availability',
  clientLead: true
})

const selected = defineModel<string | null>({ default: null })

const selectedDate = ref(props.minDate)
const availability = shallowRef<PublicAvailability | null>(null)
const pending = ref(true)
const error = ref('')
let requestId = 0

const minSelectableDate = computed(() => {
  if (!props.clientLead) {
    return props.minDate
  }

  const clientMin = addDaysToIsoDate(todayInTimeZone(), 3)

  return props.minDate > clientMin ? props.minDate : clientMin
})

const calendarDate = computed<CalendarDate | undefined>({
  get: () => {
    const parts = selectedDate.value.split('-')
    return new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]))
  },
  set: (value: CalendarDate | undefined) => {
    if (value) {
      selectedDate.value = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
    }
  }
})

const minCalendarDate = computed(() => {
  const parts = minSelectableDate.value.split('-')
  return new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]))
})

async function load() {
  if (!props.professionalId || !props.serviceId) {
    availability.value = null
    pending.value = false
    return
  }

  const current = ++requestId
  pending.value = true
  error.value = ''

  try {
    const result = await $fetch<PublicAvailability>(props.endpoint, {
      query: {
        professionalId: props.professionalId,
        serviceId: props.serviceId,
        date: selectedDate.value
      }
    })

    if (current !== requestId) {
      return
    }

    availability.value = result

    if (selected.value && !result.slots.some(slot => slot.startsAt === selected.value)) {
      selected.value = null
    }
  } catch (fetchError) {
    if (current !== requestId) {
      return
    }

    availability.value = null
    error.value = getApiErrorMessage(fetchError, 'Não foi possível carregar os horários.')
  } finally {
    if (current === requestId) {
      pending.value = false
    }
  }
}

onMounted(load)
watch(selectedDate, load)
watch(
  [() => props.professionalId, () => props.serviceId],
  () => {
    selected.value = null
    void load()
  }
)
</script>

<template>
  <div class="space-y-4">
    <UFormField
      :label="label ?? 'Escolha a data'"
      :help="`Horários no fuso de São Paulo`"
    >
      <UCalendar
        v-model="calendarDate"
        :min-value="minCalendarDate"
        class="w-full"
      />
    </UFormField>

    <div
      v-if="pending"
      class="grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      <USkeleton
        v-for="index in 8"
        :key="index"
        class="h-9"
      />
    </div>

    <p
      v-else-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>

    <div
      v-else-if="!availability?.slots.length"
      class="rounded-lg border border-default px-4 py-6 text-center text-sm text-muted"
    >
      Sem horários nesta data. Tente outro dia.
    </div>

    <div
      v-else
      class="grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      <UButton
        v-for="slot in availability.slots"
        :key="slot.startsAt"
        type="button"
        :label="slot.label"
        :variant="selected === slot.startsAt ? 'solid' : 'outline'"
        :color="selected === slot.startsAt ? 'primary' : 'neutral'"
        block
        @click="selected = slot.startsAt"
      />
    </div>

    <p class="text-xs text-muted">
      {{ formatIsoDateLong(selectedDate) }}
    </p>
  </div>
</template>
