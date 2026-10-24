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
  title: 'Agendamento · Studio Blessed'
})

interface ServiceSelection {
  group: PublicServiceGroup
  professional: PublicServiceGroup['professionals'][number]
}

const route = useRoute()

const { data: groups, status } = await useFetch<PublicServiceGroup[]>('/api/public/services', {
  default: () => []
})

function findSelection(serviceId: string, professionalId: string): ServiceSelection | null {
  for (const group of groups.value) {
    const professional = group.professionals.find(item => (
      item.id === professionalId && item.serviceId === serviceId
    ))

    if (professional) {
      return { group, professional }
    }
  }

  return null
}

const initialServiceId = typeof route.query.serviceId === 'string' ? route.query.serviceId : ''
const initialProfessionalId = typeof route.query.professionalId === 'string' ? route.query.professionalId : ''
const initialSelection = findSelection(initialServiceId, initialProfessionalId)
const hadInitialQuery = !!initialServiceId || !!initialProfessionalId

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

function selectService(group: PublicServiceGroup) {
  const professional = group.professionals[0]

  if (!professional) {
    return
  }

  selectedService.value = { group, professional }
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
        professionalId: selectedService.value.professional.id,
        serviceId: selectedService.value.professional.serviceId,
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
            Cada serviço tem uma profissional responsável.
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
        v-else-if="groups.length"
        class="grid gap-4 sm:grid-cols-2"
      >
        <UCard
          v-for="group in groups"
          :key="group.name"
          data-testid="service-option"
          :class="selectedService?.group.name === group.name ? 'ring-2 ring-primary' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold text-highlighted">
                {{ group.name }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                Profissional responsável
              </p>
              <p class="text-sm text-highlighted">
                {{ group.professionals[0]?.name }}
              </p>
              <p class="text-sm text-muted">
                {{ group.professionals[0]?.durationMin }} min
              </p>
            </div>

            <UBadge
              color="primary"
              variant="subtle"
            >
              {{ formatPrice(group.minPriceCents) }}
            </UBadge>
          </div>

          <UButton
            class="mt-4"
            :label="selectedService?.group.name === group.name ? 'Selecionado' : 'Selecionar'"
            :color="selectedService?.group.name === group.name ? 'primary' : 'neutral'"
            :variant="selectedService?.group.name === group.name ? 'solid' : 'outline'"
            block
            @click="selectService(group)"
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

    <template v-else-if="step === 1 && selectedService">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold text-highlighted">
                  Escolha a data e o horário
                </h2>
                <p class="text-sm text-muted">
                  {{ selectedService.group.name }} · {{ selectedService.professional.durationMin }} min
                </p>
              </div>
              <span class="whitespace-nowrap font-medium text-highlighted">
                {{ formatPrice(selectedService.professional.priceCents) }}
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
            :professional-id="selectedService.professional.id"
            :service-id="selectedService.professional.serviceId"
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
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Serviço
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.group.name }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Profissional
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.professional.name }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Duração
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.professional.durationMin }} min
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Preço
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ formatPrice(selectedService.professional.priceCents) }}
              </dd>
            </div>
            <div
              v-if="selectedSlot"
              class="flex justify-between gap-4"
            >
              <dt class="text-muted">
                Horário
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ formatInstantLong(selectedSlot) }}
              </dd>
            </div>
          </dl>

          <UButton
            class="mt-4"
            label="Trocar serviço"
            color="neutral"
            variant="outline"
            block
            @click="changeService"
          />
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
              <p class="text-muted">
                Horário selecionado
              </p>
              <p class="font-medium text-highlighted">
                {{ formatInstantLong(selectedSlot) }}
              </p>
            </div>

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
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Serviço
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.group.name }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Profissional
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.professional.name }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Duração
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ selectedService.professional.durationMin }} min
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Preço
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ formatPrice(selectedService.professional.priceCents) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">
                Horário
              </dt>
              <dd class="text-right font-medium text-highlighted">
                {{ formatInstantLong(selectedSlot) }}
              </dd>
            </div>
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
