<script setup lang="ts">
import type {
  PublicAppointment,
  PublicAppointmentResponse,
  PublicCancellationPolicy,
  Service
} from '~/types/domain'
import { addDaysToIsoDate, formatInstantLong, todayInTimeZone } from '~/utils/date'
import { getApiErrorMessage } from '~/utils/error'
import { normalizePhoneDigits } from '~/utils/phone'

definePageMeta({
  layout: 'public'
})

useHead({
  title: 'Agendamento · Studio Blessed'
})

interface ServiceSelection {
  service: Service
}

const route = useRoute()

const { data: services, status } = await useFetch<Service[]>('/api/public/services', {
  default: () => []
})

function findSelection(serviceId: string): ServiceSelection | null {
  const service = services.value?.find(item => item.id === serviceId)
  if (!service) {
    return null
  }

  return { service }
}

const initialServiceId = typeof route.query.serviceId === 'string' ? route.query.serviceId : ''
const initialSelection = findSelection(initialServiceId)
const hadInitialQuery = !!initialServiceId

const selectedService = ref<ServiceSelection | null>(initialSelection)
const step = ref(initialSelection ? 1 : 0)
const selectedSlot = ref<string | null>(null)
const pickerKey = ref(0)
const form = reactive({ name: '', phone: '' })
const submitting = ref(false)
const formError = ref('')
const created = ref<PublicAppointment | null>(null)
const policy = ref<PublicCancellationPolicy | null>(null)

const steps = [
  { title: 'Serviço', icon: 'i-ri-scissors-line' },
  { title: 'Horário', icon: 'i-ri-calendar-line' },
  { title: 'Dados', icon: 'i-ri-user-line' },
  { title: 'Concluir', icon: 'i-ri-check-line' }
]

const minDate = computed(() => addDaysToIsoDate(todayInTimeZone(), 3))

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const phoneValid = computed(() => normalizePhoneDigits(form.phone) !== null)
const canSubmit = computed(() => (
  !!selectedService.value
  && !!selectedSlot.value
  && form.name.trim().length >= 2
  && phoneValid.value
))

watch(step, (value) => {
  if (value !== 3) {
    created.value = null
    policy.value = null
  }
})

function formatPrice(cents: number) {
  return brl.format(cents / 100)
}

function selectService(service: Service) {
  selectedService.value = { service }
  selectedSlot.value = null
  formError.value = ''
  pickerKey.value += 1
  step.value = 1
}

function changeService() {
  selectedService.value = null
  selectedSlot.value = null
  formError.value = ''
  step.value = 0
}

