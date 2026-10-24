<script setup lang="ts">
import type { PublicAppointment, PublicCancellationPolicy } from '~/types/domain'
import { appointmentStatusMeta } from '~/utils/appointment'
import { addDaysToIsoDate, formatInstantLong, todayInTimeZone } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'

const props = defineProps<{
  appointment: PublicAppointment
  phone: string
  cancellation: PublicCancellationPolicy
}>()

const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const cancelOpen = ref(false)
const rescheduleOpen = ref(false)
const newSlot = ref<string | null>(null)
const pickerKey = ref(0)
const cancelling = ref(false)
const rescheduling = ref(false)
const actionError = ref('')

const minDate = computed(() => addDaysToIsoDate(todayInTimeZone(), 3))

const statusMeta = computed(() => appointmentStatusMeta[props.appointment.status])

function openReschedule() {
  actionError.value = ''
  newSlot.value = null
  rescheduleOpen.value = true
}

async function cancel() {
  cancelling.value = true
  actionError.value = ''

  try {
    await $fetch(`/api/public/appointments/${props.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'cancel', phone: props.phone }
    })

    cancelOpen.value = false
    toast.add({ title: 'Agendamento cancelado', color: 'success' })
    emit('changed')
  } catch (error) {
    actionError.value = getApiErrorMessage(error, 'Não foi possível cancelar o agendamento.')
  } finally {
    cancelling.value = false
  }
}

async function reschedule() {
  if (!newSlot.value) {
    return
  }

  rescheduling.value = true
  actionError.value = ''

  try {
    await $fetch(`/api/public/appointments/${props.appointment.id}`, {
      method: 'PATCH',
      body: {
        action: 'reschedule',
        phone: props.phone,
        startsAt: newSlot.value
      }
    })

    rescheduleOpen.value = false
    toast.add({ title: 'Agendamento remarcado', color: 'success' })
    emit('changed')
  } catch (error) {
    actionError.value = getApiErrorMessage(error, 'Não foi possível remarcar o agendamento.')
    newSlot.value = null
    pickerKey.value += 1
  } finally {
    rescheduling.value = false
  }
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-semibold text-highlighted">
            {{ appointment.serviceName }}
          </h3>
          <UBadge
            :color="statusMeta.color"
            variant="subtle"
          >
            {{ statusMeta.label }}
          </UBadge>
        </div>

        <p class="text-sm text-muted">
          {{ appointment.professionalName }} · {{ appointment.durationMin }} min
        </p>

        <p class="text-sm text-highlighted">
          {{ formatInstantLong(appointment.startsAt) }}
        </p>

        <p
          v-if="appointment.status === 'scheduled' && !appointment.canChange"
          class="text-xs text-muted"
        >
          Alterações permitidas até {{ cancellation.hours }}h antes. Depois desse prazo,
          aplica-se a política de taxa de {{ cancellation.feePercentage }}%.
        </p>
      </div>

      <div
        v-if="appointment.canChange"
        class="flex shrink-0 gap-2"
      >
        <UButton
          label="Remarcar"
          icon="i-ri-calendar-line"
          size="sm"
          color="neutral"
          variant="outline"
          @click="openReschedule"
        />
        <UButton
          label="Cancelar"
          icon="i-ri-close-line"
          size="sm"
          color="error"
          variant="outline"
          @click="actionError = ''; cancelOpen = true"
        />
      </div>
    </div>

    <UModal
      v-model:open="cancelOpen"
      title="Cancelar agendamento"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-muted">
            Tem certeza que deseja cancelar
            <strong class="text-highlighted">{{ appointment.serviceName }}</strong>?
          </p>
          <p class="text-sm text-muted">
            {{ formatInstantLong(appointment.startsAt) }} com {{ appointment.professionalName }}.
          </p>
          <UAlert
            v-if="actionError"
            color="error"
            variant="subtle"
            :description="actionError"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Voltar"
            color="neutral"
            variant="ghost"
            @click="cancelOpen = false"
          />
          <UButton
            label="Confirmar cancelamento"
            color="error"
            :loading="cancelling"
            @click="cancel"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="rescheduleOpen"
      title="Remarcar agendamento"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{ appointment.serviceName }} · {{ appointment.professionalName }}
          </p>

          <AvailabilityPicker
            v-if="rescheduleOpen"
            :key="pickerKey"
            v-model="newSlot"
            :professional-id="appointment.professionalId"
            :service-id="appointment.serviceId"
            :min-date="minDate"
          />

          <UAlert
            v-if="actionError"
            color="error"
            variant="subtle"
            :description="actionError"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Voltar"
            color="neutral"
            variant="ghost"
            @click="rescheduleOpen = false"
          />
          <UButton
            label="Confirmar novo horário"
            :loading="rescheduling"
            :disabled="!newSlot"
            @click="reschedule"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
