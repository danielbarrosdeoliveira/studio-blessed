<script setup lang="ts">
import type { ClientSummary } from '~/types/domain'
import { getApiErrorMessage } from '~/utils/error'

const props = withDefaults(
  defineProps<{
    clients?: ClientSummary[]
    /** Estado-alvo: `true` bloqueia, `false` desbloqueia. */
    blocked?: boolean
  }>(),
  {
    clients: () => [],
    blocked: false
  }
)

const emit = defineEmits<{ changed: [] }>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const saving = ref(false)

const isBlocking = computed(() => props.blocked)
const count = computed(() => props.clients.length)

const subject = computed(() =>
  count.value === 1 ? (props.clients[0]?.name ?? 'cliente') : `${count.value} clientes`
)

const title = computed(() => `${isBlocking.value ? 'Bloquear' : 'Desbloquear'} ${subject.value}?`)

const description = computed(() => {
  if (isBlocking.value) {
    const verb = count.value === 1 ? 'não vai' : 'não vão'
    return `${subject.value} ${verb} conseguir fazer novos agendamentos pelo site. Os agendamentos já marcados continuam na agenda até você cancelá-los.`
  }

  const verb = count.value === 1 ? 'volta' : 'voltam'
  return `${subject.value} ${verb} a conseguir fazer agendamentos pelo site.`
})

/** Mesma mensagem que a cliente bloqueada recebe ao tentar agendar (ver `client-blocking`). */
const publicMessage =
  'Não foi possível concluir este agendamento. Fale com o salão pelo WhatsApp para mais informações.'

const publicMessageHint = `Ao tentar agendar pelo site, ela verá: "${publicMessage}"`

async function onSubmit() {
  if (!count.value || saving.value) {
    return
  }

  saving.value = true

  try {
    const results = await Promise.allSettled(
      props.clients.map((item) =>
        $fetch(`/api/clientes/${item.id}`, {
          method: 'PATCH',
          body: { action: isBlocking.value ? 'block' : 'unblock' }
        })
      )
    )

    const failed = results.filter((result) => result.status === 'rejected')
    const updated = count.value - failed.length

    if (!updated) {
      toast.add({
        title: 'Não foi possível atualizar',
        description: getApiErrorMessage(failed[0]?.reason, 'Tente novamente.'),
        icon: 'i-ri-error-warning-line',
        color: 'error'
      })
      return
    }

    const label = isBlocking.value
      ? updated > 1
        ? 'Clientes bloqueadas'
        : 'Cliente bloqueada'
      : updated > 1
        ? 'Clientes desbloqueadas'
        : 'Cliente desbloqueada'

    toast.add({
      title: label,
      description: failed.length
        ? `${updated} de ${count.value} atualizadas.`
        : `${updated === 1 ? '1 cliente' : `${updated} clientes`} atualizadas.`,
      icon: 'i-ri-check-line',
      color: 'success'
    })

    open.value = false
    emit('changed')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="title">
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">{{ description }}</p>

        <UAlert
          v-if="isBlocking"
          color="neutral"
          variant="subtle"
          icon="i-ri-information-line"
          :description="publicMessageHint"
        />

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            :disabled="saving"
            @click="open = false"
          />
          <UButton
            :label="isBlocking ? 'Bloquear' : 'Desbloquear'"
            :color="isBlocking ? 'error' : 'primary'"
            variant="solid"
            :loading="saving"
            :disabled="!count"
            @click="onSubmit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
