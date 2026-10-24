<script setup lang="ts">
import type {
  PublicAppointment,
  PublicAppointmentResponse,
  PublicCancellationPolicy,
  PublicServiceGroup
} from '~/types/domain'
import { addDaysToIsoDate, formatInstantLong, todayInTimeZone } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { normalizePhoneDigits } from '~/utils/phone'

definePageMeta({
  layout: 'public'
})

useHead({
  title: 'Agendar · Studio Blessed'
})

const route = useRoute()

const serviceId = computed(() => typeof route.query.serviceId === 'string' ? route.query.serviceId : '')
const professionalId = computed(() => typeof route.query.professionalId === 'string' ? route.query.professionalId : '')

const { data: groups } = await useFetch<PublicServiceGroup[]>('/api/public/services', {
  default: () => []
})

const selection = computed(() => {
  for (const group of groups.value) {
    const professional = group.professionals.find(item => (
      item.id === professionalId.value && item.serviceId === serviceId.value
    ))

    if (professional) {
      return { group, professional }
    }
  }

  return null
})

const minDate = computed(() => addDaysToIsoDate(todayInTimeZone(), 3))

const selectedSlot = ref<string | null>(null)
const pickerKey = ref(0)
const form = reactive({ name: '', phone: '' })
const submitting = ref(false)
const formError = ref('')
const created = ref<PublicAppointment | null>(null)
const policy = ref<PublicCancellationPolicy | null>(null)

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const phoneValid = computed(() => normalizePhoneDigits(form.phone) !== null)
const canSubmit = computed(() => (
  !!selection.value
  && !!selectedSlot.value
  && form.name.trim().length >= 2
  && phoneValid.value
))

function formatPrice(cents: number) {
  return brl.format(cents / 100)
}

async function submit() {
  if (!selection.value || !selectedSlot.value || !canSubmit.value) {
    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const response = await $fetch<PublicAppointmentResponse>('/api/public/appointments', {
      method: 'POST',
      body: {
        professionalId: selection.value.professional.id,
        serviceId: selection.value.professional.serviceId,
        startsAt: selectedSlot.value,
        clientName: form.name.trim(),
        clientPhone: form.phone
      }
    })

    created.value = response.appointment
    policy.value = response.cancellation

    if (import.meta.client) {
      const normalized = normalizePhoneDigits(form.phone)

      if (normalized) {
        sessionStorage.setItem('studio-blessed:phone', normalized)
      }
    }
  } catch (error) {
    formError.value = getApiErrorMessage(error, 'Não foi possível concluir o agendamento.')
    selectedSlot.value = null
    pickerKey.value += 1
  } finally {
    submitting.value = false
  }
}

function bookAnother() {
  created.value = null
  policy.value = null
  selectedSlot.value = null
  formError.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <UButton
      to="/catalogo"
      label="Voltar ao catálogo"
      icon="i-ri-arrow-left-line"
      color="neutral"
      variant="ghost"
      size="sm"
      class="-ml-2"
    />

    <UCard
      v-if="created && policy"
      class="mx-auto max-w-xl"
    >
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-success/10">
          <UIcon
            name="i-ri-check-line"
            class="size-6 text-success"
          />
        </div>
        <h1 class="text-xl font-semibold text-highlighted">
          Agendamento confirmado
        </h1>
        <p class="text-sm text-muted">
          Anote os detalhes abaixo. Não enviamos notificações.
        </p>
      </div>

      <dl class="mt-6 space-y-3 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-muted">
            Serviço
          </dt>
          <dd class="text-right font-medium text-highlighted">
            {{ created.serviceName }}
          </dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-muted">
            Profissional
          </dt>
          <dd class="text-right font-medium text-highlighted">
            {{ created.professionalName }}
          </dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-muted">
            Data e horário
          </dt>
          <dd class="text-right font-medium text-highlighted">
            {{ formatInstantLong(created.startsAt) }}
          </dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-muted">
            Nome
          </dt>
          <dd class="text-right font-medium text-highlighted">
            {{ created.clientName }}
          </dd>
        </div>
      </dl>

      <UAlert
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-ri-information-line"
        :title="`Cancelamento até ${policy.hours}h antes`"
        :description="policy.message"
      />

      <div class="mt-6 flex flex-col gap-2 sm:flex-row">
        <UButton
          to="/meus-agendamentos"
          label="Ver meus agendamentos"
          block
        />
        <UButton
          label="Agendar outro horário"
          color="neutral"
          variant="outline"
          block
          @click="bookAnother"
        />
      </div>
    </UCard>

    <UCard
      v-else-if="!selection"
      class="mx-auto max-w-xl text-center"
    >
      <p class="text-sm text-muted">
        Serviço não encontrado. Escolha uma opção no catálogo para agendar.
      </p>
      <UButton
        to="/catalogo"
        label="Ir para o catálogo"
        class="mt-4"
      />
    </UCard>

    <template v-else>
      <div>
        <h1 class="text-2xl font-semibold text-highlighted sm:text-3xl">
          Agendar {{ selection.group.name }}
        </h1>
        <p class="mt-1 text-muted">
          Escolha a data e o horário com {{ selection.professional.name }}.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold text-highlighted">
                  {{ selection.group.name }}
                </h2>
                <p class="text-sm text-muted">
                  {{ selection.professional.name }} · {{ selection.professional.durationMin }} min
                </p>
              </div>
              <span class="whitespace-nowrap font-medium text-highlighted">
                {{ formatPrice(selection.professional.priceCents) }}
              </span>
            </div>
          </template>

          <PublicAvailabilityPicker
            :key="pickerKey"
            v-model="selectedSlot"
            :professional-id="selection.professional.id"
            :service-id="selection.professional.serviceId"
            :min-date="minDate"
          />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Seus dados
            </h2>
          </template>

          <form
            class="space-y-4"
            @submit.prevent="submit"
          >
            <div
              v-if="selectedSlot"
              class="rounded-lg border border-default px-3 py-2 text-sm"
            >
              <span class="text-muted">Horário selecionado:</span>
              <strong class="text-highlighted">{{ formatInstantLong(selectedSlot) }}</strong>
            </div>
            <p
              v-else
              class="text-sm text-muted"
            >
              Selecione um horário ao lado para continuar.
            </p>

            <UFormField
              label="Nome"
              required
            >
              <UInput
                v-model="form.name"
                placeholder="Como devemos te chamar?"
                autocomplete="name"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="WhatsApp"
              required
              help="Usamos o WhatsApp para identificar seus agendamentos."
            >
              <UInput
                v-model="form.phone"
                type="tel"
                placeholder="(11) 99999-9999"
                autocomplete="tel"
                class="w-full"
              />
              <p
                v-if="form.phone && !phoneValid"
                class="mt-1 text-xs text-error"
              >
                Informe um WhatsApp válido com DDD.
              </p>
            </UFormField>

            <UAlert
              v-if="formError"
              color="error"
              variant="subtle"
              :description="formError"
            />

            <UButton
              type="submit"
              label="Confirmar agendamento"
              :loading="submitting"
              :disabled="!canSubmit"
              block
            />

            <p class="text-xs text-muted">
              Cancelamento ou remarcação até 24h antes. Depois desse prazo,
              aplica-se a política de taxa de 50%.
            </p>
          </form>
        </UCard>
      </div>
    </template>
  </div>
</template>
