<script setup lang="ts">
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Mail } from '~/types'

defineProps<{
  mail: Mail
}>()

const emits = defineEmits(['close'])

const dropdownItems = [
  [
    {
      label: 'Marcar como não lida',
      icon: 'i-ri-checkbox-circle-line'
    },
    {
      label: 'Marcar como importante',
      icon: 'i-ri-alert-line'
    }
  ],
  [
    {
      label: 'Fixar tópico',
      icon: 'i-ri-star-line'
    },
    {
      label: 'Silenciar tópico',
      icon: 'i-ri-pause-circle-line'
    }
  ]
]

const toast = useToast()

const reply = ref('')
const loading = ref(false)

function onSubmit() {
  loading.value = true

  setTimeout(() => {
    reply.value = ''

    toast.add({
      title: 'E-mail enviado',
      description: 'Seu e-mail foi enviado com sucesso',
      icon: 'i-ri-checkbox-circle-line',
      color: 'success'
    })

    loading.value = false
  }, 1000)
}
</script>

<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="mail.subject" :toggle="false">
      <template #leading>
        <UButton
          icon="i-ri-close-line"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <UTooltip text="Arquivar">
          <UButton icon="i-ri-inbox-line" color="neutral" variant="ghost" />
        </UTooltip>

        <UTooltip text="Responder">
          <UButton icon="i-ri-reply-line" color="neutral" variant="ghost" />
        </UTooltip>

        <UDropdownMenu :items="dropdownItems">
          <UButton icon="i-ri-more-2-line" color="neutral" variant="ghost" />
        </UDropdownMenu>
      </template>
    </UDashboardNavbar>

    <div
      class="flex flex-col justify-between gap-1 border-b border-default p-4 sm:flex-row sm:px-6"
    >
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar v-bind="mail.from.avatar" :alt="mail.from.name" size="3xl" />

        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ mail.from.name }}
          </p>
          <p class="text-muted">
            {{ mail.from.email }}
          </p>
        </div>
      </div>

      <p class="text-sm text-muted max-sm:pl-16 sm:mt-2">
        {{ format(new Date(mail.date), 'dd MMM HH:mm', { locale: ptBR }) }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <p class="whitespace-pre-wrap">
        {{ mail.body }}
      </p>
    </div>

    <div class="shrink-0 px-4 pb-4 sm:px-6">
      <UCard
        variant="subtle"
        class="mt-auto"
        :ui="{ header: 'flex items-center gap-1.5 text-dimmed' }"
      >
        <template #header>
          <UIcon name="i-ri-reply-line" class="size-5" />

          <span class="truncate text-sm">
            Responder para {{ mail.from.name }} ({{ mail.from.email }})
          </span>
        </template>

        <form @submit.prevent="onSubmit">
          <UTextarea
            v-model="reply"
            color="neutral"
            variant="none"
            required
            autoresize
            placeholder="Escreva sua resposta..."
            :rows="4"
            :disabled="loading"
            class="w-full"
            :ui="{ base: 'p-0 resize-none' }"
          />

          <div class="flex items-center justify-between">
            <UTooltip text="Anexar arquivo">
              <UButton color="neutral" variant="ghost" icon="i-ri-attachment-line" />
            </UTooltip>

            <div class="flex items-center justify-end gap-2">
              <UButton color="neutral" variant="ghost" label="Salvar rascunho" />
              <UButton
                type="submit"
                color="neutral"
                :loading="loading"
                label="Enviar"
                icon="i-ri-send-plane-line"
              />
            </div>
          </div>
        </form>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
