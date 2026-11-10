<script setup lang="ts">
import type { RecentClientAppointment } from '~/types/domain'
import { formatInstantLong, isoDateOfInstant } from '~/utils/date'
import { formatPhone } from '~/utils/phone'

defineProps<{
  collapsed?: boolean
  appointments: readonly RecentClientAppointment[]
  unreadCount: number
}>()

const emit = defineEmits<{ markRead: [] }>()

const open = ref(false)

// Ao fechar o sino, tudo que estava listado foi visto.
watch(open, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    emit('markRead')
  }
})

function agendaLink(item: RecentClientAppointment) {
  return `/painel?date=${isoDateOfInstant(item.startsAt)}`
}

function whatsappUrl(item: RecentClientAppointment) {
  return `https://wa.me/55${item.clientPhone}`
}
</script>

<template>
  <div class="relative">
    <UButton
      :label="collapsed ? undefined : 'Agendamentos'"
      :icon="unreadCount > 0 ? 'i-ri-notification-3-fill' : 'i-ri-notification-3-line'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      @click="open = true"
    />

    <span
      v-if="unreadCount > 0"
      class="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-white"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </div>

  <USlideover
    v-model:open="open"
    title="Agendamentos recentes"
    description="Agendamentos feitos pelas clientes nos últimos 7 dias."
  >
    <template #body>
      <div
        v-if="!appointments.length"
        class="flex flex-col items-center gap-3 px-6 py-16 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
          <UIcon name="i-ri-notification-3-line" class="size-6 text-muted" />
        </div>
        <div>
          <p class="font-medium text-highlighted">Nenhum agendamento recente</p>
          <p class="text-sm text-muted">Quando uma cliente agendar, vai aparecer aqui.</p>
        </div>
      </div>

      <ul v-else class="divide-y divide-default">
        <li v-for="item in appointments" :key="item.id" class="py-3 first:pt-0 last:pb-0">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-highlighted">{{ item.clientName }}</p>
              <p class="truncate text-sm text-muted">{{ item.serviceName }}</p>
              <p class="mt-1 text-sm text-toned">{{ formatInstantLong(item.startsAt) }}</p>
              <p class="text-sm text-muted">{{ formatPhone(item.clientPhone) }}</p>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <UButton
                :to="agendaLink(item)"
                label="Ver agenda"
                icon="i-ri-calendar-line"
                size="xs"
                color="neutral"
                variant="soft"
                @click="open = false"
              />
              <UButton
                :to="whatsappUrl(item)"
                target="_blank"
                label="WhatsApp"
                icon="i-ri-whatsapp-line"
                size="xs"
                color="success"
                variant="ghost"
              />
            </div>
          </div>
        </li>
      </ul>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <p class="text-xs text-muted">
          {{ appointments.length }}
          {{ appointments.length === 1 ? 'agendamento' : 'agendamentos' }} nos últimos 7 dias
        </p>
        <UButton
          v-if="unreadCount > 0"
          label="Marcar como lidas"
          color="neutral"
          variant="soft"
          size="xs"
          @click="emit('markRead')"
        />
      </div>
    </template>
  </USlideover>
</template>
