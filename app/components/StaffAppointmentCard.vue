<script setup lang="ts">
import type { StaffAppointment } from '~/types/domain'
import { appointmentStatusMeta } from '~/utils/appointment'
import { formatInstantTime } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { formatPhone } from '~/utils/phone'

const props = defineProps<{
  appointment: StaffAppointment
  isAdmin: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const cancelOpen = ref(false)
const working = ref(false)
const cancelError = ref('')

const statusMeta = computed(() => appointmentStatusMeta[props.appointment.status])
const canManage = computed(() => (
  props.isAdmin || props.appointment.professionalId === props.currentUserId
))
const isScheduled = computed(() => props.appointment.status === 'scheduled')
const canCancel = computed(() => canManage.value && isScheduled.value)
const canMarkStatus = computed(() => (
  canManage.value
  && (
    isScheduled.value
    || (props.isAdmin && (props.appointment.status === 'completed' || props.appointment.status === 'no_show'))
  )
))

const timeRange = computed(() => (
  `${formatInstantTime(props.appointment.startsAt)} – ${formatInstantTime(props.appointment.endsAt)}`
))

const whatsappUrl = computed(() => `https://wa.me/55${props.appointment.clientPhone}`)

async function setStatus(status: 'completed' | 'no_show') {
  working.value = true

  try {
    await $fetch(`/api/appointments/${props.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'status', status }
    })

    toast.add({
      title: status === 'completed' ? 'Atendimento concluído' : 'Marcado como não compareceu',
      icon: 'i-ri-check-line',
      color: 'success'
    })

    emit('changed')
  } catch (error) {
    toast.add({
      title: 'Não foi possível atualizar o status',
      description: getApiErrorMessage(error, 'Tente novamente.'),
      icon: 'i-ri-error-warning-line',
      color: 'error'
    })
  } finally {
    working.value = false
  }
}

async function cancel() {
  working.value = true
  cancelError.value = ''

  try {
    await $fetch(`/api/appointments/${props.appointment.id}`, {
      method: 'PATCH',
      body: { action: 'cancel' }
    })

    cancelOpen.value = false
    toast.add({
      title: 'Agendamento cancelado',
      description: 'O horário voltou a ficar disponível.',
      icon: 'i-ri-check-line',
      color: 'success'
    })
    emit('changed')
  } catch (error) {
    cancelError.value = getApiErrorMessage(error, 'Não foi possível cancelar o agendamento.')
  } finally {
    working.value = false
  }
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-sm font-semibold text-highlighted">
            {{ timeRange }}
          </span>
          <UBadge
            :color="statusMeta.color"
            variant="subtle"
          >
            {{ statusMeta.label }}
          </UBadge>
          <UBadge
            color="neutral"
            variant="outline"
          >
            {{ appointment.origin === 'staff' ? 'Staff' : 'Cliente' }}
          </UBadge>
        </div>

        <div>
          <h3 class="font-semibold text-highlighted">
            {{ appointment.serviceName }}
          </h3>
          <p class="text-sm text-muted">
            {{ appointment.clientName }} · {{ appointment.durationMin }} min
            <template v-if="isAdmin">
              · {{ appointment.professionalName }}
            </template>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <UIcon
              name="i-ri-whatsapp-line"
              class="size-4"
            />
            {{ formatPhone(appointment.clientPhone) }}
          </a>
        </div>

        <p
          v-if="appointment.notes"
          class="rounded-lg border border-default px-3 py-2 text-sm text-muted"
        >
          {{ appointment.notes }}
        </p>
      </div>

      <div
        v-if="canMarkStatus || canCancel"
        class="flex shrink-0 flex-wrap gap-2 lg:justify-end"
      >
        <template v-if="isScheduled">
          <UButton
            label="Concluir"
            icon="i-ri-check-line"
            size="sm"
            color="success"
            variant="outline"
            :loading="working"
            @click="setStatus('completed')"
          />
          <UButton
            label="No-show"
            icon="i-ri-user-unfollow-line"
            size="sm"
            color="warning"
            variant="outline"
            :disabled="working"
            @click="setStatus('no_show')"
          />
        </template>

        <template v-else-if="isAdmin">
          <UButton
            v-if="appointment.status === 'completed'"
            label="Corrigir para no-show"
            icon="i-ri-arrow-go-back-line"
            size="sm"
            color="warning"
            variant="ghost"
            :loading="working"
            @click="setStatus('no_show')"
          />
          <UButton
            v-if="appointment.status === 'no_show'"
            label="Corrigir para concluído"
            icon="i-ri-arrow-go-back-line"
            size="sm"
            color="success"
            variant="ghost"
            :loading="working"
            @click="setStatus('completed')"
          />
        </template>

        <UButton
          v-if="canCancel"
          label="Cancelar"
          icon="i-ri-close-line"
          size="sm"
          color="error"
          variant="outline"
          :disabled="working"
          @click="cancelError = ''; cancelOpen = true"
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
            Cancelar <strong class="text-highlighted">{{ appointment.serviceName }}</strong>
            de {{ appointment.clientName }}?
          </p>
          <p class="text-sm text-muted">
            {{ timeRange }} com {{ appointment.professionalName }}. O horário volta a ficar
            disponível.
          </p>
          <UAlert
            v-if="cancelError"
            color="error"
            variant="subtle"
            :description="cancelError"
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
            :loading="working"
            @click="cancel"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