async function submit() {
  if (!selectedService.value || !selectedSlot.value || !canSubmit.value) {
    return
  }

  submitting.value = true
  formError.value = ''

  try {
    const response = await $fetch<PublicAppointmentResponse>('/api/public/appointments', {
      method: 'POST',
      body: {
        serviceId: selectedService.value.service.id,
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

    step.value = 3
  } catch (error) {
    formError.value = getApiErrorMessage(error, 'Não foi possível concluir o agendamento.')

    const status = (error as { statusCode?: number, status?: number } | null)?.statusCode
      ?? (error as { status?: number } | null)?.status

    if (status === 409) {
      selectedSlot.value = null
      pickerKey.value += 1
      step.value = 1
    }
  } finally {
    submitting.value = false
  }
}

function bookAnother() {
  created.value = null
  policy.value = null
  selectedSlot.value = null
  formError.value = ''
  pickerKey.value += 1
  step.value = 1
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted sm:text-3xl">
        Agendamento
      </h1>
      <p class="mt-1 text-muted">
        Escolha o serviço, o horário e informe seus dados para reservar.
      </p>
    </div>

    <UStepper
      v-model="step"
      :items="steps"
      disabled
      size="sm"
      class="w-full"
    />

    <UCard v-if="step === 0">
      <template #header>
        <div>
          <h2 class="font-semibold text-highlighted">
            Escolha o serviço
          </h2>
          <p class="text-sm text-muted">
            Cada serviço pertence à dona do salão.
          </p>
        </div>
      </template>

      <UAlert
        v-if="hadInitialQuery && !initialSelection"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="i-ri-information-line"
        title="Serviço não encontrado"
        description="O serviço do link não está mais disponível. Escolha outra opção abaixo."
      />

      <div
        v-if="status === 'pending'"
        class="grid gap-4 sm:grid-cols-2"
      >
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="h-36"
        />
      </div>

      <div
        v-else-if="services.length"
        class="grid gap-4 sm:grid-cols-2"
      >
        <UCard
          v-for="service in services"
          :key="service.id"
          data-testid="service-option"
          :class="selectedService?.service.id === service.id ? 'ring-2 ring-primary' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-highlighted">
                {{ service.name }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                Profissional responsável
              </p>
              <p class="text-sm text-highlighted">
                {{ service.professionalName }}
              </p>
              <p class="text-sm text-muted">
                {{ service.durationMin }} min
              </p>
            </div>

            <UBadge
              color="primary"
              variant="subtle"
            >
              {{ formatPrice(service.priceCents) }}
            </UBadge>
          </div>

          <UButton
            class="mt-4"
            :label="selectedService?.service.id === service.id ? 'Selecionado' : 'Selecionar'"
            :color="selectedService?.service.id === service.id ? 'primary' : 'neutral'"
            :variant="selectedService?.service.id === service.id ? 'solid' : 'outline'"
            block
            @click="selectService(service)"
          />
        </UCard>
      </div>

      <p
        v-else
        class="py-6 text-center text-sm text-muted"
      >
        Nenhum serviço disponível no momento.
      </p>

      <div
        v-if="selectedService"
        class="mt-4 flex justify-end"
      >
        <UButton
          label="Continuar"
          trailing-icon="i-ri-arrow-right-line"
          @click="step = 1"
        />
      </div>
    </UCard>

    <template v-else-if="step === 1 && selectedService && selectedSlot">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold text-highlighted">
                  Escolha a data e o horário
                </h2>
                <p class="text-sm text-muted">
                  {{ selectedService.service.name }} · {{ selectedService.service.durationMin }} min
                </p>
              </div>
              <span class="whitespace-nowrap font-medium text-highlighted">
                {{ formatPrice(selectedService.service.priceCents) }}
              </span>
            </div>
          </template>

          <UAlert
            v-if="formError"
            class="mb-4"
            color="error"
            variant="subtle"
            :description="formError"
          />

          <AvailabilityPicker
            :key="pickerKey"
            v-model="selectedSlot"
            :professional-id="selectedService.service.id"
            :service-id="selectedService.service.id"
            :min-date="minDate"
          />

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <UButton
              label="Voltar"
              icon="i-ri-arrow-left-line"
              color="neutral"
              variant="ghost"
              @click="step = 0"
            />
            <UButton
              label="Continuar"
              trailing-icon="i-ri-arrow-right-line"
              :disabled="!selectedSlot"
              @click="step = 2"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Resumo
            </h2>
          </template>

          <dl class="space-y-3 text-sm">
            <dt class="text-neutral-500 dark:text-neutral-400">
              Serviço
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ selectedService.service.name }}
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Profissional
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ selectedService.service.professionalName }}
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Duração
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ selectedService.service.durationMin }} min
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Preço
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ formatPrice(selectedService.service.priceCents) }}
            </dd>
            <dt v-if="selectedSlot" class="text-neutral-500 dark:text-neutral-400">
              Horário
            </dt>
            <dd v-if="selectedSlot" class="text-right font-medium text-neutral-100">
              {{ formatInstantLong(selectedSlot) }}
            </dd>
          </dl>

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <UButton
              label="Voltar"
              icon="i-ri-arrow-left-line"
              color="neutral"
              variant="ghost"
              @click="step = 0"
            />
            <UButton
              label="Continuar"
              trailing-icon="i-ri-arrow-right-line"
              :disabled="!selectedSlot"
              @click="step = 2"
            />
          </div>
        </UCard>
      </div>
    </template>

    <template v-else-if="step === 2 && selectedService && selectedSlot">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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
            <div class="rounded-lg border border-default px-3 py-2 text-sm">
              <p class="text-neutral-500 dark:text-neutral-400">
                Horário selecionado
              </p>
              <p class="font-medium text-highlighted dark:text-neutral-100">
                {{ formatInstantLong(selectedSlot) }}
              </p>
            </div>

            <UFormField
              label="Nome"
              required
              class="label-container"
            >
              <UInput
                v-model="form.name"
                placeholder="Como devemos te chamar?"
                autocomplete="name"
                class="w-full dark:text-white dark:placeholder-neutral-500"
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
                class="w-full dark:text-white dark:placeholder-neutral-500"
              />
              <p
                v-if="form.phone && !phoneValid"
                class="mt-1 text-xs text-error"
              >
                Informe um WhatsApp válido com DDD.
              </p>
            </UFormField>

            <p class="mt-3 text-xs text-muted">
              Ao informar seu nome e WhatsApp, você concorda com o armazenamento
              desses dados para identificação de agendamentos, conforme nossa
              política de privacidade. Dados são armazenados na agenda interna do
              salão e podem ser acessados a qualquer momento para consulta ou
              correção.
            </p>

            <UAlert
              v-if="formError"
              color="error"
              variant="subtle"
              :description="formError"
            />

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <UButton
                label="Voltar"
                icon="i-ri-arrow-left-line"
                color="neutral"
                variant="ghost"
                @click="step = 1"
              />
              <UButton
                type="submit"
                label="Confirmar agendamento"
                :loading="submitting"
                :disabled="!canSubmit"
              />
            </div>

            <p class="text-xs text-muted">
              Cancelamento ou remarcação até 24h antes. Depois desse prazo,
              aplica-se a política de taxa de 50%.
            </p>
          </form>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Resumo
            </h2>
          </template>

          <dl class="space-y-3 text-sm">
            <dt class="text-muted">
              Serviço
            </dt>
            <dd class="text-right font-medium text-highlighted">
              {{ selectedService.service.name }}
            </dd>
            <dt class="text-muted">
              Profissional
            </dt>
            <dd class="text-right font-medium text-highlighted">
              {{ selectedService.service.professionalName }}
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Duração
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ selectedService.service.durationMin }} min
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Preço
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ formatPrice(selectedService.service.priceCents) }}
            </dd>
            <dt class="text-neutral-500 dark:text-neutral-400">
              Horário
            </dt>
            <dd class="text-right font-medium text-neutral-100">
              {{ formatInstantLong(selectedSlot) }}
            </dd>
          </dl>
        </UCard>
      </div>
    </template>

    <UCard
      v-else-if="step === 3 && created && policy"
      class="mx-auto max-w-xl"
    >
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-success/10">
          <UIcon
            name="i-ri-check-line"
            class="size-6 text-success"
          />
        </div>
        <h2 class="text-xl font-semibold text-highlighted">
          Agendamento confirmado
        </h2>
        <p class="text-sm text-muted">
          Anote os detalhes abaixo. Não enviamos notificações.
        </p>
      </div>

      <dl class="mt-6 space-y-3 text-sm">
        <dt class="text-neutral-500 dark:text-neutral-400">
          Serviço
        </dt>
        <dd class="text-right font-medium text-neutral-100">
          {{ created.serviceName }}
        </dd>
        <dt class="text-neutral-500 dark:text-neutral-400">
          Profissional
        </dt>
        <dd class="text-right font-medium text-neutral-100">
          {{ created.professionalName }}
        </dd>
        <dt class="text-neutral-500 dark:text-neutral-400">
          Data e horário
        </dt>
        <dd class="text-right font-medium text-neutral-100">
          {{ formatInstantLong(created.startsAt) }}
        </dd>
        <dt class="text-neutral-500 dark:text-neutral-400">
          Nome
        </dt>
        <dd class="text-right font-medium text-neutral-100">
          {{ created.clientName }}
        </dd>
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

      <UButton
        class="mt-2"
        label="Escolher outro serviço"
        color="neutral"
        variant="ghost"
        block
        @click="changeService"
      />
    </UCard>

    <UCard
      v-else
      class="mx-auto max-w-xl text-center"
    >
      <p class="text-sm text-muted">
        Não foi possível continuar o agendamento. Volte ao início e tente novamente.
      </p>
      <UButton
        label="Voltar ao início"
        class="mt-4"
        @click="changeService"
      />
    </UCard>
  </div>
</template>