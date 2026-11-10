<script setup lang="ts">
import type { ClientAppointmentsResponse, StaffAppointment } from '~/types/domain'
import { appointmentStatusMeta } from '~/utils/appointment'
import { formatInstantLong, formatInstantTime, isoDateOfInstant } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { formatPhone } from '~/utils/phone'

const props = defineProps<{
  clientId: string | null
}>()

const open = defineModel<boolean>('open', { default: false })

const router = useRouter()

const loading = ref(false)
const error = ref('')
const data = ref<ClientAppointmentsResponse | null>(null)

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const upcoming = computed(() =>
  (data.value?.appointments ?? [])
    .filter((appointment) => appointment.status === 'scheduled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
)

const history = computed(() =>
  (data.value?.appointments ?? []).filter((appointment) => appointment.status !== 'scheduled')
)

const whatsappUrl = computed(() => (data.value ? `https://wa.me/55${data.value.client.phone}` : ''))

async function load() {
  if (!props.clientId) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    data.value = await $fetch<ClientAppointmentsResponse>(
      `/api/clientes/${props.clientId}/appointments`
    )
  } catch (fetchError) {
    data.value = null
    error.value = getApiErrorMessage(fetchError, 'Não foi possível carregar os agendamentos.')
  } finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (value) {
    void load()
  }
})

function openInAgenda(appointment: StaffAppointment) {
  open.value = false
  void router.push({ path: '/painel', query: { date: isoDateOfInstant(appointment.startsAt) } })
}
</script>

<template>
  <USlideover v-model:open="open" title="Agendamentos da cliente">
    <template #body>
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="index in 4" :key="index" class="h-20 w-full" />
      </div>

      <UAlert v-else-if="error" color="error" variant="subtle" :description="error" />

      <div v-else-if="data" class="space-y-6">
        <div class="flex flex-col gap-3 rounded-lg border border-default p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-highlighted">{{ data.client.name }}</p>
              <p class="text-sm text-muted">{{ formatPhone(data.client.phone) }}</p>
            </div>
            <UBadge v-if="data.client.blocked" color="warning" variant="subtle"> Bloqueada </UBadge>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <UButton
              label="WhatsApp"
              icon="i-ri-whatsapp-line"
              color="neutral"
              variant="outline"
              size="sm"
              :to="whatsappUrl"
              target="_blank"
            />
          </div>
        </div>

        <div v-if="upcoming.length">
          <p class="mb-2 font-medium text-highlighted">Próximos</p>
          <div class="space-y-2">
            <UCard
              v-for="appointment in upcoming"
              :key="appointment.id"
              :ui="{ body: 'p-4 sm:p-4' }"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-highlighted">{{ appointment.serviceName }}</p>
                  <p class="text-sm text-muted">
                    {{ formatInstantLong(appointment.startsAt) }} ·
                    {{ formatInstantTime(appointment.startsAt) }}–{{
                      formatInstantTime(appointment.endsAt)
                    }}
                  </p>
                  <p v-if="appointment.notes" class="mt-1 text-sm text-dimmed">
                    {{ appointment.notes }}
                  </p>
                </div>
                <div class="flex flex-col items-end gap-1.5">
                  <UBadge :color="appointmentStatusMeta[appointment.status].color" variant="subtle">
                    {{ appointmentStatusMeta[appointment.status].label }}
                  </UBadge>
                  <span class="text-sm text-muted">
                    {{ brl.format(appointment.priceCents / 100) }}
                  </span>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <UButton
                  label="Abrir na agenda"
                  icon="i-ri-external-link-line"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="openInAgenda(appointment)"
                />
              </div>
            </UCard>
          </div>
        </div>

        <div v-if="history.length">
          <p class="mb-2 font-medium text-highlighted">Histórico</p>
          <div class="space-y-2">
            <UCard
              v-for="appointment in history"
              :key="appointment.id"
              :ui="{ body: 'p-4 sm:p-4' }"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-highlighted">{{ appointment.serviceName }}</p>
                  <p class="text-sm text-muted">{{ formatInstantLong(appointment.startsAt) }}</p>
                </div>
                <div class="flex flex-col items-end gap-1.5">
                  <UBadge :color="appointmentStatusMeta[appointment.status].color" variant="subtle">
                    {{ appointmentStatusMeta[appointment.status].label }}
                  </UBadge>
                  <span class="text-sm text-muted">
                    {{ brl.format(appointment.priceCents / 100) }}
                  </span>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <p v-if="!upcoming.length && !history.length" class="text-sm text-muted">
          Nenhum agendamento para esta cliente ainda.
        </p>
      </div>
    </template>
  </USlideover>
</template>
