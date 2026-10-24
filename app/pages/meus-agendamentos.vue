<script setup lang="ts">
import type { PublicAppointmentsResponse } from '~/types/domain'
import { getApiErrorMessage } from '~/utils/error'
import { formatPhone } from '~/utils/phone'

definePageMeta({
  layout: 'public'
})

useHead({
  title: 'Meus agendamentos · Studio Blessed'
})

const phone = ref('')
const loading = ref(false)
const searched = ref(false)
const error = ref('')
const data = ref<PublicAppointmentsResponse | null>(null)

const upcoming = computed(() => (data.value?.appointments ?? [])
  .filter(appointment => appointment.status === 'scheduled')
  .sort((a, b) => a.startsAt.localeCompare(b.startsAt)))

const history = computed(() => (data.value?.appointments ?? [])
  .filter(appointment => appointment.status !== 'scheduled'))

async function search(value = phone.value) {
  const target = value.trim()

  if (!target) {
    error.value = 'Informe o WhatsApp usado no agendamento.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    data.value = await $fetch<PublicAppointmentsResponse>('/api/public/appointments', {
      query: { phone: target }
    })
    phone.value = target
    searched.value = true
  } catch (fetchError) {
    data.value = null
    error.value = getApiErrorMessage(fetchError, 'Não foi possível buscar seus agendamentos.')
  } finally {
    loading.value = false
  }
}

function refresh() {
  if (data.value) {
    void search(data.value.phone)
  }
}

onMounted(() => {
  const stored = sessionStorage.getItem('studio-blessed:phone')

  if (!phone.value && stored) {
    phone.value = stored
  }

  if (phone.value) {
    void search(phone.value)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted sm:text-3xl">
        Meus agendamentos
      </h1>
      <p class="mt-1 text-muted">
        Informe o WhatsApp usado no agendamento para ver seus horários.
      </p>
    </div>

    <UCard>
      <form
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        @submit.prevent="search()"
      >
        <UFormField
          label="WhatsApp"
          class="flex-1"
          help="O mesmo informado no agendamento."
        >
          <UInput
            v-model="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            autocomplete="tel"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Buscar"
          icon="i-ri-search-line"
          :loading="loading"
        />
      </form>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :description="error"
    />

    <div
      v-if="loading && !data"
      class="space-y-3"
    >
      <USkeleton
        v-for="index in 2"
        :key="index"
        class="h-32"
      />
    </div>

    <template v-else-if="data">
      <p class="text-sm text-muted">
        Agendamentos de {{ formatPhone(data.phone) }}
      </p>

      <UCard
        v-if="!data.appointments.length"
        class="text-center"
      >
        <div class="flex flex-col items-center gap-2">
          <UIcon
            name="i-ri-calendar-line"
            class="size-8 text-muted"
          />
          <p class="text-sm text-muted">
            Nenhum agendamento encontrado para este WhatsApp.
          </p>
          <UButton
            to="/catalogo"
            label="Agendar um serviço"
            class="mt-2"
          />
        </div>
      </UCard>

      <section
        v-if="upcoming.length"
        class="space-y-3"
      >
        <h2 class="text-lg font-semibold text-highlighted">
          Próximos
        </h2>

        <PublicAppointmentCard
          v-for="appointment in upcoming"
          :key="appointment.id"
          :appointment="appointment"
          :phone="data.phone"
          :cancellation="data.cancellation"
          @changed="refresh"
        />
      </section>

      <section
        v-if="history.length"
        class="space-y-3"
      >
        <h2 class="text-lg font-semibold text-highlighted">
          Histórico
        </h2>

        <PublicAppointmentCard
          v-for="appointment in history"
          :key="appointment.id"
          :appointment="appointment"
          :phone="data.phone"
          :cancellation="data.cancellation"
          @changed="refresh"
        />
      </section>

      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-ri-information-line"
        title="Política de cancelamento"
        :description="data.cancellation.message"
      />
    </template>

    <UCard
      v-else-if="searched && !loading && !error"
      class="text-center"
    >
      <p class="text-sm text-muted">
        Nenhum agendamento encontrado.
      </p>
    </UCard>
  </div>
</template>
